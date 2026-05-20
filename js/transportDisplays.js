import {positionToSeconds, secondsToPosition, secondsToTimeFormat} from "./transportControl.js";
import {activeSong, playbackRate} from "./main.js";

let positionDisplay;
let timeDisplay;

export function createPositionDisplay(parentDiv) {

    const wrapper = document.createElement("div");
    wrapper.className = "m-10px minw-100px position-relative h-50px";

    positionDisplay = document.createElement("div");
    positionDisplay.className = "lcd border round-sm bg-dark w-100 h-100 d-flex center  green no-interact";
    positionDisplay.innerHTML = `00:0`




    const positionDisplayLabel = document.createElement("div");
    positionDisplayLabel.className = "position-absolute label small lighter-gray";
    positionDisplayLabel.style.top = "-20px"
    // positionDisplayLabel.style.left = "50px"
    // positionDisplayLabel.style.transform = "translateX(-50%)"
    positionDisplayLabel.style.zIndex = "100";
    positionDisplayLabel.innerHTML = `position`


    wrapper.appendChild(positionDisplay);
    wrapper.appendChild(positionDisplayLabel);

    parentDiv.appendChild(wrapper);

}

export function updatePositionDisplay() {
    const position = Tone.getTransport().position.split(":").map(Number)
    positionDisplay.innerHTML = `${position[0] + activeSong.startBar}:${position[1]+1}`;
}

export function createTimeDisplay(parentDiv) {
    const wrapper = document.createElement("div");
    wrapper.className = "m-10px minw-100px position-relative h-50px";

    timeDisplay = document.createElement("div");
    timeDisplay.className = "lcd border round-sm bg-dark w-100 h-100 d-flex center  bright no-interact ";
    timeDisplay.innerHTML = `00:00`

    const timeDisplayLabel = document.createElement("div");
    timeDisplayLabel.className = "position-absolute label small lighter-gray";
    timeDisplayLabel.style.top = "-20px"
    // timeDisplayLabel.style.left = "50px"
    // timeDisplayLabel.style.transform = "translateX(-50%)"
    timeDisplayLabel.style.zIndex = "100";
    timeDisplayLabel.innerHTML = `time`

    wrapper.appendChild(timeDisplay);
    wrapper.appendChild(timeDisplayLabel);

    parentDiv.appendChild(wrapper);
}

export function updateTimeDisplay() {
    const time = secondsToTimeFormat(positionToSeconds(Tone.getTransport().position));
    timeDisplay.innerHTML = `${time}`;
}