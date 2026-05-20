import {createPlayButton, createStopButton} from "./transportButtons.js";
import {createBpmDisplay, createBpmResetButton, createBpmSlider} from "./bpmControls.js";
import {createTimeline} from "./timeline.js";
import {createPositionDisplay} from "./transportDisplays.js";

export const transportControls = document.createElement("div");
export const timelineControls= document.createElement("div");

const CONTAINER_CLASS_NAME = "container border round w-90 maxw-1200px  center flex-row"

export function createTransportControls(parentDiv) {
    transportControls.className = CONTAINER_CLASS_NAME;

    createPositionDisplay(transportControls);
    createPlayButton(transportControls);
    createStopButton(transportControls);

    createFlexGap(transportControls)


    createBpmResetButton(transportControls);
    createBpmSlider(transportControls);
    createBpmDisplay(transportControls);



    // createTimeDisplay(transportControls)
    // createPositionDisplay(transportControls);

    // createTimeline(transportControls);

    parentDiv.appendChild(transportControls);

}

export function createTimelineControls(parentDiv) {
    timelineControls.className = CONTAINER_CLASS_NAME;
    createTimeline(timelineControls);


    parentDiv.appendChild(timelineControls);

}

function createFlexGap(parentDiv){
    const gap = document.createElement("div");
    gap.className = "flex-grow"
}