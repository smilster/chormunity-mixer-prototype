

let mixer;
let channelContents;
let meters;



const DB_MIN_VOLUME = -30;
const DB_MAX_VOLUME = 6;
const DB_RANGE_VOLUME = DB_MAX_VOLUME - DB_MIN_VOLUME;


const DB_MIN_METER = -50;
const DB_MAX_METER = 0;
const DB_RANGE_METER = DB_MAX_METER - DB_MIN_METER;

export function createMixer() {
    mixer = document.createElement("div");
    mixer.id = "mixer";
    mixer.className = "flex-wrap container border round center";

    return mixer;
}
export function initializeMixer(song) {
    channelContents = [];
    meters = [];
    // clear mixer
    mixer.innerHTML = '';



    song.tracks.forEach(track => {
        const channel = document.createElement("div");
        channel.id = 'channel-' + track.id;
        channel.className = 'mixer-channel flex-column border round center';


        const channelLabel = document.createElement("div");
        channelLabel.id = 'channel-label-' + track.id;
        channelLabel.className = 'label blue';
        channelLabel.innerHTML = track.label;


        const channelContent = document.createElement("div");
        channelContent.id = 'channel-content-' + track.id;
        channelContent.className = 'flex-grow flex-column center w-100 space-evenly';

        // build
        channel.appendChild(channelLabel);
        channel.appendChild(channelContent);

        mixer.appendChild(channel);

        // save for layer filling, i.e., progress bar and channel controls
        channelContents.push(channelContent);
    });


    return channelContents;
}
//
export function createTrackControls(song) {
    channelContents.forEach((channelContent,id) => {
        channelContent.innerHTML = '';


        channelContent.appendChild(createPanControl(song.tracks[id]));
        channelContent.appendChild(createVolumeControl(song.tracks[id]));
        channelContent.appendChild(createMuteButton(song.tracks[id]));

    })

}



function createPanControl(track) {
    const panControl = document.createElement("div");
    panControl.className = 'center';

    // const panLabel = document.createElement("div");
    // panLabel.className = 'center label small gray';
    // panLabel.innerHTML = "pan";

    const panSlider = document.createElement("input")
    panSlider.type = 'range'
    panSlider.className = 'pan-slider bar w-100 bg-dark round border';

    panSlider.step = '0.01';
    panSlider.min = '-1';
    panSlider.max = '1';
    panSlider.value = track.pan.toString();
    panSlider.addEventListener('input', (event) => {
        panSlider.onchange = (event) => {
            track.pan = event.target.value;
            track.panner.pan.rampTo(parseFloat(event.target.value),0.03);
        }
    })


    // panControl.appendChild(panLabel);
    panControl.appendChild(panSlider);

    return panControl;
}


function createVolumeControl(track) {
    const volumeControl = document.createElement("div");
    volumeControl.className = 'flex-grow w-100';



    const sliderMeterWrapper = document.createElement("div");
    sliderMeterWrapper.className = ' flex-row w-100 space-around';


    const volumeSlider = document.createElement("input")
    volumeSlider.type = 'range'
    volumeSlider.className = 'volume-slider bar vertical invertY bg-dark round border h-180px';
    // volumeSlider.orientation = 'vertical'
    //
    volumeSlider.step = '0.01';
    volumeSlider.max = DB_MAX_VOLUME.toString();
    volumeSlider.min = DB_MIN_VOLUME.toString();
    volumeSlider.value = track.vol.toString();
    volumeSlider.addEventListener('input', (event) => {

        let newVol = event.target.value
        newVol = newVol < (DB_MIN_VOLUME + 2) ? -100.0 : newVol;
        track.vol = newVol;
        if (!track.volume.mute){
            track.volume.volume.rampTo(parseFloat(newVol),0.03);
        }
    })


    const fullMeter = document.createElement("div");
    fullMeter.className = 'full-meter bar vertical bg-dark round border h-180px';

    const meter  =document.createElement('div');
    meter.className = 'meter w-100 h-100 round ';
    meter.style.backgroundColor = "var(--color-green)"
    meters[track.id] = meter;

    fullMeter.appendChild(meter);

    sliderMeterWrapper.appendChild(volumeSlider);
    sliderMeterWrapper.appendChild(fullMeter);

    volumeControl.appendChild(sliderMeterWrapper);

    return volumeControl;

}

function createMuteButton(track){
    const muteButton = document.createElement("div");
    muteButton.innerHTML = `mute`;
    muteButton.className = 'label small btn bg-light-gray lighter-gray round-sm color-transition w-100';
    muteButton.onclick = () => {
        if (track.volume.mute) {
            track.volume.mute = false
            track.volume.volume.rampTo(parseFloat(track.vol),0.03);
            muteButton.classList.remove('bg-red','bright');
            muteButton.classList.add('bg-light-gray','lighter-gray');
        } else {
            track.volume.mute = true;
            muteButton.classList.remove('bg-light-gray','lighter-gray');
            muteButton.classList.add('bg-red','bright');
        }
    }

    if (track.volume.mute) {
        track.volume.mute = false
        muteButton.click();
    }

    return muteButton;
}



export function updateMeters(song){
    song.tracks.forEach((track,id) => {
        const db = track.meter.getValue();
        const percentage = Math.pow(Math.max(Math.min( (db - DB_MIN_METER) / DB_RANGE_METER,1),0),0.5)
        if (meters[id]){
            meters[id].style.transform = `scaleY(${percentage})`;
            if (db < -12 ){
                meters[id].style.backgroundColor = "var(--color-green)"
            } else if (db < -6){
                meters[id].style.backgroundColor = "var(--color-yellow)"
            } else {
                meters[id].style.backgroundColor = "var(--color-red)"
            }
        }
    })
}


