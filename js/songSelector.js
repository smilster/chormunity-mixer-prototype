import { songs}  from "./Song.js";
import {selectSong} from "./main.js";

export let songSelector = null;
/**
 * Creates the initial empty select element, sets up its event listener,
 * and appends it to the container. Run this ONCE during initialization.
 */
export function createSongSelector(parentDiv) {
    songSelector = document.createElement("select");
    songSelector.id = "song-select";

    songSelector.addEventListener("change", async (event) => {
        await selectSong(event.target.value);
    });

    parentDiv.appendChild(songSelector);

    //  Run an initial update
    updateSongSelector();
}


/**
 * Syncs the existing dropdown options with the current songs Map.
 * Run this whenever a new song is added or uploaded.
 */
export function updateSongSelector() {
    if (!songSelector) {
        console.warn("Cannot update selector: #song-select element not found in DOM.");
        return;
    }

    // 1. Save the currently selected value so we don't reset the user's choice
    const previouslySelectedValue = songSelector.value;

    // 2. Clear out all existing options
    songSelector.innerHTML = "";

    // 3. Re-create the default placeholder option
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Select a Song";
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    songSelector.appendChild(defaultOption);

    // 4. Loop through the Map to repopulate options
    songs.forEach((song, id) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = song.title;
        songSelector.appendChild(option);
    });

    // 5. Restore the user's selection if it still exists in the map
    if (previouslySelectedValue && songs.has(previouslySelectedValue)) {
        songSelector.value = previouslySelectedValue;
    }
}