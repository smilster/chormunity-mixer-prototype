# Magic Mixer

### Live Demo
https://smilster.github.io/chormunity-mixer-prototype

### planned features

- correct transport position display for songs that change timeSignature
- synthesizer click
- solo buttons
- master channel
- backend build (ffmpeg, rubberband) to autogenerate songs at different tempi (better quality than GrainPlayer)
- track resolved pitch detection (sounds a bit cpu heavy though)
- add duration (bars:measure) to song selector after track has been loaded

### Known Issues



#### Windows 10 with Edge

- might not decode m4a files -> mp3s work

#### old iPhones, Safari, Opera
- issues with vertical `<input>` or `writing-mode: lr` -> needs to be replaced by custom volume slider div 

#### Linux, Chromium, Firefox 

- initial sound stuttering (perhaps just bad sound card or system audio configurations)

    -> apparently gone with new audio buffering

#### Apple devices

- usually don't decode ogg files (-> m4a is the smallest solution, mp3 is also very good)



