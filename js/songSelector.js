import { songs } from "./Song.js";
import {selectSong} from "./main.js";

let songSelector;

const songRows = [];

const CONTAINER_CLASS = "container border round maxw-1200px flex-column w-80 center text-left";
const ITEM_CLASS = "song-selector-item flex-grow lighter-gray w-100 flex-row p-10px cursor-pointer center";

export function createTableSongSelector() {
    songSelector = document.createElement("div");
    songSelector.className = CONTAINER_CLASS;

    let selectedRow = null;

    songs.forEach(song => {
        // Create the row wrapper
        const songRow = document.createElement("div");
        songRow.className = ITEM_CLASS;
        songRow.id = song.id;
        songRows.push(songRow);

        const title = document.createElement("div");
        title.className = "minw-300px text-left";
        title.innerText = song.title;

        const bpm = document.createElement("div");
        bpm.className = "minw-100px text-right opacity-50";
        bpm.innerText = `${song.bpm} BPM`;

        // Create the file size container with a placeholder text
        const fileSize = document.createElement("div");
        fileSize.className = "minw-100px text-right opacity-50"; // Add utility classes for styling if needed
        fileSize.innerText = "";

        // FIXED: Appended fileSizeElement so it actually shows up in the DOM
        songRow.append(title, bpm, fileSize);

        // Kick off the background size calculation immediately for this specific song row
        updateSizeInBackground(song, fileSize).then();


        // Handle selection click
        songRow.addEventListener("click", async () => {
            if (selectedRow) {
                selectedRow.classList.remove("selected");
            }
            songRow.classList.add("selected");
            selectedRow = songRow;

            await selectSong(song.id)
        });

        songSelector.appendChild(songRow);
    });

    return songSelector;
}


export function highlightActiveSong(song){
    const songRow = document.getElementById(song.id);
    songRows.forEach((songRow) => {
        songRow.classList.remove("selected");
    })
    songRow.classList.add("selected");
}

// Background handler that waits for the calculation, then overwrites the innerText
async function updateSizeInBackground(song, displayElement) {
    // If the song doesn't have a tracks array or tracks are empty, handle safely
    if (!song.tracks || song.tracks.length === 0) {
        return;
    }

    const totalBytes = await song.getFileSize();
    displayElement.innerText = formatBytesToMB(totalBytes);
}




function formatBytesToMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}