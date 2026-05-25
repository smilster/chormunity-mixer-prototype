import {Master} from "./Master.js";
import {activeSong} from "./main.js";


let mixer;
let channelContents;
let meters;



const DB_MIN_VOLUME = -30;
const DB_MAX_VOLUME = 6;
const DB_RANGE_VOLUME = DB_MAX_VOLUME - DB_MIN_VOLUME;


const DB_MIN_METER = -50;
const DB_MAX_METER = 0;
const DB_RANGE_METER = DB_MAX_METER - DB_MIN_METER;

const DB_MIN_MASTER_METER = DB_MIN_METER - 12;
const DB_MAX_MASTER_METER = 0;
const DB_RANGE_MASTER_METER = DB_MAX_MASTER_METER - DB_MIN_MASTER_METER;

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
        createChannel(track.label);
    });

    createChannel("master")


    return channelContents;
}

function createChannel(label){
    const channel = document.createElement("div");
    // channel.id = 'channel-' + node.id;
    channel.className = 'mixer-channel flex-column border round center bg-gray';


    const channelLabel = document.createElement("div");
    // channelLabel.id = 'channel-label-' + node.id;
    channelLabel.className = 'label blue';
    channelLabel.innerHTML = label;


    const channelContent = document.createElement("div");
    // channelContent.id = 'channel-content-' + node.id;
    channelContent.className = 'flex-grow flex-column center w-100 space-evenly';

    if (label === 'master') {
        channelLabel.className = 'label bright';
        channel.classList.remove('bg-gray')
        channel.classList.add('bg-light-gray');
    }



    // build
    channel.appendChild(channelLabel);
    channel.appendChild(channelContent);

    mixer.appendChild(channel);

    // save for layer filling, i.e., progress bar and channel controls
    channelContents.push(channelContent);
}
//
export function createTrackControls(song) {
    song.tracks.forEach((track,id) => {
        const channelContent = channelContents[id];
        channelContent.innerHTML = '';

        channelContent.appendChild(createPanControl(track.pan,track.setPan.bind(track)));
        channelContent.appendChild(createVolumeControl(track.vol,track.setVol.bind(track),track.id));
        channelContent.appendChild(createMuteButton(track));

    })


    const masterId = song.numTracks;
    const channelContent = channelContents[masterId];
    channelContent.innerHTML = '';

    const pannerSpace = document.createElement("div");
    pannerSpace.className = 'flex-grow';

    const muteSpace = document.createElement("div");
    muteSpace.className = 'label small opacity-0 no-interact';
    muteSpace.innerHTML = "MUTE";

    channelContent.appendChild(pannerSpace);
    channelContent.appendChild(createVolumeControl(song.masterGain,Master.setVol.bind(Master),masterId,true));
    channelContent.appendChild(muteSpace);

}





function createPanControl(pan,setPan) {
    const panControl = document.createElement("div");
    panControl.className = 'center';


    const panSlider = document.createElement("input")
    panSlider.type = 'range'
    panSlider.className = 'pan-slider flex-grow bar w-100 bg-dark round border';

    panSlider.step = '0.01';
    panSlider.min = '-1';
    panSlider.max = '1';
    panSlider.value = pan.toString();
    panSlider.addEventListener('input', (event) => {
        panSlider.onchange = (event) => {
            setPan(event.target.value);
        }
    })


    // panControl.appendChild(panLabel);
    panControl.appendChild(panSlider);

    return panControl;
}


function createVolumeControl(vol,setVol,id, isMaster = false) {
    const volumeControl = document.createElement("div");
    volumeControl.className = ' w-100';
    if (isMaster) {volumeControl.classList.remove('flex-grow');}



    const sliderMeterWrapper = document.createElement("div");
    sliderMeterWrapper.className = ' flex-row w-100 space-around';


    const volumeSlider = document.createElement("input")
    volumeSlider.type = 'range'
    volumeSlider.className = 'volume-slider bar vertical invertY bg-dark round border h-180px';
    // volumeSlider.orientation = 'vertical'
    //
    volumeSlider.step = '0.01';

    if (isMaster){
        volumeSlider.max = "1.5";
        volumeSlider.min = "0";
        volumeSlider.value = vol.toString();
        setVol(vol);

        volumeSlider.addEventListener('input', (event) => {
            let vol = event.target.value;
            vol = Math.pow(vol,3);
            setVol(vol)
        })
    } else {
        volumeSlider.max = DB_MAX_VOLUME.toString();
        volumeSlider.min = DB_MIN_VOLUME.toString();
        volumeSlider.value = vol.toString();
        volumeSlider.addEventListener('input', (event) => {

            let vol = event.target.value
            vol = vol < (DB_MIN_VOLUME + 2) ? -100.0 : vol;
            setVol(vol)
        })
    }


    const fullMeter = document.createElement("div");
    fullMeter.className = 'full-meter bar vertical bg-dark round border h-180px';

    const meter  =document.createElement('div');
    meter.className = 'meter w-100 h-100 round ';
    meter.style.backgroundColor = "var(--color-green)"
    meters[id] = meter;

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
            track.setUnmute();muteButton.classList.remove('bg-red','bright');
            muteButton.classList.add('bg-light-gray','lighter-gray');
        } else {
            track.setMute();
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
        updateMeter(track.meter.getValue(),id);
    })
    const masterId = song.numTracks;
    updateMeter(Master.meter.getValue(),masterId);

}

function updateMeter(meterValue,id){
    const db = meterValue;
    const dbMinMeter = activeSong && id === activeSong.numTracks ? DB_MIN_MASTER_METER: DB_MIN_METER;
    const dbRangeMeter = activeSong && id === activeSong.numTracks ? DB_RANGE_MASTER_METER : DB_RANGE_METER;
    const percentage = Math.pow(Math.max(Math.min( (db - dbMinMeter) / dbRangeMeter,1),0),0.5)
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
}


////






