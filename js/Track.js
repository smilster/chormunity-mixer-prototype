export class Track {


    constructor(trackConfig) {

        this.id = trackConfig.id; // identical with directory in songs-folder


        this.label = trackConfig.label;

        // but your previous JSON used url or fileName.
        this.url = trackConfig.url;


        this.vol = trackConfig.vol ? trackConfig.vol : -10;
        this.pan = trackConfig.pan ? trackConfig.pan : 0;

        // GRAIN PLAYER PARAMETERS
        this.player = null;

        // GRAIN PLAYER PARAMETERS (not used. sounds shitty when changing speed)
        // this.grain = 0.1;
        // this.overlap = 0.08;
        // this.playbackRate = 1

        this.state = "initialized";
        this.buffer = null;

        // TONE NODES
        this.panner = new Tone.Panner(this.pan);
        this.volume = new Tone.Volume(this.vol);

        this.volume.mute = trackConfig.mute ? trackConfig.mute : false;
        this.meter = new Tone.Meter({smoothing: 0.1});



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
        if (!this.player){
            this.player =         new Tone.Player({
                url: this.buffer,
            })
        }
        // in case you want to try GrainPlayer
        //  use this code insted
        // if (!this.player){
        //     this.player =         new Tone.GrainPlayer({
        //         url: this.buffer,
        //         grainSize: this.grain,
        //         overlap: this.overlap,
        //         playbackRate: this.playbackRate
        //     })
        // }

        this.player.sync().start(0);

        // Connect the chain
        this.player.connect(this.volume);
        this.volume.connect(this.meter);
        this.volume.connect(this.panner);
        this.panner.toDestination();

        this.state = "connected";

    }



}