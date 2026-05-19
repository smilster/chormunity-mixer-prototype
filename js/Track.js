export class Track {


    constructor(trackConfig) {

        this.id = trackConfig.id; // identical with directory in songs-folder
        // gen url and label if they do not exist. genUrl must be called before genLabel
        this.url = this.genUrl(trackConfig);
        this.label = this.genLabel(trackConfig);



        // GRAIN PLAYER PARAMETERS
        this.player = null;

        // GRAIN PLAYER PARAMETERS (not used. sounds shitty when changing speed)
        this.grain = 0.1
        this.overlap = 0.45 * this.grain;
        this.playbackRate = 1




        this.vol = trackConfig.vol ? trackConfig.vol : -15;


        this.pan = trackConfig.pan ? trackConfig.pan : 0;


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