// set default parameters
const DEFAULT_GRAIN = 0.1;
const DEFAULT_OVERLAP = 0.6 * DEFAULT_GRAIN;

const DEFAULT_VOL = -15;
const DEFAULT_PAN = 0;

const METER_SMOOTHING = 0;

export class Track {

    constructor(trackConfig) {


        this.id = trackConfig.id;
        this.songId = trackConfig.songId;

        this.url = this.genUrl(trackConfig);
        this.fileSize = null; // to be set by this.getFileSize;

        this.label = this.genLabel(trackConfig);

        // playback params
        this.grain = trackConfig.grain ?? DEFAULT_GRAIN;
        this.overlap = trackConfig.overlap ?? DEFAULT_OVERLAP;
        this.playbackRate = 1;

        // mixer params
        this.vol = trackConfig.vol ?? DEFAULT_VOL;
        this.pan = trackConfig.pan ?? DEFAULT_PAN;
        this.mute = trackConfig.mute ?? false;

        this.buffer = null;
        this.player = null;

        // persistent nodes
        this.volume = new Tone.Volume(this.vol);
        this.volume.mute = this.mute;

        this.panner = new Tone.Panner(this.pan);

        // will be recreated everytime a track is loaded
        this.meter = new Tone.Meter({
            smoothing: 0.2
        });


        this.state = "initialized";
    }


    connect(destination) {

        if (this.state === "connected") return;

        // recreate player if needed
        if (!this.player) {

            this.player = new Tone.GrainPlayer({
                url: this.buffer,
                grainSize: this.grain,
                overlap: this.overlap,
                playbackRate: this.playbackRate
            });

            // only sync once
            this.player.sync().start(0);
        }



        // clean stale routing first
        this.player.disconnect();
        this.volume.disconnect();
        this.panner.disconnect();
        this.meter.disconnect();


        this. meter = new Tone.Meter({
            smoothing: METER_SMOOTHING
        });

        // graph:
        //
        // player -> volume -> panner -> destination
        //                            └-> meter
        //

        this.player.connect(this.volume);

        this.volume.connect(this.panner);
        this.volume.connect(this.meter);

        this.panner.connect(destination);


        this.state = "connected";
    }


    /**
     * Permanent cleanup.
     * Call when switching songs and abandoning Track.
     */
    dispose() {

        if (this.state !== "connected") return;

        if (this.player) {
            this.player.unsync();

            this.player.stop(Tone.now());

            // remove routing only
            this.player.disconnect();

            this.player.dispose();
            this.player = null;
        }

        this.volume.disconnect();
        this.panner.disconnect();
        this.meter.disconnect();

        this.volume.dispose();
        this.panner.dispose();
        this.meter.dispose();

        this.state = "disposed";
    }






    genUrl(trackConfig) {

        if (trackConfig.url) {
            return trackConfig.url;
        }

        if (!trackConfig.filename) {
            throw new Error("No filename provided");
        }

        return `${trackConfig.song_database_dir}/${trackConfig.songId}/${trackConfig.filename}`;
    }



    genLabel(trackConfig) {

        if (trackConfig.label) {
            return trackConfig.label;
        }

        if (this.url) {

            return this.url
                .split("/")
                .pop()
                .split(".")[0]
                .slice(-9);
        }

        return String(trackConfig.id);
    }

    setPan(pan,transitionTime = 0.03){
        this.pan = pan;
        this.panner.pan.rampTo(parseFloat(pan),transitionTime);
    }

    setVol(vol,transitionTime = 0.03){
        this.vol = vol;
        if (!this.volume.mute){
            this.volume.volume.rampTo(parseFloat(vol),transitionTime);
        }
    }

    setMute(){
        this.volume.mute = true;
    }

    setUnmute(){
        this.volume.mute = false
        this.setVol(this.vol);
    }

    async getFileSize(){
        if (this.fileSize) return this.fileSize;
        if (!this.url) return null; // cancel if no url exists

        try {
            const response = await fetch(this.url, { method: 'HEAD' });

            if (!response.ok) {
                console.warn(`Could not fetch headers for ${this.url}`);
                return null;
            }

            const sizeInBytes = response.headers.get('content-length');
            this.fileSize = sizeInBytes ? parseInt(sizeInBytes, 10) : 0;
            return this.fileSize;

        } catch (error) {
            console.error(`Network or CORS error fetching size for ${this.url}:`, error);
            return null;
        }

    }






}