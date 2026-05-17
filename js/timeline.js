let timeline;
let timelineMarker;
let timelineDisplay;
let timelineRegion; // New element to visually show the selected range

let bpm;
let duration;

// State tracking variables
let isPointerDown = false;
let startX = 0;
let startPos = 0;
const dragThreshold = 5; // Pixels of movement required to count as a drag

// Your exported range variables
export let rangeStart = null;
export let rangeEnd = null;

export function createTimeline(parentDiv) {
    timeline = document.createElement("div");
    timeline.className = "timeline w-100 h-50px bg-dark-gray position-relative"; // Added position-relative for absolute children

    timelineMarker = document.createElement("div");
    timelineMarker.className = "timeline-marker bg-red shadow-red";

    timelineDisplay = document.createElement("div");
    timelineDisplay.className = "timeline-display label large";

    // Create the visual region element
    timelineRegion = document.createElement("div");
    timelineRegion.className = "timeline-region bg-bright shadow-bright position-absolute h-100";
    timelineRegion.style.pointerEvents = "none"; // Ensures it doesn't block interactions
    timelineRegion.style.display = "none";

    addTimelineEventListeners();

    timeline.appendChild(timelineRegion); // Append region first so it sits behind the marker
    timeline.appendChild(timelineMarker);
    timeline.appendChild(timelineDisplay);

    parentDiv.appendChild(timeline);
}

function calculatePositionFromTimeline(event) {
    const boundingRect = timeline.getBoundingClientRect();
    // Use clientX for pointer events
    const x = event.clientX - boundingRect.left;
    // Clamp the percentage between 0 and 1
    return Math.max(0, Math.min(1, x / boundingRect.width));
}


function updateRegionUI() {
    if (rangeStart === null || rangeEnd === null) return;

    const leftPercent = rangeStart * 100;
    const widthPercent = (rangeEnd - rangeStart) * 100;

    timelineRegion.style.left = `${leftPercent}%`;
    timelineRegion.style.width = `${widthPercent}%`;
    timelineRegion.style.display = "block";
}

export function configureTimeline(song){
    bpm = song.bpm;
    duration = song.duration;
}

export function updateTimelineMarker(){
    const boundingRect = timeline.getBoundingClientRect();
    const position = boundingRect.width * Tone.Transport.seconds / duration;
    timelineMarker.style.left = `${position}px`;
}


// crazy event listeners


function addTimelineEventListeners() {
    timeline.addEventListener("mouseenter", () => {
        timelineDisplay.style.display = "block";
    });

    timeline.addEventListener("mouseleave", () => {
        timelineDisplay.style.display = "none";
    });

    timeline.addEventListener("pointermove", (event) => {
        const position = calculatePositionFromTimeline(event);

        // 1. Fix Tooltip Position:
        // Since CSS is 'position: fixed', give it raw client coordinates.
        // We subtract an extra 10-15px from Y just to float it slightly above the cursor.
        timelineDisplay.textContent = position.toFixed(2);
        timelineDisplay.style.left = `${event.clientX}px`;
        timelineDisplay.style.top = `${event.clientY - 15}px`;

        // 2. Handle Active Dragging Region
        if (isPointerDown) {
            const currentPos = position;
            rangeStart = Math.min(startPos, currentPos);
            rangeEnd = Math.max(startPos, currentPos);


            updateRegionUI();
        }
    });

    timeline.addEventListener("pointerdown", (event) => {
        isPointerDown = true;
        startX = event.clientX;
        startPos = calculatePositionFromTimeline(event);

        timelineRegion.style.display = "none";
        timeline.setPointerCapture(event.pointerId);
    });

    timeline.addEventListener("pointerup", (event) => {
        if (!isPointerDown) return;
        isPointerDown = false;
        timeline.releasePointerCapture(event.pointerId);

        const deltaX = Math.abs(event.clientX - startX);

        if (deltaX < dragThreshold) {
            rangeStart = null;
            rangeEnd = null;
            timelineRegion.style.display = "none";

            const percentage = calculatePositionFromTimeline(event);
            const transportSeconds = duration * percentage;
            Tone.Transport.loopStart = 0;
            Tone.Transport.loopEnd = duration;
            Tone.Transport.seconds = transportSeconds;
        } else {
            Tone.Transport.seconds = duration * rangeStart;
            Tone.Transport.loopStart = duration * rangeStart;
            Tone.Transport.loopEnd = duration * rangeEnd;
        }
    });
}