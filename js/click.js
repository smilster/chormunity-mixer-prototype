// CLICK



function click(){

    // 1. Create a low-pass filter to soften the click
    const clickFilter = new Tone.Filter({
        type: "lowpass",
        frequency: 1000, // Low frequency gives it a "wood block" or "plastic" click feel
        Q: 1
    }).connect(Master.bus);

// 2. Create the noise synth and connect it to the filter
    const beatClick = new Tone.Synth({
        oscillator: {
            type: 'sine',
            modulationFrequency: 0.2,
        },
        envelope: {
            attack: 0,
            decay: 0.05,
            sustain: 0,
            release: 0.1,
        }
    }).connect(clickFilter);


    const barClick = new Tone.Synth({
        oscillator: {
            type: 'sine',
            modulationFrequency: 0.2,
            detune: 700,
        },
        envelope: {
            attack: 0,
            decay: 0.05,
            sustain: 0,
            release: 0.1,
        }
    }).connect(clickFilter);

    const chordEvent = new Tone.ToneEvent(((time, note) => {
        // the chord as well as the exact time of the event
        // are passed in as arguments to the callback function
        if (Tone.getTransport().position.split(":")[1] === "0" ){
            barClick.triggerAttackRelease(note, "32n",time)
        } else {
            beatClick.triggerAttackRelease(note, "32n",time)
        }

        ;
    }), "C5");
// start the chord at the beginning of the transport timeline

    chordEvent.start("0");
// loop it every measure for 8 measures
    chordEvent.loop = true;
    chordEvent.loopEnd = "4n";


}
