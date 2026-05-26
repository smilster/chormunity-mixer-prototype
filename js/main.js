// imports


import {Song, songs} from "./Song.js";
import {createTableSongSelector, highlightActiveSong} from "./songSelector.js";


import {Mixer} from "./Mixer.js";

import {transportStop} from "./transportButtons.js";
import { configureTimeLine, updateTimelineMarker} from "./timeline.js";
import {updatePositionDisplay} from "./transportDisplays.js";

import {resetBPMControls} from "./bpmControls.js";
import {timelineControls, transportControls, createTransportControls, createTimelineControls} from "./controlPanels.js";
import {Master} from "./Master.js";





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
        configureTone();
        Master.connect(Tone.Destination);
        choirMixerContainer.prepend(createTransportControls())
        choirMixerContainer.prepend(createTimelineControls())
        choirMixerContainer.prepend(Mixer.create())
    }


    // If there's an active song currently cancel everything it first!
    if (activeSong) {
        activeSong.buffer.clearLoading();
        activeSong.disconnect(); // Ensure dispose cleans up references
        transportStop();
    }

    // Now set activeSong
    activeSong = songs.get(songId);
    const mixer = Mixer.get(activeSong);
    highlightActiveSong(activeSong); // update song selector


    if (activeSong.isLoaded === true) {
        finalizeControls()
        return;
    }

    // Safely manage the loading pipeline
    try {
        const song = activeSong;
        mixer.progress.show();

        await activeSong.buffer.load();

        setTimeout(()=>{
            if (song === activeSong) {
                activeSong.calculateMaxDuration();
                finalizeControls();
            }
        },700)





        // This ONLY runs if loadSongBuffers successfully finishes without being aborted
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log("Song loading aborted by user.");
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

    Mixer.get(activeSong).createTrackControls();
    transportControls.style.display = "";
    timelineControls.style.display = "";

}

function configureTone(){
    Tone.context._latencyHint = "playback";
    Tone.context._lookAhead = 0.06;
    Tone.context.updateInterval = 0.03
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
        // Mixer.updateMeters()
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




// load some songs from database, saved in 'songs' directory
await Song.fromSongDatabase("dontStop")
await Song.fromSongDatabase("baraye")
await Song.fromSongDatabase("schief")
await Song.fromSongDatabase("hans")
await Song.fromSongDatabase("click-4-4")

export let activeSong = null;
export let playbackRate = 1;



const   choirMixerContainer = initializeLayout('choir-mixer')
// start gui
updateFastUI();
updateSlowUI();


// await selectSongFromUrlParameter();
await selectSong("click-4-4")







