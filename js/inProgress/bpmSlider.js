import {updateTempo, activeSong} from "../main.js";

const bpmDisplay =document.createElement('div');
const bpmSlider = document.createElement('input');

export function createBpmSlider(parentDiv) {
    bpmDisplay.innerHTML = activeSong ? activeSong.bpm : '120';

    bpmSlider.type = 'range';
    bpmSlider.id = 'bpmSlider';
    bpmSlider.min = '0.5';
    bpmSlider.max = '2';
    bpmSlider.step = '0.001';
    bpmSlider.style.flexGrow = '1';
    bpmSlider.value = '1';
    bpmSlider.oninput = (e) =>  onInputChange(e.target.value);



    parentDiv.appendChild(bpmDisplay);
    parentDiv.appendChild(bpmSlider);
}


function onInputChange(ratio) {
    updateTempo(ratio);
    bpmDisplay.innerHTML = Math.round(Tone.Transport.bpm.value);

}