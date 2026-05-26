
const BAR_CLASSNAME = "progress-bar w-100 h-100 round" + " ";
const BAR_CLASSNAME_GREEN = BAR_CLASSNAME + "bg-green shadow-green"
const BAR_CLASSNAME_BLUE = BAR_CLASSNAME  + "bg-blue shadow-blue"
const BAR_CLASSNAME_BRIGHT = BAR_CLASSNAME  + "bg-bright shadow-bright"
const BAR_CLASSNAME_RED = BAR_CLASSNAME  + "bg-red shadow-red"

const LABEL_CLASS_NAME = "label small  color-transition" + " ";
const LABEL_CLASS_NAME_GREEN = LABEL_CLASS_NAME +"green";
const LABEL_CLASS_NAME_BLUE = LABEL_CLASS_NAME +"blue";
const LABEL_CLASS_NAME_RED = LABEL_CLASS_NAME +"red";
const LABEL_CLASS_NAME_BRIGHT = LABEL_CLASS_NAME +"bright";
const LABEL_CLASS_NAME_LIGHTER_GRAY = LABEL_CLASS_NAME +"lighter-gray";

const UPDATE_DELAY = 300; // in milliseconds



export class Progress{

    bars = [];
    labels = [];
    channelContents = [];

    constructor(mixer) {
        this.mixer = mixer;
        this.channelContents = mixer.channelContents;

        this.channelContents.forEach((channelContent,channelId) => {
            this.createBarAndLabel(channelContent);
            this.updateBarAndLabel(channelId, 0, "PENDING");
        })

    }


    show() {
        if (!this.mixer.isActive) return;

        // if (!this.mixer || !this.mixer.song || !this.mixer.song.buffer){
        //     setTimeout(this.update, UPDATE_DELAY);
        // }

        const progresses = this.mixer.song.buffer.getProgress();
        if (progresses.length === 0) {
            setTimeout(this.show.bind(this),UPDATE_DELAY);
            return;
        }

        progresses.forEach((track, channelId) => {
            this.updateBarAndLabel(channelId, track.progress, track.state);
        });


        if (this.mixer.song.isLoaded) return;

        setTimeout(this.show.bind(this), UPDATE_DELAY);


    }



    createBarAndLabel(channelContent) {
        channelContent.innerHTML = "";

        const barBackground = document.createElement("div");
        barBackground.className = "bar vertical flex-column flex-grow border round bg-dark";

        const bar = document.createElement("div");
        bar.className = BAR_CLASSNAME_GREEN;

        const label = document.createElement("div");
        label.className = LABEL_CLASS_NAME;

        barBackground.appendChild(bar);
        channelContent.appendChild(barBackground);
        channelContent.appendChild(label);

        this.bars.push(bar);
        this.labels.push(label);

    }



    updateBarAndLabel(channelId, progress, state) {

        const bar = this.bars[channelId];
        const label = this.labels[channelId];

        label.innerText = state;

        switch (state) {
            case "MASTER":
                label.innerText = "LOADING";
                bar.style.transform = `scaleY(${progress})`;
                this.setClassName(bar,BAR_CLASSNAME_BRIGHT);
                this.setClassName(label,LABEL_CLASS_NAME_BRIGHT);
                break;

            case "LOADING":
                bar.style.transform = `scaleY(${progress})`;
                this.setClassName(bar,BAR_CLASSNAME_GREEN);
                this.setClassName(label,LABEL_CLASS_NAME_GREEN);
                break;

            case "DECODING":
                bar.style.transform = "scaleY(1)";
                this.setClassName(bar,BAR_CLASSNAME_BRIGHT);
                this.setClassName(label,LABEL_CLASS_NAME_BRIGHT);
                break;

            case "READY":
                bar.style.transform = "scaleY(1)";
                this.setClassName(bar,BAR_CLASSNAME_BLUE);
                this.setClassName(label,LABEL_CLASS_NAME_BLUE);

                break;

            case "ERROR":
                bar.style.transform = "scaleY(1)";
                this.setClassName(bar,BAR_CLASSNAME_RED);
                this.setClassName(label,LABEL_CLASS_NAME_RED);

                break;

            case "PENDING":
                bar.style.transform = "scaleY(0)";
                this.setClassName(bar,BAR_CLASSNAME_GREEN);
                this.setClassName(label,LABEL_CLASS_NAME_LIGHTER_GRAY);
                break;
            // default:
            //     bar.style.transform = "scaleY(0)";
            //     this.setClassName(bar,BAR_CLASSNAME_GREEN);
            //     this.setClassName(label,LABEL_CLASS_NAME_LIGHTER_GRAY);
            //     break;
        }
    }

setClassName(element,newClassName) {
        if (newClassName === element.className) return;
        element.className = newClassName;
}



}