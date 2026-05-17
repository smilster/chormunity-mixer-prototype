import { songs, current } from "../Song.js";

/**
 * Triggers a browser download of a specific song configuration as a JSON file.
 * @param {string} songId - The unique ID of the song to export.
 */
function songDownload(songId) {
    // 1. Grab the song instance from our global Map
    const song = songs.get(songId);

    if (!song) {
        console.error(`Cannot download song: No song found with ID "${songId}"`);
        return;
    }

    try {
        // 2. Convert the song object into a beautifully formatted JSON string
        const jsonString = JSON.stringify(song, null, 4);

        // 3. Create a Blob (Binary Large Object) containing our JSON string data
        const blob = new Blob([jsonString], { type: "application/json" });

        // 4. Generate a temporary localized URL pointing to that Blob object
        const downloadUrl = URL.createObjectURL(blob);

        // 5. Create a temporary hidden link element to simulate a user click
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;


        // --- Generate Timestamp ---
        const now = new Date();
        const date = now.toISOString().split('T')[0]; // Result: YYYY-MM-DD
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0'); // Current minute of the day
        const seconds = now.getSeconds().toString().padStart(2, '0');
        // Filename: e.g., "hans_2026-05-14_1195.json"
        anchor.download = `${song.id}_${date}_${hours}h${minutes}m${seconds}s.json`;

        // 6. Append to body, trigger the click event, and immediately remove it from DOM
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        // 7. Free up memory allocations by revoking the object URL
        URL.revokeObjectURL(downloadUrl);

        console.log(`Successfully triggered download for: ${song.title}_config.json`);

    } catch (error) {
        console.error(`Failed to export and download song "${songId}":`, error);
    }
}

/**
 * Creates the download button inProgress component and handles the extraction
 * of the currently selected song.
 * @param {HTMLElement} parentDiv - The DOM element where the inProgress components append.
 */
export function createSongDownloader(parentDiv) {
    // 1. Create a wrapper container for structural styling
    const downloadSection = document.createElement("div");
    downloadSection.className = "download-section";

    // 2. Create the Download Button element
    const downloadBtn = document.createElement("button");
    downloadBtn.id = "download-song-btn";
    downloadBtn.textContent = "💾 Download Config";

    // 3. Assemble and append components to the inProgress
    downloadSection.appendChild(downloadBtn);
    parentDiv.appendChild(downloadSection);

    // 4. Setup the click action event listener
    downloadBtn.addEventListener("click", () => {

        // Verify a valid selection before passing it to the core downloader function
        if (current) {
            songDownload(current);
        } else {
            alert("Please select a song from the dropdown menu first before trying to download!");
        }
    });
}