let wakeLock = null;



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
        await requestWakeLock(); // Keeps the screen alive
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


// Function to request the wake lock
async function requestWakeLock() {
    try {
        // Request the screen wake lock
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock is active! Screen will stay on.');

        // Optional: Listen for when the lock is released (e.g., if the user minimizes the tab)
        wakeLock.addEventListener('release', () => {
            console.log('Wake Lock was released.');
        });

    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}



