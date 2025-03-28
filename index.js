import { setupShortcuts } from "./shortcut.js";

document.addEventListener("DOMContentLoaded", () => {
  const elements = {
      dropZone: document.getElementById("drop-zone"),
      playerContainer: document.getElementById("player-container"),
      playerTitle: document.getElementById("player-title"),
      backButton: document.getElementById("back-button"),
      audioElement: document.getElementById("audio-player"),
      forwardButton: document.getElementById("forward"), // ID 수정
      rewindButton: document.getElementById("rewind"),   // ID 수정      
      loopButton: document.getElementById("toggle-loop"),
      speedBar: document.getElementById("speed-bar"),
      speedLabel: document.getElementById("speed-label"),
      sendButton: document.getElementById("send-button"),
      canvas: document.getElementById("waveform"),
      ctx: document.getElementById("waveform").getContext("2d"),
      transcriptionDiv: document.getElementById("transcription"),
      loader: document.getElementById("loader"),
      processingText: document.getElementById("processingText"),
  };

    function resizeUI() {
	elements.playerContainer.style.width = "800px";
	elements.canvas.width = 780;
	elements.canvas.height = 150;
    }

    function handleDragOver(event) {
	event.preventDefault();
	elements.dropZone.style.borderColor = "gray";
    }

    function handleDragLeave() {
	elements.dropZone.style.borderColor = "gray";
    }
    let waveformData = []; // 고정된 파형 데이터 저장

    // 고정된 회색 파형을 생성
    function generateWaveform() {
	const { ctx, canvas } = elements;
	waveformData = []; // 기존 데이터 초기화
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// 회색 파형 그리기
	ctx.fillStyle = "gray";
	for (let i = 0; i < canvas.width; i += 4) {
            const barHeight = Math.random() * canvas.height;
            waveformData.push(barHeight); // 높이를 저장
            ctx.fillRect(i, canvas.height - barHeight, 3, barHeight);
	}
    }

    // 파형의 진행 상태 (빨간색 파형)
    function drawProgress() {
	const { ctx, canvas, audioElement } = elements;
	const progress = audioElement.currentTime / audioElement.duration;

	// 기존 회색 파형을 다시 그리기
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "gray";
	for (let i = 0; i < waveformData.length; i++) {
            const barHeight = waveformData[i];
            ctx.fillRect(i * 4, canvas.height - barHeight, 3, barHeight);
	}

	// 진행 중인 빨간색 반투명 파형 그리기
	ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // 반투명 빨간색
	ctx.fillRect(0, 0, canvas.width * progress, canvas.height);
    }

    function handleDrop(event) {
	event.preventDefault();
	// dropzone의 위치와 크기 가져오기
	const dropZoneRect = elements.dropZone.getBoundingClientRect();

	// playercontainer를 dropzone의 위치에 맞게 설정
	elements.playerContainer.style.position = "absolute";  // 절대 위치로 설정
	elements.playerContainer.style.top = `${dropZoneRect.top}px`;  // dropzone의 top 위치로 설정
	elements.playerContainer.style.left = `${dropZoneRect.left}px`;  // dropzone의 left 위치로 설정
	elements.playerContainer.style.width = `${dropZoneRect.width}px`;  // dropzone의 width로 설정
	elements.playerContainer.style.height = `${dropZoneRect.height}px`;  // dropzone의 height로 설정
	elements.playerContainer.style.display = "flex";  // playercontainer 표시
	
	elements.dropZone.style.display = "none";
	// elements.playerContainer.style.display = "flex";

	const files = event.dataTransfer.files;
	if (files.length > 0) {
	    const file = files[0];
	    if (file.type.startsWith("audio/")) {
		elements.audioElement.src = URL.createObjectURL(file);
		elements.playerTitle.textContent = file.name;
		generateWaveform();	  
		// drawWaveform();
	    } else {
		alert("MP3 파일을 드롭하세요!");
	    }
	}
    }


    function toggleLoop() {
	elements.audioElement.loop = !elements.audioElement.loop;
	elements.loopButton.classList.toggle("on", elements.audioElement.loop);
	elements.loopButton.classList.toggle("off", !elements.audioElement.loop);
    }


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
	if (!elements.audioElement.src) {
	    alert("Please add an audio file.");
	    return;
	}
	
	const formData = new FormData();
	
	fetch(elements.audioElement.src)
	    .then(response => response.blob())
	    .then(blob => {
		formData.append("file", blob, "audio.mp3");
		formData.append("language", selectedLanguage);
		formData.append("model", selectedModel);

		elements.transcriptionDiv.textContent = "";
		elements.loader.style.display = "block";
		elements.processingText.style.display = "block";

		return fetch('http://localhost:5001/transcribe', { method: 'POST', body: formData });
	    })
	    .then(response => {
		// 서버의 응답이 JSON 형식인지 확인
		if (!response.ok) {
		    throw new Error('Failed to send request to server');
		}
		return response.json();
	    })
	    .then(data => {
		elements.loader.style.display = "none";
		elements.processingText.style.display = "none";
		elements.transcriptionDiv.textContent = data.error ? `오류 발생: ${data.error}` : data.text;
	    })
	    .catch(error => {
		elements.loader.style.display = "none";
		elements.processingText.style.display = "none";
		console.error("Error:", error);
		elements.transcriptionDiv.innerHTML = `<p style="color:red;">서버 오류 발생</p>`;
	    });
    }

    // UI 초기 설정
    resizeUI();

    // 이벤트 리스너 추가
    elements.backButton.addEventListener("click", () => {
	elements.playerContainer.style.display = "none";
	elements.dropZone.style.display = "block";
	elements.audioElement.pause();
    });
        function changeButtonColor(button) {
        button.style.backgroundColor = "#C66720";
        setTimeout(() => {
            button.style.backgroundColor = ""; // 원래 색상으로 복귀
        }, 200);
    }

    function forwardAudio() {
        elements.audioElement.currentTime += 5;
        changeButtonColor(elements.forwardButton);
    }

    function rewindAudio() {
        elements.audioElement.currentTime -= 5;
        changeButtonColor(elements.rewindButton);
    }

    // 버튼 클릭 이벤트 추가
    elements.forwardButton.addEventListener("click", forwardAudio);
    elements.rewindButton.addEventListener("click", rewindAudio);

    // 🔥 이벤트 리스너 추가
    elements.audioElement.addEventListener("timeupdate", drawProgress);
    elements.audioElement.addEventListener("seeked", drawProgress);

    elements.dropZone.addEventListener("dragover", handleDragOver);
    elements.dropZone.addEventListener("dragleave", handleDragLeave);
    elements.dropZone.addEventListener("drop", handleDrop);
    elements.loopButton.addEventListener("click", toggleLoop);
    elements.sendButton.addEventListener("click", sendAudioToServer);

// forwardAudio와 rewindAudio를 setupShortcuts에 전달
    setupShortcuts(elements.audioElement, elements.loopButton, elements.speedBar, elements.speedLabel, forwardAudio, rewindAudio);    
});
