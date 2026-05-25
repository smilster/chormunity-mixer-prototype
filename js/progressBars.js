import {activeSong} from "./main.js";


let progressCache = {};

export function clearProgress() {
    progressCache = {};
}


export function visualizeProgress(channelContents) {

    clearProgress()


    channelContents.forEach((channelContent,channelId) => {


    channelContent.innerHTML = "";

    const fullProgressBar = document.createElement("div");
    fullProgressBar.className = "bar vertical flex-column flex-grow border round bg-dark";

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar w-100 h-100 bg-green shadow-green round";

    const label = document.createElement("div");
    label.className = "label small lighter-gray color-transition";

    fullProgressBar.appendChild(progressBar);
    channelContent.appendChild(fullProgressBar);
    channelContent.appendChild(label);

    progressCache[channelId] = { progressBar, label };
    updateUIStyles(channelId, 0,"PENDING");

})

    updateProgress();

}

export function updateProgress() {
    const delay = 300;
    const progresses = activeSong.buffer.getProgress();
    console.log("Im running")

    if (progresses.length === 0) {
        setTimeout(updateProgress, delay);
        return;
    }

    // Extract the total status item (last element) and leave just the track elements
    const masterId = progresses.length - 1;
    const masterProgress = progresses[masterId];

    // 1. Update individual track UI components safely
    progresses.forEach((track, channelId) => {
        updateUIStyles(channelId, track.progress, track.state);
    });



    // 3. Keep looping only if the entire download/decode session isn't finished
    if (masterProgress.state !== "READY") {
        setTimeout(updateProgress, delay);
    } else {
        progresses.forEach((track, channelId) => {
            updateUIStyles(channelId, track.progress, track.state);
        });
    }

}


function updateUIStyles(channelId,progress, state) {
    if (!progressCache[channelId]) return;

    const { progressBar, label } = progressCache[channelId]

    label.innerText = state;

    switch (state) {
        case "MASTER":
            label.innerText = "LOADING";
            progressBar.style.transform = `scaleY(${progress})`;
            setClasses(progressBar, ["bg-bright", "shadow-bright"], ["bg-green", "shadow-green", "bg-blue", "shadow-blue", "bg-red", "shadow-red"]);
            setClasses(label, ["bright"], ["lighter-gray", "green", "blue", "red"]);
            break;

        case "LOADING":
            progressBar.style.transform = `scaleY(${progress})`;
            setClasses(progressBar, ["bg-green", "shadow-green"], ["bg-bright", "shadow-bright", "bg-blue", "shadow-blue", "bg-red", "shadow-red"]);
            setClasses(label, ["green"], ["lighter-gray", "bright", "blue", "red"]);
            break;

        case "DECODING":
            progressBar.style.transform = "scaleY(1)";
            setClasses(progressBar, ["bg-bright", "shadow-bright"], ["bg-green", "shadow-green", "bg-blue", "shadow-blue", "bg-red", "shadow-red"]);
            setClasses(label, ["bright"], ["green", "lighter-gray", "blue", "red"]);
            break;

        case "READY":
            progressBar.style.transform = "scaleY(1)";
            setClasses(progressBar, ["bg-blue", "shadow-blue"], ["bg-green", "shadow-green", "bg-bright", "shadow-bright", "bg-red", "shadow-red"]);
            setClasses(label, ["blue"], ["green", "lighter-gray", "bright", "red"]);
            break;

        case "ERROR":
            progressBar.style.transform = "scaleY(1)";
            setClasses(progressBar, ["bg-red", "shadow-red"], ["bg-green", "shadow-green", "bg-bright", "shadow-bright", "bg-blue", "shadow-blue"]);
            setClasses(label, ["red"], ["green", "lighter-gray", "bright", "blue"]);
            break;

        case "PENDING":
        default:
            progressBar.style.transform = "scaleY(0)";
            setClasses(progressBar, ["bg-green", "shadow-green"], ["bg-bright", "shadow-bright", "bg-blue", "shadow-blue", "bg-red", "shadow-red"]);
            setClasses(label, ["lighter-gray"], ["green", "bright", "blue", "red"]);
            break;
    }
}

function setClasses(element, classesToAdd, classesToRemove) {
    classesToRemove.forEach(cls => element.classList.remove(cls));
    classesToAdd.forEach(cls => element.classList.add(cls));
}