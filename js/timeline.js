import {activeSong, playbackRate} from "./main.js";
import {positionToSeconds, secondsToPosition} from "./transportControl.js";

let timeline;
let timelineMarkerWrapper;
let timelineMarker;
let timelineHoverLabel;

let loopRegion; // New element to visually show the selected range
let loopStartLabel;
let loopEndLabel;

let quantization = "4n";
let loopQuantization = "1m";

let duration = 120;
// State tracking variables
let isPointerDown = false;
let startX = 0;
let startPos = 0;
const dragThreshold = 5; // Pixels of movement required to count as a drag

// Your exported range variables
export let loopRelativePositionStart = null;
export let loopRelativePositionEnd = null;

export function createTimeline(parentDiv) {
    timeline = document.createElement("div");
    timeline.className =
        "timeline round-sm border w-100 h-50px bg-light-gray position-relative flex-grow m-10px";

    // LOOP REGION (NOT CLIPPED)
    loopRegion = document.createElement("div");
    loopRegion.className =
        "loop-region bg-bright shadow-bright position-absolute h-100";

    // MARKER WRAPPER (THIS IS WHAT GETS CLIPPED)
    timelineMarkerWrapper = document.createElement("div");
    timelineMarkerWrapper.className =
        "marker-wrapper round-sm w-100 h-100 position-absolute overflow-hidden";

    // MARKER (CLIPPED INSIDE WRAPPER)
    timelineMarker = document.createElement("div");
    timelineMarker.className =
        "timeline-marker bg-red shadow-red position-absolute";

    timelineMarkerWrapper.appendChild(timelineMarker);

    // DISPLAY (NEVER CLIPPED)
    const labelClassName = "  monospace position-absolute no-interact green";

    timelineHoverLabel = document.createElement("div");
    timelineHoverLabel.className = labelClassName;
    timelineHoverLabel.classList.add("timeline-hover-label")

    // LOOP LABELS (NEVER CLIPPED)
    loopStartLabel = document.createElement("div");
    loopStartLabel.className = labelClassName;
    loopStartLabel.classList.add("loop-label","label", "loop-start")

    loopEndLabel = document.createElement("div");
    loopEndLabel.className = labelClassName;
    loopEndLabel.classList.add("loop-label","label" , "loop-end")

    // ORDERING (layering)
    timeline.appendChild(loopStartLabel);
    timeline.appendChild(loopEndLabel);

    timeline.appendChild(loopRegion);          // behind everything
    timeline.appendChild(timelineMarkerWrapper); // clipped area only
    timeline.appendChild(timelineHoverLabel);     // always visible

    addTimelineEventListeners();

    parentDiv.appendChild(timeline);
}

export function configureTimeLine(){
    duration = activeSong.duration / playbackRate;
}


function calculateRelativePosition(event) {
    const boundingRect = timeline.getBoundingClientRect();
    // Use clientX for pointer events
    const x = event.clientX - boundingRect.left;
    // Clamp the percentage between 0 and 1
    return Math.max(0, Math.min(1, x / boundingRect.width));
}



function updateLoopRegion() {
    if (loopRelativePositionStart === null || loopRelativePositionEnd === null) return;

    const width = timeline.getBoundingClientRect().width;

    let startX = loopRelativePositionStart * width;
    const startSeconds = Tone.Time(loopRelativePositionStart * duration).quantize(loopQuantization);
    const startPosition = secondsToPosition(startSeconds,0,true);

    const endX = loopRelativePositionEnd * width;
    const endSeconds = Tone.Time(loopRelativePositionEnd * duration).quantize(loopQuantization);
    let endPosition = secondsToPosition(endSeconds,-1,true);

    const loopWidth = endX - startX

    if( Math.abs(startX - endX) < dragThreshold ) return;

    let adaptiveStartX;

    if (startPosition === endPosition) {
        endPosition = ''
        adaptiveStartX = startX + loopWidth / 2;
        loopStartLabel.style.transform = "translateX(-50%)"
    } else {
        adaptiveStartX = startX;
        loopStartLabel.style.transform = ""
    }
    console.log(startX);
    console.log(adaptiveStartX);

    // --- REGION ---
    loopRegion.style.left = `${startX}px`;
    loopRegion.style.width = `${loopWidth}px`;
    loopRegion.style.display = "block";

    // --- START LABEL ---
    loopStartLabel.style.left = `${adaptiveStartX}px`;
    loopStartLabel.textContent = startPosition
    loopStartLabel.style.display = "block";

    // --- END LABEL ---
    loopEndLabel.style.left = `${endX}px`;
    loopEndLabel.textContent = endPosition;
    loopEndLabel.style.display = "block";
}


export function updateTimelineMarker() {
    const position = Tone.getTransport().position;
    const seconds = positionToSeconds(position);
    const markerPosition = timeline.getBoundingClientRect().width * seconds / duration;
    timelineMarker.style.left = `${markerPosition}px`;

}


// crazy event listeners


function addTimelineEventListeners() {
    timeline.addEventListener("mouseenter", () => {
        timelineHoverLabel.style.display = "block";
    });

    timeline.addEventListener("mouseleave", () => {
        timelineHoverLabel.style.display = "none";
    });

    timeline.addEventListener("pointermove", (event) => {
        const relativePosition = calculateRelativePosition(event);
        const rect = timeline.getBoundingClientRect();
        const seconds = Tone.Time(duration * relativePosition).quantize(quantization);


        timelineHoverLabel.textContent = secondsToPosition(seconds);
        timelineHoverLabel.style.left = `${event.clientX - rect.left}px`;

        // 2. Handle Active Dragging Region
        if (isPointerDown) {

            const currentPos = relativePosition;
            loopRelativePositionStart = Math.min(startPos, currentPos);
            loopRelativePositionEnd = Math.max(startPos, currentPos);

            loopRelativePositionStart = Tone.Time(loopRelativePositionStart * duration).quantize(loopQuantization) / duration;
            loopRelativePositionEnd = Tone.Time(loopRelativePositionEnd * duration).quantize(loopQuantization) / duration;

            updateLoopRegion();
        }
    });

    timeline.addEventListener("pointerdown", (event) => {
        isPointerDown = true;
        startX = event.clientX;
        startPos = calculateRelativePosition(event);

        loopRegion.style.display = "none";
        timeline.setPointerCapture(event.pointerId);
    });

    timeline.addEventListener("pointerup", (event) => {
        if (!isPointerDown) return;
        isPointerDown = false;
        timeline.releasePointerCapture(event.pointerId);

        const deltaX = Math.abs(event.clientX - startX);

        if (deltaX < dragThreshold) {
            resetLoop()
            Tone.getTransport().seconds = Tone.Time(duration * calculateRelativePosition(event)).quantize(quantization);
        } else {
            Tone.getTransport().seconds = duration * loopRelativePositionStart ;
            Tone.getTransport().loopStart = duration * loopRelativePositionStart;
            Tone.getTransport().loopEnd = duration * loopRelativePositionEnd;
        }
    });
}





export function resetLoop() {
    if (!activeSong) return;
    if (!activeSong.isLoaded) return;

    loopRelativePositionStart = null;
    loopRelativePositionEnd = null;
    loopRegion.style.display = "none";
    loopStartLabel.style.display = "none"
    loopEndLabel.style.display = "none";


    Tone.getTransport().loopStart = 0;
    Tone.getTransport().loopEnd = duration;
}

window.addEventListener("resize", () => {
    updateLoopRegion();
});