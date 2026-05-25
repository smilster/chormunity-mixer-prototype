
export class SongBuffer {

    abortController = null
    progresses = new Map();

    song = null;
    tracks = null;
    totalBytes = 1;
    loadedTotalBytes = 0;

    constructor(song) {
        this.song = song;
        this.tracks = song.tracks;

    }

    clearLoading() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        this.progresses.clear();


        this.totalBytes = 1;
        this.loadedTotalBytes = 0;
    }


    async load() {
        this.clearLoading();
        if (this.song.isLoaded) return;

        this.abortController = new AbortController();

        try {
            this.totalBytes = await this.song.getFileSize();

            if (this.abortController.signal.aborted) return;

            this.tracks.forEach(track => this.progresses.set(track.url, { progress: 0, state: "PENDING" }));

            await Promise.all(this.tracks.map(track => this.downloadTrack(track, this.abortController.signal)));

            this.song.checkIfLoaded();


        } catch (error) {
            if (error.name !== 'AbortError') console.error("Unexpected error:", error);
        } finally {
            // Target only this specific song so you don't ruin newer parallel runs
            this.abortController = null;
        }
    }

    async downloadTrack(track, signal) {
        if (track.buffer) {
            this.progresses.set(track.url, { progress: 1, state: "READY" });
            await track.getFileSize();
            this.loadedTotalBytes += track.fileSize;
            return track.buffer;
        }

        const response = await fetch(track.url, { signal });
        const reader = response.body.getReader();
        const chunks = [];
        let loadedBytes = 0;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                loadedBytes += value.length;
                this.loadedTotalBytes += value.length;
                this.progresses.set(track.url, { progress: loadedBytes / track.fileSize, state: "LOADING" });
            }

            if (loadedBytes === track.fileSize) {
                this.progresses.set(track.url, { progress: 1, state: "DECODING" });
                console.log(track.url + "decoding")
                track.buffer = await this.createBuffer(chunks);
                console.log(track.url + "ready")
                this.progresses.set(track.url, { progress: 1, state: "READY" });

            }
        } finally {
            reader.releaseLock();
        }
    }


    async createBuffer(chunks) {
        const byteLengthSum = chunks.reduce((acc, c) => acc + c.length, 0);
        const rawData = new Uint8Array(byteLengthSum);
        let pointer = 0;
        for (const chunk of chunks) {
            rawData.set(chunk, pointer);
            pointer += chunk.length;
        }
        const nativeBuffer = await Tone.getContext().rawContext.decodeAudioData(rawData.buffer);
        return new Tone.ToneAudioBuffer().set(nativeBuffer);
    }


    getProgress() {
        if (this.progresses.size === 0) return [];
        const arr = Array.from(this.progresses.values());
        const totalIsReady = arr.every(p => p.state === "READY");

        arr.push({
            progress: totalIsReady ? 1 : this.loadedTotalBytes / this.totalBytes,
            state: totalIsReady ? "READY" : "MASTER"
        });
        return arr;
    }

}