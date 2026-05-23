export class Master {


    static setVol(newVol, transitionTime = 0.03) {
        this.vol = newVol;
        this.bus.gain.value = this.vol;
    }


    static connect(destination) {

        this.vol = 0.1;

        this.bus = new Tone.Gain({
            gain: this.vol
        });


        this.meter = new Tone.Meter({
            smoothing: 0
        });

        this.bus.connect(destination);
        destination.connect(this.meter);

    }


}





