import {createPlayButton, createStopButton} from "./transportButtons.js";
import {createBpmDisplay, createBpmResetButton, createBpmSlider} from "./bpmControls.js";
import {createTimeline} from "./timeline.js";
import {createPositionDisplay} from "./transportDisplays.js";

export const transportControls = document.createElement("div");
export const timelineControls= document.createElement("div");

const CONTAINER_CLASS = "container border round w-80 maxw-1200px  center flex-row "

export function createTransportControls() {


    transportControls.className = CONTAINER_CLASS;

    transportControls.appendChild(createPositionDisplay());
    transportControls.appendChild(createPlayButton());
    transportControls.appendChild(createStopButton());


    transportControls.appendChild(createBpmResetButton())
    transportControls.appendChild(createBpmSlider())
    transportControls.appendChild(createBpmDisplay())


    return transportControls;

}

export function createTimelineControls() {
    timelineControls.className = CONTAINER_CLASS;
    createTimeline(timelineControls);

   return timelineControls;

}
