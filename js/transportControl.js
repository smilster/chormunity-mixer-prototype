import {createTimeline} from "./timeline.js";
import {createPlayButton, createStopButton} from "./transportButtons.js";
import {activeSong, playbackRate} from "./main.js";
import {createPositionDisplay, createTimeDisplay} from "./transportDisplays.js";

export const transportControls = document.createElement("div");

export function createTransportControl(choirMixerContainer) {
    transportControls.classList.add("container","border","round","w-90","maxw-1200px","flex-row");


    createTimeDisplay(transportControls)
    createPositionDisplay(transportControls);

    createTimeline(transportControls);

    createPlayButton(transportControls)
    createStopButton(transportControls)




    choirMixerContainer.appendChild(transportControls);


}


export function secondsToTimeFormat(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


export function positionToSeconds(position) {
    const [bars, beats, subdivision] = position.split(":").map(Number);

    const subdivisionPerBeat = 4;

    const beatsPerBar  = Tone.getTransport().timeSignature;

    const secondsPerBeat = 60 / Tone.getTransport().bpm.value;
    const secondsPerSubdivision = secondsPerBeat / subdivisionPerBeat;

    const totalBeats = (bars * beatsPerBar) + beats;
    const totalSubdivisions = (totalBeats * subdivisionPerBeat) + subdivision;

    return totalSubdivisions * secondsPerSubdivision;
}

export function secondsToPosition(seconds,measureShift=0,showMeasureOnly = false){

    const position = Tone.Time(seconds).toBarsBeatsSixteenths().split(":").map(Number);
    const measure = position[0] + activeSong.startBar + measureShift;
    if (showMeasureOnly) {
        return measure.toString();
    }

    const beat = position[1] + 1;
    return `${measure}:${beat}`;
}

//
// export function roundToBeat(seconds){
//     const beatInSeconds = Tone.getTransport().bpm.value / 240;
//     return Math.round(seconds / beatInSeconds) * beatInSeconds;
// }