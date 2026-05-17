// This cache will store the element references for each channel ID
let progressCache = {};


export function clearProgress() {
    progressCache = {};
}

export function createProgress(channelId, channelContent) {

    // Check if we already have the elements cached for this specific channel ID
    if (!progressCache[channelId]) {

        // Clear old static content only on the very first initialization
        channelContent.innerHTML = "";

        //  Create the wrapper
        const fullProgressBar = document.createElement("div");
        fullProgressBar.className = "bar vertical flex-column flex-grow border round bg-dark";


        //  Create the actual progress filler
        const progressBar = document.createElement("div");
        progressBar.className = "progress-bar w-100 h-100 bg-green shadow-green round";

        //  Create the text label
        const label = document.createElement("div");
        label.className = "label small gray color-transition";

        // Assemble the DOM structure
        fullProgressBar.appendChild(progressBar);

        channelContent.appendChild(fullProgressBar);
        channelContent.appendChild(label);

        // 5. Store references in our cache array/object using the ID as the key
        progressCache[channelId] = {
            progressBar: progressBar,
            label: label,
        };
    }

    // Update the initial state text using the cached reference
    progressCache[channelId].label.innerText = "PENDING";
}

export function updateProgress(channelId, progressValue, stateString) {
    const cachedElements = progressCache[channelId];

    // Safety check: if the cache doesn't exist yet, do nothing or wait for createProgress
    if (!cachedElements) return;




    // Update the timestamp to the current execution time

    const {  progressBar, label } = cachedElements;

    // Update the text only if it actually changed (saves CPU cycles)
    if (label.innerText !== stateString) {
        label.innerText = stateString;
    }

    // Calculate percentages and update styles directly via memory reference
    if (stateString === "DOWNLOADING") {
        progressBar.style.transform = `scaleY(${progressValue})`;
        label.classList.add("green")
        label.classList.remove("gray")
    } else if (stateString === "DECODING" ) {
        // Hard lock to 100% complete when finished
        progressBar.classList.add("bg-bright","shadow-bright")
        progressBar.classList.remove("bg-green","shadow-green")
        label.classList.add("bright")
        label.classList.remove("green")
        progressBar.style.transform = `scaleY(1)`;
    } else if (stateString === "READY" ) {
        progressBar.classList.add("bg-blue","shadow-blue")
        progressBar.classList.remove("bg-bright","shadow-bright")
        label.classList.add("blue")
        label.classList.remove("bright")
    }
}