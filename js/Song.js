// =====================================================
// DEFAULT CONFIGURATIONS
// =====================================================
import {Track} from "./Track.js";

// DEFAULT SONG CONFIG PARAMETERS, consider moving them into Song class


const DEFAULT_TIME_SIGNATURE = [4,4];
const DEFAULT_START_BAR = 1;


// song database specifications
const SONG_DATABASE_DIR = 'songs';
const SONG_CONFIG_JSON = 'config.json';

// global song list, <songID,song>
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
        if (songConfig.timeSignature) {
            this.timeSignature = songConfig.timeSignature.split("/")
        } else {
            this.timeSignature = DEFAULT_TIME_SIGNATURE;
        }



        this.startBar = songConfig.startBar.toString() ? parseFloat(songConfig.startBar) : DEFAULT_START_BAR;


        // Map and normalize the incoming tracks array
        this.trackConfigs = songConfig.tracks;

        // assign index, song id and database dir to each track
        this.trackConfigs.forEach((trackConfig,id) => {
            trackConfig.songId = this.id;
            trackConfig.song_database_dir = SONG_DATABASE_DIR;
            trackConfig.id = id;
        });

        // create tracks from configs

        this.tracks = []
        this.createTracks();

        this.numTracks=songConfig.tracks.length;



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
        const response = await fetch(songConfigJson,{
            cache: 'no-store',
        });
        if (!response.ok) throw new Error(`Failed to fetch song from ${songConfigJson}`);
        const songConfig = await response.json();
        songConfig.id = id;
        return new Song(songConfig);
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


