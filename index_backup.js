document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("drop-zone");
    const playerContainer = document.getElementById("player-container");
    const playerTitle = document.getElementById("player-title");
    const backButton = document.getElementById("back-button");
    const audioElement = document.getElementById("audio-player");
    const loopButton = document.getElementById("loop-button");
    const speedBar = document.getElementById("speed-bar");
    const speedLabel = document.getElementById("speed-label");
    const sendButton = document.getElementById("send-button");    
    // const waveformContainer = document.getElementById("waveform-container");
    sendButton.addEventListener("click", sendAudioToServer);
    const canvas = document.getElementById("waveform");
    if (!canvas) {
        console.error("Error: Canvas element not found.");
        return;
    }    
    const ctx = canvas.getContext("2d");
    const recognition = setupSTT();

    let loopStart = null;
    let loopEnd = null;
    let isLooping = false;
    
    function resizeUI() {
        playerContainer.style.width = "800px";
        canvas.width = 780;
        canvas.height = 150;
    }
    resizeUI();
    
    backButton.addEventListener("click", () => {
        playerContainer.style.display = "none";
        dropZone.style.display = "block";
        audioElement.pause();
        recognition.stop();
    });

    dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropZone.style.borderColor = "blue";
    });
    
    dropZone.addEventListener("dragleave", () => {
        dropZone.style.borderColor = "gray";
    });
    
    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropZone.style.display = "none";
        playerContainer.style.display = "flex";
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith("audio/")) {
                const filePath = URL.createObjectURL(file);
                audioElement.src = filePath;
                playerTitle.textContent = file.name;
                drawWaveform();
            } else {
                alert("MP3 파일을 드롭하세요!");
            }
        }
    });
    function drawWaveform() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "gray";
        for (let i = 0; i < canvas.width; i += 4) {
            const barHeight = Math.random() * canvas.height;
            ctx.fillRect(i, canvas.height - barHeight, 3, barHeight);
        }
    }

    loopButton.addEventListener("click", toggleLoop);
    
    function toggleLoop() {
        audioElement.loop = !audioElement.loop;
        loopButton.classList.toggle("active");
        loopButton.textContent = audioElement.loop ? "🔁 Loop On" : "🔁 Loop Off";
    }
// script.js

let selectedLanguage = "en";  // 기본 언어를 영어로 설정
let selectedModel = "tiny";   

// 언어 선택 (라디오 버튼)
const languageRadios = document.querySelectorAll('input[name="language"]');
languageRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        selectedLanguage = event.target.value;
        // alert(`Language set to ${event.target.value}.`);
    });
});

// 모델 선택 시 처리
document.getElementById("modelSelect").addEventListener("change", (event) => {
    selectedModel = event.target.value;
});

function sendAudioToServer() {
    const transcriptionDiv = document.getElementById("transcription");
    const loader = document.getElementById("loader");
    const processingText = document.getElementById("processingText");

    if (!audioElement.src) {
        alert("Please add an audio file.");
        return;
    }

    const formData = new FormData();

    fetch(audioElement.src)
        .then(response => response.blob())
        .then(blob => {
            formData.append("file", blob, "audio.mp3");
            formData.append("language", selectedLanguage);
            formData.append("model", selectedModel);

            // 🔥 기존 텍스트 지우고 로딩 표시
            transcriptionDiv.textContent = "";
            loader.style.display = "block";  // 로딩 애니메이션 표시
            processingText.style.display = "block";  // "처리 중..." 표시

            return fetch('http://localhost:5001/transcribe', {
                method: 'POST',
                body: formData
            });
        })
        .then(response => response.json())
        .then(data => {
            loader.style.display = "none";  // 로딩 애니메이션 숨김
            processingText.style.display = "none";  // "처리 중..." 숨김

            if (data.error) {
                console.error("Error:", data.error);
                transcriptionDiv.innerHTML = `<p style="color:red;">오류 발생: ${data.error}</p>`;
            } else {
                transcriptionDiv.textContent = data.text;  // 결과 표시
            }
        })
        .catch(error => {
            loader.style.display = "none";
            processingText.style.display = "none";
            console.error("Error:", error);
            transcriptionDiv.innerHTML = `<p style="color:red;">서버 오류 발생</p>`;
        });
}

    
    function updatePlaybackIndicator() {
        const progress = (audioElement.currentTime / audioElement.duration) * canvas.width;
        ctx.fillStyle = "red";
        ctx.fillRect(progress, 0, 2, canvas.height);
    }
    
    audioElement.addEventListener("timeupdate", updatePlaybackIndicator);
    
document.addEventListener("keydown", (event) => {
    event.preventDefault();  // 🔥 브라우저 기본 동작 차단

    const speedBar = document.getElementById("speed-bar");
    const speedLabel = document.getElementById("speed-label");

    switch (event.code) {
        case "Space":
            if (audioElement.paused) audioElement.play();
            else audioElement.pause();
            break;
        case "ArrowRight":
        audioElement.currentTime += 5;
	updateWaveform();  // ✅ 음파 다시 그리기
            break;
        case "ArrowLeft":
        audioElement.currentTime -= 5;
	updateWaveform();  // ✅ 음파 다시 그리기
            break;
        case "ArrowUp":
            audioElement.playbackRate = Math.min(audioElement.playbackRate + 0.1, 2);
            speedBar.value = audioElement.playbackRate;  // ✅ 슬라이더 UI 업데이트
            speedLabel.textContent = audioElement.playbackRate.toFixed(1) + "x";  // ✅ 속도 표시 업데이트
            break;
        case "ArrowDown":
            audioElement.playbackRate = Math.max(audioElement.playbackRate - 0.1, 0.5);
            speedBar.value = audioElement.playbackRate;  // ✅ 슬라이더 UI 업데이트
            speedLabel.textContent = audioElement.playbackRate.toFixed(1) + "x";  // ✅ 속도 표시 업데이트
            break;
        case "KeyA":
            loopStart = audioElement.currentTime;
            break;
        case "KeyB":
            loopEnd = audioElement.currentTime;
            isLooping = true;
        break;
        case "KeyL":  // 'L' 키로 Loop 토글
        toggleLoop();
        break;
    }	
});

// 🎚 속도 슬라이더 변경 시 반영
document.getElementById("speed-bar").addEventListener("input", function () {
    audioElement.playbackRate = parseFloat(this.value);  // 🎵 오디오 속도 조정
    document.getElementById("speed-label").textContent = this.value + "x";  // 🔢 속도 표시 업데이트
});

    let waveformImage = null;  // 🎵 음파 이미지 저장 변수

function generateWaveform() {
    const canvas = document.getElementById("waveform");
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // ⚪️ **기본 음파(회색) 그리기**
    ctx.fillStyle = "#ccc";
    for (let i = 0; i < width; i += 3) {
        let barHeight = Math.random() * height;  // 🔥 실제 데이터로 대체해야 함
        ctx.fillRect(i, height / 2 - barHeight / 2, 2, barHeight);
    }

    // 🎨 **이미지 데이터 저장 (기존 음파 유지)**
    waveformImage = ctx.getImageData(0, 0, width, height);
}

    // 🎵 **음파 진행 상태 업데이트**
function updateWaveform() {
    const canvas = document.getElementById("waveform");
    const ctx = canvas.getContext("2d");
    const totalDuration = audioElement.duration;
    const currentTime = audioElement.currentTime;

    if (!waveformImage) return; // ❌ waveform이 아직 생성되지 않음 (안전 처리)

    // 🎨 **저장된 음파 데이터 복원**
    ctx.putImageData(waveformImage, 0, 0);

    // 🔴 **재생된 부분을 반투명 빨간색으로 덮어쓰기**
    const playedWidth = (currentTime / totalDuration) * canvas.width;
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // 🔥 반투명 빨간색 적용
    ctx.fillRect(0, 0, playedWidth, canvas.height);
}

// 🎵 **MP3가 로드될 때 waveform 생성**
audioElement.addEventListener("loadedmetadata", () => {
    generateWaveform();
    updateWaveform();
});    
// 🎵 오디오가 진행될 때 waveform 갱신
audioElement.addEventListener("timeupdate", updateWaveform);
    
    function setupSTT() {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
    
        recognition.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript + " ";
            }
            document.getElementById("transcription").textContent = transcript.trim();
        };
    
        return recognition;
    }
});
