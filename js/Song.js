// =====================================================
// DEFAULT CONFIGURATIONS
// =====================================================
import {Track} from "./Track.js";


const SONG_DATABASE_DIR = 'songs';
const SONG_CONFIG_JSON = 'config.json';
export let songs = new Map();

export class Song {
    /**
     *
     * @param songConfig JSON file containing the config
     */
    constructor(songConfig) {



        this.id = songConfig.id;
        // Automatically register this newly created instance into the global map
        songs.set(this.id, this);


        this.title = songConfig.title || songConfig.id;
        this.bpm = Number(songConfig.bpm)

        this.numTracks=songConfig.tracks.length;

        // Map and normalize the incoming tracks array
        this.trackConfigs = (songConfig.tracks || []).map(trackConfig => this.normalizeTrack(trackConfig));

        // assign index to each track
        this.trackConfigs.forEach((trackConfig,id) => {
            trackConfig.id = id;
        });

        // create tracks from configs

        this.tracks = []
        this.createTracks();



        // store duration of song, i.e., it is the duration of the longest track in case of duration mismatch
        this.duration = 0;

        this.isLoaded = false;

        // will be triggered in case of song switch during selection
        // this.abortController = null;
    }

    /**
     *
     * @param id  identical with directory name of song and where to find JSON (songConfig)
     */
    static async fromSongDatabase(id) {
        const songConfigJson = `${SONG_DATABASE_DIR}/${id}/${SONG_CONFIG_JSON}`;
        const response = await fetch(songConfigJson);
        if (!response.ok) throw new Error(`Failed to fetch song from ${songConfigJson}`);
        const songConfig = await response.json();
        songConfig.id = id;
        return new Song(songConfig);
    }



    /**
     * Internal helper to sanitize and fill missing track data
     * @private
     */
    normalizeTrack(rawTrackConfig) {
        // Shallow copy the track to avoid mutating your raw JSON data
        const trackConfig = {...rawTrackConfig};

        trackConfig.url = `${SONG_DATABASE_DIR}/${this.id}/${trackConfig.filename}`;

        // Auto-generate track label from filename if missing
        if (!trackConfig.label && trackConfig.url) {
            trackConfig.label = trackConfig.url.split("/").pop().split(".")[0];
        }


        return trackConfig;
    }

    calculateMaxDuration(){
        this.duration = 0;
        this.tracks.forEach(track => {
            this.duration = Math.max(track.buffer.duration,this.duration);
        })
    }

    connect(){
        this.tracks.forEach((track) => {
            track.connect();
        })
    }

    disconnect() {
            this.tracks.forEach( (track) => {
                track.disconnect();
            })
    }

    createTracks() {
        this.tracks = this.trackConfigs.map(config => {
            return new Track(config);
        });

    }

}


