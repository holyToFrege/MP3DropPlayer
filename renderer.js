const dropZone = document.querySelector(".drop-zone");

dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.style.borderColor = "blue"; // 드래그 중일 때 색 변경
});

dropZone.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "#333"; // 원래 색으로 복귀
});

dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.style.borderColor = "#333"; // 원래 색으로 복귀

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const filePath = files[0].path;
        console.log("MP3 파일 경로:", filePath);
        // 여기에 MP3 파일 재생 기능 추가 가능
    }
});

const { exec } = require('child_process');
const path = require('path');
const { dialog } = require('electron');

// MP3 파일을 텍스트로 변환하는 함수
function transcribeMP3(mp3Path) {
    const pythonScript = path.join(__dirname, 'transcribe.py');  // Python 스크립트 경로
    exec(`python3 ${pythonScript} "${mp3Path}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`Transcription: ${stdout}`);
        // 텍스트를 UI에 표시하는 코드 추가
        displayTranscription(stdout);
    });
}

// UI에 변환된 텍스트를 표시하는 함수
function displayTranscription(transcription) {
    const transcriptionElement = document.getElementById("transcription");
    transcriptionElement.textContent = transcription;
}

// 파일 선택 대화상자 열기
document.getElementById("selectFile").addEventListener("click", () => {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'MP3 Files', extensions: ['mp3'] }
        ]
    }).then(result => {
        if (!result.canceled) {
            const mp3Path = result.filePaths[0];
            transcribeMP3(mp3Path);  // 파일 경로를 Python 스크립트로 전달
        }
    }).catch(err => {
        console.error(err);
    });
});
