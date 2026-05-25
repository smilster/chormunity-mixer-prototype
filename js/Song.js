// =====================================================
// DEFAULT CONFIGURATIONS
// =====================================================
import {Track} from "./Track.js";
import {SongBuffer} from "./SongBuffer.js";

// DEFAULT SONG CONFIG PARAMETERS, consider moving them into Song class


const DEFAULT_TIME_SIGNATURE = [4,4];
const DEFAULT_START_BAR = 1;

const DEFAULT_MASTER_GAIN = 0.5;


// song database specifications
const SONG_DATABASE_DIR = 'songs';
const SONG_CONFIG_JSON = 'config.json';

// global song list, <songId,song>
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

       if (songConfig.startBar === undefined) {
           this.startBar = DEFAULT_START_BAR;
       } else {
           this.startBar = parseFloat(songConfig.startBar);
       }



        this.masterGain = songConfig.masterGain ? songConfig.masterGain : DEFAULT_MASTER_GAIN;


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
        this.fileSize = null;
        this.buffer = new SongBuffer(this);

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


    connect(destination){
        Tone.Transport.cancel();
        this.tracks.forEach((track) => {
            track.connect(destination);
        })
    }

    disconnect() {
            this.tracks.forEach( (track) => {
                track.dispose();
            })
    }

    createTracks() {
        this.tracks = this.trackConfigs.map(config => {
            return new Track(config);
        });

    }



    async getFileSize() {
        if (this.fileSize) return this.fileSize;
        // FIXED: Added 'return' inside map loop so it gathers the array of fetch promises
        const sizePromises = this.tracks.map(track => {
            return track.getFileSize();
        });

        // Wait for all of them to finish
        const sizes = await Promise.all(sizePromises);


        // Sum the array of byte sizes
        this.fileSize = sizes.reduce((total, currentSize) => total + currentSize, 0);
        return this.fileSize;
    }

    checkIfLoaded() {

        let isLoaded = true;
        this.tracks.forEach((track) => {
            if (!track.buffer) {
                isLoaded = false;
            }
        })

        this.isLoaded = isLoaded;
        return isLoaded;

    }





}


