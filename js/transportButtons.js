const playButton = document.createElement("button");
playButton.id = "main-play-btn";
playButton.textContent = "▶ Play";
playButton.classList.add("play-button");


export function createPlayButton(parentDiv) {


    // 2. Append to the DOM
    parentDiv.appendChild(playButton);

    // 3. Add the click event listener
    playButton.addEventListener("click", togglePlayback)
}


export async function togglePlayback() {
    // Essential: Ensure the audio context is active
    if (Tone.getContext().state !== "running") {
        await Tone.start();
        console.log("Audio Context Started");
    }

    // Toggle Transport state
    if (Tone.getTransport().state === "started") {
        await transportStop()
    } else {
        await transportPlay()
    }
}

export async function transportPlay() {
    await Tone.getTransport().start();
    playButton.textContent = "⏹ Stop";
    playButton.classList.add("playing");
}

export function transportStop() {
    Tone.getTransport().stop();
    playButton.textContent = "▶ Play";
    playButton.classList.remove("playing");
}


