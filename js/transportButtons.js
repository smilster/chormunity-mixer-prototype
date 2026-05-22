import {activeSong} from "./main.js";
import {resetLoop} from "./timeline.js";

let playButtonSymbol;
let stopButtonSymbol;




export function createPlayButton() {
    const playButton = document.createElement("div");
    playButton.classList.add("m-10px","btn");

    const circle = document.createElement("div");
    circle.classList.add("circle-large","bg-gray","position-relative");

    playButtonSymbol = document.createElement("div");
    playButtonSymbol.classList.add("play-btn","position-absolute");

    playButton.appendChild(circle);
    circle.appendChild(playButtonSymbol);

    // 3. Add the click event listener
    playButton.addEventListener("click", togglePlayback)

    return playButton;
}

export function createStopButton() {
    const stopButton = document.createElement("div");
    stopButton.classList.add("m-10px","btn");

    const circle = document.createElement("div");
    circle.classList.add("circle-large","bg-gray","position-relative");
    stopButtonSymbol = document.createElement("div");
    stopButtonSymbol.classList.add("stop-btn","position-absolute");

    stopButton.appendChild(circle);
    circle.appendChild(stopButtonSymbol);

    stopButton.addEventListener("click",transportStop)

    return stopButton;
}


export async function togglePlayback() {
    if (!activeSong) return;
    if (!activeSong.isLoaded) return;

    // Essential: Ensure the audio context is active
    if (Tone.getContext().state !== "running") {
        await Tone.start();
        console.log("Audio Context Started");
    }

    // Toggle Transport state
    if (Tone.getTransport().state === "started") {
        transportPause()
    } else {
        await transportPlay()
    }
}

export async function transportPlay() {
    await Tone.getTransport().start();
    playButtonSymbol.classList.add("pause-btn");
    playButtonSymbol.classList.remove("play-btn");
}

export function transportPause() {
    Tone.getTransport().pause();
    playButtonSymbol.classList.remove("pause-btn");
    playButtonSymbol.classList.add("play-btn");
}

export function transportStop() {
    Tone.getTransport().pause();
    playButtonSymbol.classList.remove("pause-btn");
    playButtonSymbol.classList.add("play-btn");
    resetLoop();
    Tone.getTransport.seconds=0;
}