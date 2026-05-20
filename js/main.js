// imports


import {Song, songs} from "./Song.js";
import {createSongSelector, songSelector} from "./songSelector.js";
import {createMixer, createTrackControls, initializeMixer, updateMeters} from "./mixer.js";
import {transportStop} from "./transportButtons.js";
import {updateProgress, createProgress, clearProgress} from "./progressBars.js";
import {loadBuffers, cancelLoading} from "./audioBuffer.js";
import {resetLoop, configureTimeLine, updateTimelineMarker} from "./timeline.js";
import {createTransportControl, transportControls} from "./transportControl.js";
import {updatePositionDisplay, updateTimeDisplay} from "./transportDisplays.js";

import {bpmControls, createBpmControls, resetBPMControls} from "./bpmControls.js";

//  global transport propertie
//
Tone.getContext().rawContext.sampleRate

Tone.context._latencyHint = "playback";
Tone.context._lookAhead = 0.06;
Tone.context.updateInterval = 0.03
// Tone.getTransport().PPQ = 196;
//

// set default songID

const DEFAULT_SONG_ID = "hans"

// load some songs from database (saved in 'songs' directory
await Song.fromSongDatabase("hans")
await Song.fromSongDatabase("dontStop")
await Song.fromSongDatabase("baraye")
await Song.fromSongDatabase("schief")

export let activeSong = null;
export let playbackRate = 1;

const choirMixerContainer = document.getElementById("choir-mixer");
choirMixerContainer.classList.add("flex-column", "w-90", "center");


// createSongSelector(choirMixerContainer);


export async function selectSong(songID, onProgress) {
    transportControls.style.display = "none";
    bpmControls.style.display = 'none';

    // if there is no active song, this is the first time song select is called
    // create empty Mixer and empty transport
    if (!activeSong) {
        createMixer(choirMixerContainer);
        createTransportControl(choirMixerContainer);
        createBpmControls(choirMixerContainer);
    }


    // If selected song is identical with active Song, do nothing
    if (songs.get(songID) === activeSong) {
        return;
    }

    // If there's an active song currently downloading, cancel it first!
    if (activeSong) {

        cancelLoading();
        transportStop();
        activeSong.disconnect(); // Ensure dispose cleans up references
    }

    // Now set activeSong

    resetLoop();
    activeSong = songs.get(songID);


    // Initialize UI mixer elements
    const strips = initializeMixer(activeSong);

    if (activeSong.isLoaded === true) {
        finalizeControls(0)
        return;
    }

    // Safely manage the loading pipeline
    try {
        await loadBuffersAndUpdateProgressBars(activeSong, strips, onProgress);

        // This ONLY runs if loadSongBuffers successfully finishes without being aborted
        finalizeControls(500)
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log("Previous song loading successfully aborted. Stopping setup lifecycle.");
        } else {
            console.error("Failed to load song due to a critical error:", error);
        }
    }
}

function finalizeControls(delay) {
    configureTransport();
    activeSong.connect();
    configureTimeLine();
    resetBPMControls();
    setTimeout(() => {
        createTrackControls(activeSong);
        transportControls.style.display = "";
        bpmControls.style.display = "";
    }, delay)

}

function configureTransport() {
    Tone.getTransport().bpm.value = activeSong.bpm;
    Tone.getTransport().timeSignature = activeSong.timeSignature;
    Tone.getTransport().loop = true;
    Tone.getTransport().loopStart = 0;
    Tone.getTransport().loopEnd = activeSong.duration;
}


async function loadBuffersAndUpdateProgressBars(song, strips, onProgress) {
    clearProgress();

    strips.forEach((strip, id) => {
        createProgress(id, strip);
    });

    try {
        // Await the lower-level buffer utility
        await loadBuffers(song, (id, trackProgress, songProgress, stateString) => {
            onProgress?.(id, trackProgress, songProgress, stateString);
            updateProgress(id, trackProgress, stateString);
        });
    } catch (error) {
        // We must rethrow the error so selectSong knows loading failed/aborted!
        throw error;
    }
}

function updateSlowUI() {
    if (activeSong && activeSong.isLoaded) {
        updateTimelineMarker();
        updatePositionDisplay();
        updateTimeDisplay()
    }
    setTimeout(updateSlowUI, 80);
}

function updateFastUI() {
    if (activeSong && activeSong.isLoaded) {
        updateMeters(activeSong)
    }

    requestAnimationFrame(updateFastUI);
}


export function updateTempo(newPlaybackRate) {
    playbackRate = newPlaybackRate;
    Tone.getTransport().bpm.value = activeSong.bpm * newPlaybackRate;
    activeSong.tracks.forEach(track => {
        track.player.playbackRate = newPlaybackRate;
    })
    configureTimeLine()
}

// select song from url-parameters

async function selectSongFromUrl() {
    const params = new URLSearchParams(window.location.search);
    let songID = params.get("song") ? params.get("song") : DEFAULT_SONG_ID;
    await selectSong(songID)
}

// start gui
updateFastUI();
updateSlowUI();

await selectSongFromUrl();