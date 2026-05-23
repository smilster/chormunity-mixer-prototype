// imports


import {Song, songs} from "./Song.js";
import {createTableSongSelector, highlightActiveSong} from "./songSelector.js";

import {createMixer, createTrackControls, initializeMixer, updateMeters} from "./mixer.js";
import {transportStop} from "./transportButtons.js";
import {cancelLoading, loadBuffersAndUpdateProgressBars} from "./audioBuffer.js";
import {resetLoop, configureTimeLine, updateTimelineMarker} from "./timeline.js";
import {updatePositionDisplay} from "./transportDisplays.js";

import {resetBPMControls} from "./bpmControls.js";
import {timelineControls, transportControls, createTransportControls, createTimelineControls} from "./controlPanels.js";
import {Master} from "./Master.js";

//  global transport propertie
//


Tone.getContext().rawContext.sampleRate

Tone.context._latencyHint = "playback";
Tone.context._lookAhead = 0.06;
Tone.context.updateInterval = 0.03


// Tone.getTransport().PPQ = 196; // pulse per quarter note, better keep unchanged


// load some songs from database (saved in 'songs' directory
await Song.fromSongDatabase("dontStop")
await Song.fromSongDatabase("baraye")
await Song.fromSongDatabase("schief")
await Song.fromSongDatabase("hans")
await Song.fromSongDatabase("click-4-4")

export let activeSong = null;
export let playbackRate = 1;



const   choirMixerContainer = initializeLayout('choir-mixer')


function createFlexGap(){
    const flexGap = document.createElement("div");
    flexGap.id = "flex-grow";
    return flexGap;
}

function initializeLayout(parentDivId) {

    // choir-mixer div as defined in html
    const choirMixerContainer = document.getElementById(parentDivId);
    choirMixerContainer.className = "flex-column w-100 minh-1vw";
    choirMixerContainer.style.alignItems = "center";



    // choirMixerContainer.appendChild(createFlexGap());
    choirMixerContainer.appendChild(createTableSongSelector());
    // choirMixerContainer.appendChild(createFlexGap());

    return  choirMixerContainer;
}

export async function selectSong(songId, onProgress) {
    // If selected song is identical with active Song, do nothing
    if (activeSong && songs.get(songId) === activeSong) return;

    transportControls.style.display = "none";
    timelineControls.style.display = 'none';

    // if there is no active song, this is the first time song select is called
    // create empty Mixer and empty transport. consider moving this to own method initializeChoirMixer()
    if (!activeSong) {
        Master.connect(Tone.Destination);
        choirMixerContainer.prepend(createTransportControls())
        choirMixerContainer.prepend(createTimelineControls())
        choirMixerContainer.prepend(createMixer())
    }


    // If there's an active song currently cancel everything it first!
    if (activeSong) {
        cancelLoading();
        activeSong.disconnect(); // Ensure dispose cleans up references
        transportStop();
    }

    // Now set activeSong

    resetLoop();
    activeSong = songs.get(songId);
    highlightActiveSong(activeSong); // update song selector


    // Initialize UI mixer elements
    const strips = initializeMixer(activeSong);

    if (activeSong.isLoaded === true) {
        finalizeControls()
        return;
    }

    // Safely manage the loading pipeline
    try {
        await loadBuffersAndUpdateProgressBars(activeSong, strips, onProgress);

        // This ONLY runs if loadSongBuffers successfully finishes without being aborted
        finalizeControls()
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log("Previous song loading successfully aborted. Stopping setup lifecycle.");
        } else {
            console.error("Failed to load song due to a critical error:", error);
        }
    }
}

function finalizeControls() {
    activeSong.connect(Master.bus);


    configureTransport();
    configureTimeLine();
    resetBPMControls();

    createTrackControls(activeSong);
    transportControls.style.display = "";
    timelineControls.style.display = "";

}


function configureTransport() {
    Tone.getTransport().bpm.value = activeSong.bpm;
    Tone.getTransport().timeSignature = activeSong.timeSignature;
    Tone.getTransport().loop = true;
    Tone.getTransport().loopStart = 0;
    Tone.getTransport().loopEnd = activeSong.duration;
}




function updateSlowUI() {
    if (activeSong && activeSong.isLoaded) {
        updateTimelineMarker();
        updatePositionDisplay();
        // updateTimeDisplay()
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

async function selectSongFromUrlParameter() {
    const params = new URLSearchParams(window.location.search);
    const songId = params.get("song");
    if (songId && songs.get(songId)) {
        await selectSong(songId)
    }
}

// start gui
updateFastUI();
updateSlowUI();

await selectSongFromUrlParameter();

selectSong("click-4-4")