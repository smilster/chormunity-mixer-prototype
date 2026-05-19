import {updateTempo, activeSong} from "./main.js";

export const bpmControls = document.createElement('div');
const bpmSlider = document.createElement('input');
const bpmDisplay =document.createElement('div');

export function createBpmControls(parentDiv){
    bpmControls.className = 'container border round w-90 maxw-1200px flex-row center';

    createBpmDisplay(bpmControls);

    createBpmSlider(bpmControls);

    createBpmResetButton(bpmControls);

    parentDiv.appendChild(bpmControls);


}



function createBpmSlider(parentDiv) {


    bpmSlider.className = 'bar bg-dark flex-grow m-10px bpm-slider border round';

    bpmSlider.type = 'range';

    bpmSlider.min = '0.75';
    bpmSlider.max = '1.25';
    bpmSlider.step = '0.001';
    bpmSlider.value = '1';
    bpmSlider.oninput = (e) =>  onInputChange(e.target.value);



    parentDiv.appendChild(bpmSlider);
}

function createBpmDisplay(parentDiv) {

    const wrapper = document.createElement("div");
    wrapper.className = "m-10px minw-100px position-relative h-50px";



    bpmDisplay.className = "lcd border round-sm bg-dark w-100 h-100 d-flex center  blue no-interact";
    bpmDisplay.innerHTML = `120`




    const positionDisplayLabel = document.createElement("div");
    positionDisplayLabel.className = "position-absolute label small lighter-gray";
    positionDisplayLabel.style.top = "-20px"
    // positionDisplayLabel.style.left = "50px"
    // positionDisplayLabel.style.transform = "translateX(-50%)"
    positionDisplayLabel.style.zIndex = "100";
    positionDisplayLabel.innerHTML = `BPM`


    wrapper.appendChild(bpmDisplay);
    wrapper.appendChild(positionDisplayLabel);

    parentDiv.appendChild(wrapper);

}

function createBpmResetButton(parentDiv) {
    const bpmResetButton = document.createElement("div");
    bpmResetButton.classList.add("m-10px","btn");

    const circle = document.createElement("div");
    circle.classList.add("circle-large","bg-gray","position-relative",'center');

    const bpmResetButtonSymbol = document.createElement("div");
    bpmResetButtonSymbol.classList.add("reset-btn","position-absolute");

    bpmResetButton.append(circle);
    circle.appendChild(bpmResetButtonSymbol);
    parentDiv.appendChild(bpmResetButton);

    // 3. Add the click event listener
    bpmResetButton.addEventListener("click", resetBPMControls)
}



//  this is funnily covoluten with updateTempo in main
function onInputChange(playbackRate) {
    updateTempo(playbackRate);
    bpmDisplay.innerHTML = Math.round(activeSong.bpm * playbackRate).toString();
}

export function resetBPMControls(){
    bpmSlider.value = "1";
    onInputChange(1);
}