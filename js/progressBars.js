// progressBars.js


import {overallProgress} from "./audioBuffer.js";
import {activeSong} from "./main.js";

/** @type {Object<number, {progressBar: HTMLElement, label: HTMLElement}>} */
let progressCache = {};



export function clearProgress() {
    progressCache = {};
}

export function createProgress(channelId, channelContent) {
    if (progressCache[channelId]) {
        updateLabelText(channelId, "PENDING");
        return;
    }

    channelContent.innerHTML = "";

    const fullProgressBar = document.createElement("div");
    fullProgressBar.className = "bar vertical flex-column flex-grow border round bg-dark";

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar w-100 h-100 bg-green shadow-green round";

    const label = document.createElement("div");
    label.className = "label small gray color-transition";

    fullProgressBar.appendChild(progressBar);
    channelContent.appendChild(fullProgressBar);
    channelContent.appendChild(label);

    progressCache[channelId] = { progressBar, label };
    updateLabelText(channelId, "PENDING");
}

export function updateProgress(channelId, progressValue, stateString) {
    const cachedElements = progressCache[channelId];
    if (!cachedElements) return;

    updateLabelText(channelId, stateString);
    updateUIStyles(cachedElements, progressValue, stateString);
}

export function updateOverallProgress(stateString = "MASTER") {
    const masterElements = progressCache[activeSong.numTracks];
    if (!masterElements) return;
    updateLabelText(activeSong.numTracks, "LOADING");
    updateUIStyles(masterElements, overallProgress,stateString);

}

function updateLabelText(channelId, text) {
    const cached = progressCache[channelId];
    if (cached && cached.label.innerText !== text) {
        cached.label.innerText = text;
    }
}

function updateUIStyles(elements, progress, state) {
    const { progressBar, label } = elements;

    switch (state) {
        case "MASTER":
            progressBar.style.transform = `scaleY(${progress})`;
            setClasses(progressBar, ["bg-bright", "shadow-bright"], ["bg-green", "shadow-green", "bg-blue", "shadow-blue", "bg-red", "shadow-red"]);
            setClasses(label, ["bright"], ["gray", "green", "blue", "red"]);
            break;

        case "LOADING":
            progressBar.style.transform = `scaleY(${progress})`;
            setClasses(progressBar, ["bg-green", "shadow-green"], ["bg-bright", "shadow-bright", "bg-blue", "shadow-blue", "bg-red", "shadow-red"]);
            setClasses(label, ["green"], ["gray", "bright", "blue", "red"]);
            break;

        case "DECODING":
            progressBar.style.transform = "scaleY(1)";
            setClasses(progressBar, ["bg-bright", "shadow-bright"], ["bg-green", "shadow-green", "bg-blue", "shadow-blue", "bg-red", "shadow-red"]);
            setClasses(label, ["bright"], ["green", "gray", "blue", "red"]);
            break;

        case "READY":
            progressBar.style.transform = "scaleY(1)";
            setClasses(progressBar, ["bg-blue", "shadow-blue"], ["bg-green", "shadow-green", "bg-bright", "shadow-bright", "bg-red", "shadow-red"]);
            setClasses(label, ["blue"], ["green", "gray", "bright", "red"]);
            break;

        case "ERROR":
            progressBar.style.transform = "scaleY(1)";
            setClasses(progressBar, ["bg-red", "shadow-red"], ["bg-green", "shadow-green", "bg-bright", "shadow-bright", "bg-blue", "shadow-blue"]);
            setClasses(label, ["red"], ["green", "gray", "bright", "blue"]);
            break;

        case "PENDING":
        default:
            progressBar.style.transform = "scaleY(0)";
            setClasses(progressBar, ["bg-green", "shadow-green"], ["bg-bright", "shadow-bright", "bg-blue", "shadow-blue", "bg-red", "shadow-red"]);
            setClasses(label, ["gray"], ["green", "bright", "blue", "red"]);
            break;
    }
}

function setClasses(element, classesToAdd, classesToRemove) {
    classesToRemove.forEach(cls => element.classList.remove(cls));
    classesToAdd.forEach(cls => element.classList.add(cls));
}