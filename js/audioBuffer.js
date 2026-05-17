// audioBufferScript.js

export const progresses = new Map();
export let overallProgress = 0;
export let abortController = null;

// update download state each update_ms

const UPDATE_MS = 60;

/**
 * Loads all audio files for this song into buffers.
 * This ensures the music is ready before the mixer tries to play it.
 */
export async function loadBuffers(song, onProgress) {
    if (song.isLoaded) return;

    console.log(`Loading buffers for: ${song.title}...`);

    resetLoadingState();
    const signal = createAbortController();

    const promises = song.tracks.map(track =>
        loadTrack(track, signal, onProgress)
    );

    try {
        await Promise.all(promises);

        ensureNotAborted(signal);

        song.isLoaded = true;
        song.calculateMaxDuration();
        console.log(`All buffers ready for: ${song.title}`);
    } catch (error) {
        console.log(`Loading cycle interrupted or failed for: ${song.title}`);
        song.isLoaded = false;
        throw error; // Propagates the exception up to the selection chain
    }
}

async function loadTrack(track, signal, onProgress) {
    if (track.buffer) return;

    try {
        const { chunks } = await downloadTrack(track, signal, onProgress);

        const audioBuffer = await decodeChunksToBuffer(
            chunks,
            track,
            signal,
            onProgress
        );

        track.buffer = audioBuffer;
        // markTrackReady(track, onProgress);
        updateProgress(track,1,onProgress,"READY");
    } catch (error) {
        handleTrackError(track, error);
    }
}

function updateProgress(track, progress, onProgress, phase) {
    progresses.set(track.label, progress);
    calculateOverallProgress(track, onProgress);
    onProgress?.(
        track.id,
        progress,
        overallProgress,
        phase
    );
}


function calculateOverallProgress(track, onProgress) {
    const values = [...progresses.values()];
    overallProgress = values.reduce((a, b) => a + b, 0) / values.length;
}


async function downloadTrack(track, signal, onProgress) {
    const response = await fetch(track.url, {
        signal,
        cache: 'force-cache'
    });

    const total = Number(response.headers.get("Content-Length")) || 0;
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    // Keep track of the last timestamp an update was allowed through
    let lastUpdateTime = 0;

    while (true) {
        if (signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
        }

        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        received += value.length;

        const progress = total ? received / total : 0;
        const now = performance.now();

        if (now - lastUpdateTime >= UPDATE_MS) {
            updateProgress(track, progress, onProgress, "DOWNLOADING");
            lastUpdateTime = now;
        }
    }

    return { chunks, total, received };
}

function handleTrackError(track, error) {
    if (error.name === 'AbortError') {
        console.log(`Download aborted for track: ${track.label}`);
    } else {
        console.error(`Error loading track ${track.label}:`, error);
    }
    throw error; // Rethrowing forces Promise.all to break instantly
}

function ensureNotAborted(signal) {
    if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
    }
}

export function mergeChunks(chunks) {
    const size = chunks.reduce((acc, c) => acc + c.length, 0);
    const audioData = new Uint8Array(size);

    let offset = 0;
    for (const chunk of chunks) {
        audioData.set(chunk, offset);
        offset += chunk.length;
    }

    return audioData;
}

async function decodeChunksToBuffer(chunks, track, signal, onProgress) {
    onProgress?.(track.id, 1, overallProgress, "DECODING");

    const audioData = mergeChunks(chunks);
    ensureNotAborted(signal);

    const audioBuffer = await Tone.getContext()
        .rawContext
        .decodeAudioData(audioData.buffer);

    const toneBuffer = new Tone.ToneAudioBuffer();
    toneBuffer.set(audioBuffer);

    return toneBuffer;
}

function createAbortController() {
    abortController = new AbortController();
    return abortController.signal;
}

function resetLoadingState() {
    progresses.clear();
    overallProgress = 0;
}

export function cancelLoading() {
    if (abortController) {
        abortController.abort();
    }
    resetLoadingState();
}