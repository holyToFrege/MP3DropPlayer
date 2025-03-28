export function setupShortcuts(audioElement, loopButton, speedBar, speedLabel, forwardAudio, rewindAudio) {    
    let loopStart = null;
    let loopEnd = null;
    let isLooping = false;

    function toggleLoop() {
        audioElement.loop = !audioElement.loop;	
	loopButton.classList.toggle("on", audioElement.loop);
	loopButton.classList.toggle("off", !audioElement.loop);
    }

    function updateWaveform() {
        const event = new Event("waveformUpdate");
        document.dispatchEvent(event);
    }

    

    document.addEventListener("keydown", (event) => {
        event.preventDefault();  // 🔥 브라우저 기본 동작 차단

        switch (event.code) {
        case "Space":
            if (audioElement.paused) audioElement.play();
            else audioElement.pause();
            break;
        case "ArrowRight":
            audioElement.currentTime += 5;
            updateWaveform();
	    forwardAudio();
            break;
        case "ArrowLeft":
            audioElement.currentTime -= 5;
            updateWaveform();
	    rewindAudio();
            break;
        case "ArrowUp":
            audioElement.playbackRate = Math.min(audioElement.playbackRate + 0.1, 2);
            speedBar.value = audioElement.playbackRate;
            speedLabel.textContent = audioElement.playbackRate.toFixed(1) + "x";
            break;
        case "ArrowDown":
            audioElement.playbackRate = Math.max(audioElement.playbackRate - 0.1, 0.5);
            speedBar.value = audioElement.playbackRate;
            speedLabel.textContent = audioElement.playbackRate.toFixed(1) + "x";
            break;
        case "KeyA":
            loopStart = audioElement.currentTime;
            break;
        case "KeyB":
            loopEnd = audioElement.currentTime;
            isLooping = true;
                break;
        case "KeyL":
            toggleLoop();
            break;
        }
    });
}
