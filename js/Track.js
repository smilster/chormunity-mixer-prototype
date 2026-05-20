// set default parameters, consider moving them into Track class
const DEFAULT_GRAIN = 0.1;
const DEFAULT_OVERLAP = 0.6 * DEFAULT_GRAIN;

const DEFAULT_VOL = -15;
const DEFAULT_PAN = 0;

export class Track {


    constructor(trackConfig) {

        this.id = trackConfig.id; // identical with directory in songs-folder
        // gen url and label if they do not exist. genUrl must be called before genLabel
        this.url = this.genUrl(trackConfig);
        this.label = this.genLabel(trackConfig);



        // GRAIN PLAYER PARAMETERS
        this.player = null;

        // GRAIN PLAYER PARAMETERS
        this.grain = trackConfig.grain ? trackConfig.grain : DEFAULT_GRAIN;
        this.overlap = trackConfig.overlap ? trackConfig.overlap : DEFAULT_OVERLAP;
        this.playbackRate = 1



        // GENERAL PLAYER PARAMETERS

        this.vol = trackConfig.vol ? trackConfig.vol : DEFAULT_VOL;
        this.pan = trackConfig.pan ? trackConfig.pan : DEFAULT_PAN;


        this.panner = new Tone.Panner(this.pan);
        this.volume = new Tone.Volume(this.vol);

        this.volume.mute = trackConfig.mute ? trackConfig.mute : false;

        this.meter = new Tone.Meter({smoothing: 0.2});

        this.state = "initialized";
        this.buffer = null;

    }

    disconnect() {

        // Stop the player and unsync it from the Transport
        if (this.player) {
            this.player.stop();
            this.player.unsync();
            this.player.disconnect();
            // await this.player.disconnect();
        }

        // Dispose of the rest of the chain

        this.volume.disconnect();
        this.panner.disconnect();
        this.meter.disconnect();

        this.state = "disconnected";
    }


    connect() {
        // Assign the loaded buffer to the player

        // if (!this.player) {
        //
        //
        //     this.player = new Tone.Player({
        //         url: this.buffer
        //     })
        //
        //
        // }

        // in case you want to try GrainPlayer
        //  use this code insted
        if (!this.player){
            this.player =         new Tone.GrainPlayer({
                url: this.buffer,
                grainSize: this.grain,
                overlap: this.overlap,
                playbackRate: this.playbackRate
            })
        }

        this.player.sync().start(0);

        // Connect the chain
        this.player.connect(this.volume);
        this.volume.connect(this.meter);
        this.volume.connect(this.panner);
        this.panner.toDestination();

        this.state = "connected";

    }

    /**
     * Internal helper to sanitize and fill missing track data
     * @private
     */


    genUrl(trackConfig) {
        if (trackConfig.url) {
            return trackConfig.url;
        }

        if (!trackConfig.filename) {
            throw ("No file name provided");
        }

        return `${trackConfig.song_database_dir}/${trackConfig.songId}/${trackConfig.filename}`;
    }

    genLabel(trackConfig) {
        if (trackConfig.label) {
            return trackConfig.label;
        }
        // Auto-generate track label from filename if missing
        if (this.url) {
            return this.url
                .split("/")
                .pop()
                .split(".")[0]
                .slice(-9);
        }

        return trackConfig.id.toString();

    }


}