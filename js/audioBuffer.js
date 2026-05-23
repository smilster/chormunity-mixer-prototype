// audioBuffer.js

import {
    clearProgress,
    createProgress,
    updateOverallProgress,
    updateProgress
} from "./progressBars.js";

// Global tracking variables
export const progresses = new Map();
export let overallProgress = 0;
export let abortController = null;

const THROTTLE_MS = 250;

/**
 * Orchestrates the full UI creation, track download lifecycle management,
 * and safely clears active background execution frames.
 */
export async function loadBuffersAndUpdateProgressBars(song, strips, onProgressCallback) {
    terminateActiveTransfers();

    initializeProgressTrackingState(song);

    renderInitialUIStructure(song, strips);

    if (song.isLoaded) {
        markWholeSongReady(song, onProgressCallback);
        return;
    }

    try {
        const signal = initCancellationSignal();
        await runConcurrentDownloads(song, signal, onProgressCallback);
        finalizeSongCompilation(song);
    } catch (error) {
        syncUIOnPipelineFailure(song);
        handleGlobalPipelineFailure(song, error);
    }
}

export function cancelLoading() {
    terminateActiveTransfers();
}

/* ==========================================
   STATE MANAGEMENT & CANCELLATION
   ========================================== */

function terminateActiveTransfers() {
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
    progresses.clear();
    overallProgress = 0;
}

function initCancellationSignal() {
    abortController = new AbortController();
    return abortController.signal;
}

function initializeProgressTrackingState(song) {
    song.tracks.forEach(track => {
        const initialProgress = track.buffer ? 1 : 0;
        progresses.set(track.label, initialProgress);
    });
    recalculateMetricAverages();
}

/* ==========================================
   UI SYNCHRONIZATION
   ========================================== */

function renderInitialUIStructure(song, strips) {
    clearProgress();
    strips.forEach((strip, index) => {
        createProgress(index, strip);

        const track = song.tracks[index];
        if (track && track.buffer) {
            updateProgress(index, 1, "READY");
        } else if (index === song.numTracks) {
            console.log(song.numTracks)
            updateOverallProgress();
        } else {
            updateProgress(index, 0, "PENDING");
        }
    });


}

function syncUIOnPipelineFailure(song) {
    song.tracks.forEach((track, index) => {
        if (track.buffer) {
            updateProgress(index, 1, "READY");
        } else if (index === song.numTracks) {
            updateOverallProgress()
        } else {
            updateProgress(index, 0, "PENDING");
        }
    });
}

function markWholeSongReady(song, onProgressCallback) {
    song.tracks.forEach((track, index) => {
        updateProgress(index, 1, "READY");
        onProgressCallback?.(track.id, 1, 1, "READY");
    });
}

/* ==========================================
   CONCURRENT DOWNLOAD PIPELINE
   ========================================== */

async function runConcurrentDownloads(song, signal, onProgressCallback) {
    console.log(`Loading buffers for: ${song.title}...`);

    const workers = song.tracks.map((track, index) =>
        processSingleTrackLifecycle(track, index, signal, onProgressCallback)
    );



    await Promise.all(workers);
    assertSignalLiveness(signal);
    updateOverallProgress("READY")

    //  hold READY state before UI transitions / song activation
    try {
        await delay(500, signal);
    } catch (e) {
        if (e.name === "AbortError") return;
        throw e;
    }
}

function finalizeSongCompilation(song) {
    song.isLoaded = true;
    song.calculateMaxDuration();
    // console.log(`All buffers synchronized for: ${song.title}`);
}

function handleGlobalPipelineFailure(song, error) {
    song.isLoaded = false;
    if (error.name === 'AbortError') {
        console.log(`Download cancellation cycle executed for: ${song.title}`);
    } else {
        console.error(`Critical error caught on pipeline orchestration for ${song.title}:`, error);
    }
    throw error;
}

/* ==========================================
   INDIVIDUAL TRACK LIFECYCLE
   ========================================== */

async function processSingleTrackLifecycle(track, trackIndex, signal, onProgressCallback) {

    if (track.buffer) {
        broadcastTrackProgress(track, trackIndex, 1, "READY", onProgressCallback);
        return;
    }

    try {
        const chunks = await downloadTrackStream(track, trackIndex, signal, onProgressCallback);
        const compiledRawData = consolidateChunks(chunks);

        assertSignalLiveness(signal);

        track.buffer = await decodeRawAudioData(compiledRawData, track, trackIndex, onProgressCallback);
        broadcastTrackProgress(track, trackIndex, 1, "READY", onProgressCallback);
    } catch (trackError) {
        if (trackError.name !== 'AbortError') {
            broadcastTrackProgress(track, trackIndex, progresses.get(track.label) || 0, "ERROR", onProgressCallback);
            console.error(`Track Processing failure inside sequence ${track.label}:`, trackError);
        }
        throw trackError;
    }
}

/* ==========================================
   NETWORK AND STREAMING
   ========================================== */

async function downloadTrackStream(track, trackIndex, signal, onProgressCallback) {
    const response = await fetch(track.url, { signal, cache: 'force-cache' });
    if (!response.ok) {
        throw new Error(`Server returned unhealthy code: ${response.status}`);
    }

    const totalByteSize = Number(response.headers.get("Content-Length")) || 0;
    const streamReader = response.body.getReader();

    return await readStreamLoop(streamReader, track, trackIndex, totalByteSize, signal, onProgressCallback);
}

async function readStreamLoop(reader, track, trackIndex, totalSize, signal, onProgressCallback) {
    const segments = [];
    let processedBytes = 0;
    let lastThrottledTime = performance.now();

    while (true) {
        assertSignalLiveness(signal);

        const { done, value } = await reader.read();
        if (done) break;

        segments.push(value);
        processedBytes += value.length;

        const dynamicRatio = totalSize ? processedBytes / totalSize : 0;
        const invocationTime = performance.now();

        if (invocationTime - lastThrottledTime >= THROTTLE_MS || dynamicRatio === 1) {
            broadcastTrackProgress(track, trackIndex, dynamicRatio, "LOADING", onProgressCallback);
            lastThrottledTime = invocationTime;
        }
    }
    return segments;
}

/* ==========================================
   AUDIO DECODING & DATA COMPILATION
   ========================================== */

async function decodeRawAudioData(rawBytes, track, trackIndex, onProgressCallback) {
    broadcastTrackProgress(track, trackIndex, 1, "DECODING", onProgressCallback);

    const audioContext = Tone.getContext().rawContext;
    const nativeAudioBuffer = await audioContext.decodeAudioData(rawBytes.buffer);

    const toneAudioWrapper = new Tone.ToneAudioBuffer();
    toneAudioWrapper.set(nativeAudioBuffer);

    return toneAudioWrapper;
}

function consolidateChunks(chunksArray) {
    const byteLengthSum = chunksArray.reduce((acc, chunk) => acc + chunk.length, 0);
    const flattenedBuffer = new Uint8Array(byteLengthSum);

    let writingPointer = 0;
    for (const dataChunk of chunksArray) {
        flattenedBuffer.set(dataChunk, writingPointer);
        writingPointer += dataChunk.length;
    }
    return flattenedBuffer;
}

/* ==========================================
   MATH & METRIC HELPERS
   ========================================== */

function broadcastTrackProgress(track, trackIndex, trackValue, phase, outputCallback) {
    progresses.set(track.label, trackValue);
    recalculateMetricAverages();

    // Direct, local UI synchronization bypasses any external callback bugs
    updateProgress(trackIndex, trackValue, phase);
    updateOverallProgress();

    // Also fire the external callback safely using track parameters for any global headers
    outputCallback?.(track.id, trackValue, overallProgress, phase);
}

function recalculateMetricAverages() {
    const snapshots = [...progresses.values()];
    if (snapshots.length === 0) {
        overallProgress = 0;
        return;
    }
    const sum = snapshots.reduce((accumulator, item) => accumulator + item, 0);
    overallProgress = sum / snapshots.length;
}

function assertSignalLiveness(signal) {
    if (signal && signal.aborted) {
        throw new DOMException("The loading task has been explicitly terminated.", "AbortError");
    }
}

function delay(ms, signal) {
    return new Promise((resolve, reject) => {
        const id = setTimeout(resolve, ms);

        if (signal) {
            if (signal.aborted) {
                clearTimeout(id);
                return reject(new DOMException("Aborted", "AbortError"));
            }

            signal.addEventListener("abort", () => {
                clearTimeout(id);
                reject(new DOMException("Aborted", "AbortError"));
            }, { once: true });
        }
    });
}