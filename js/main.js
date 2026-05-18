
//

Tone.context._latencyHint = "playback";
Tone.context._lookAhead= 0.15;



import {Song, songs} from "./Song.js";
import {createSongSelector, updateSongSelector} from "./songSelector.js";
import {createMixer, createTrackControls, initializeMixer, updateMeters} from "./mixer.js";
import {createPlayButton, transportStop} from "./transportButtons.js";
import {updateProgress, createProgress, clearProgress} from "./progressBars.js";
import {loadBuffers, cancelLoading} from "./audioBuffer.js";
import {configureTimeline, createTimeline, updateTimelineMarker} from "./timeline.js";
// import {createBpmSlider} from "./inProgress/bpmSlider.js";




// load some songs from database (saved in 'songs' directory
await Song.fromSongDatabase("dontStop")
await Song.fromSongDatabase("baraye")
await Song.fromSongDatabase("baraye-m4a")
await Song.fromSongDatabase("schief")
await Song.fromSongDatabase("schief_piano_web")

export let activeSong = null;

const choirMixerContainer = document.getElementById("choir-mixer");


createSongSelector(choirMixerContainer, songs);
createPlayButton(choirMixerContainer);
// createBpmSlider(choirMixerContainer);



export async function selectSong(songID, onProgress) {

    // if there is no active song, create empty Mixer
    if (!activeSong) {
        createMixer(choirMixerContainer);
        createTimeline(choirMixerContainer);
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
    configureTimeline(activeSong)
    setTimeout(() => {
        createTrackControls(activeSong);
    }, delay)

}

function configureTransport() {
    Tone.Transport.bpm.value = activeSong.bpm;
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = activeSong.duration;
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


function updateSlowUI(){
    if (activeSong) {
        updatePositionDisplay()
        updateMyPositionDisplay()
        updateTimeDisplay()
        updateTimelineMarker();
    }
    setTimeout(updateSlowUI, 60);
}

function updateFastUI() {
    if (activeSong) {
        updateMeters(activeSong)
    }

        requestAnimationFrame(updateFastUI);
}

// T I M E L I N E
// following to be placed somewhere else


//  DISPLAYS

function updatePositionDisplay() {
    const position = Tone.Transport.position.split(":")
    positionDisplay.innerText =
        `${parseInt(position[0])}.` +
        `${parseInt(position[1])}.` +
        `${Math.floor(parseFloat(position[2]))}`;
}

function updateMyPositionDisplay() {
    const beatInSeconds = 60.0 / Tone.Transport.bpm.value;
    myPositionDisplay.innerText = `${Tone.Transport.seconds / beatInSeconds}`;

}

function updateTimeDisplay() {
    timeDisplay.innerText = new Date(Tone.Transport.seconds * 1000)
        .toISOString()
        .slice(14, 22);
}


//  testing

const positionDisplay = document.createElement("div");
const myPositionDisplay = document.createElement("div");
const timeDisplay = document.createElement("div");


choirMixerContainer.appendChild(positionDisplay);
choirMixerContainer.appendChild(myPositionDisplay);
choirMixerContainer.appendChild(timeDisplay);

updateFastUI();
updateSlowUI();





// I N   P R O G R E S S

export function updateTempo(ratio) {
    Tone.Transport.bpm.value = activeSong ? activeSong.bpm * ratio : 120 * ratio;
    // console.log(Tone.Transport.bpm.value);
    activeSong.tracks.forEach(track => {
        track.player.playbackRate = ratio;
    })
}
