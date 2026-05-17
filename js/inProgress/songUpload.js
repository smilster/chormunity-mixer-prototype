import { Song, songs } from "../Song.js"; // 1. Added 'songs' import
import { updateSongSelector, selectSong } from "../songSelector.js";

export function createSongUploader(parentDiv) {
    // 1. Create the wrapper container div
    const uploadSection = document.createElement("div");
    uploadSection.className = "upload-section";

    // 2. Create the Label element
    const label = document.createElement("label");
    label.setAttribute("for", "song-upload");
    label.textContent = "Upload a Song Config (JSON):";

    // 3. Create the File Input element
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "song-upload";
    fileInput.accept = ".json";

    // 4. Assemble the elements together
    uploadSection.appendChild(label);
    uploadSection.appendChild(fileInput);

    // 5. Append the entire block to the parent element
    parentDiv.appendChild(uploadSection);

    // 6. Bind the upload logic directly to the freshly created input
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();



        reader.onload = async (e) =>  {
            try {
                const configJSON = JSON.parse(e.target.result);

                // Instantiating automatically parses the JSON and registers it into 'songs'
                const newSong = new Song(configJSON);

                console.log(`Successfully imported: ${newSong.title}`);

                // 2. Pass the 'songs' Map to the update function
                updateSongSelector();

                // Auto-select the newly uploaded song if the dropdown exists
                const select = document.getElementById("song-select");
                if (select) select.value = newSong.id;
                await selectSong(newSong.id)

            } catch (error) {
                alert("Invalid JSON format. Please check your config file.");
                console.error("Parsing uploaded file failed:", error);
            }
        };

        reader.readAsText(file);
    });
}