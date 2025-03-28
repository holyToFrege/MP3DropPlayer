from flask import Flask, request, jsonify
import whisper
import numpy as np
import io
from pydub import AudioSegment
import torch

app = Flask(__name__)

# 모델 로딩 함수
def load_model(model_name):
    model_mapping = {
        "tiny": "tiny",
        "base": "base",
        "small": "small",
        "medium": "medium",
        "large": "large",
        "large-v2": "large-v2"
    }

    if model_name in model_mapping:
        return whisper.load_model(model_mapping[model_name])
    else:
        raise ValueError(f"Unsupported model name: {model_name}")

# 오디오를 작은 청크로 나누는 함수
def split_audio(audio, chunk_length_ms=30000):  # 기본값은 30초
    chunks = []
    start_time = 0
    while start_time < len(audio):
        end_time = min(start_time + chunk_length_ms, len(audio))
        chunk = audio[start_time:end_time]
        chunks.append(chunk)
        start_time = end_time
    return chunks

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        print("\n===== New Request Received =====")
        print(f"Headers: {request.headers}")
        print(f"Form Data: {request.form}")

        # 파일과 언어, 모델 정보 받아오기
        if 'file' not in request.files:
            print("Error: No file uploaded")
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        language = request.form.get('language', 'en')
        model_name = request.form.get('model', 'base')  # 클라이언트에서 모델 선택을 받음

        print(f"Received file: {file.filename}, Language: {language}, Model: {model_name}")

        # 모델 로딩
        model = load_model(model_name)
        print("Model loaded successfully.")

        # 파일을 메모리에서 읽고 변환
        audio = AudioSegment.from_file(io.BytesIO(file.read()))
        audio = audio.set_channels(1).set_frame_rate(16000)  # 1채널, 16kHz로 변환
        print(f"Audio duration: {len(audio) / 1000} seconds")

        # 오디오를 작은 청크로 나누기
        chunks = split_audio(audio)
        print(f"Audio split into {len(chunks)} chunks.")

        transcriptions = []
        
        for i, chunk in enumerate(chunks):
            print(f"Processing chunk {i+1}/{len(chunks)}...")

            # 오디오를 numpy 배열로 변환 (16비트 PCM → float32 변환)
            samples = np.array(chunk.get_array_of_samples(), dtype=np.float32)
            samples /= np.iinfo(np.int16).max  # 정규화 (-1.0 ~ 1.0)

            # 변환된 배열이 비어 있는지 확인
            if samples.size == 0:
                print("Error: Empty audio chunk detected.")
                return jsonify({"error": "Empty audio file or conversion issue."}), 400

            # Whisper 모델에 맞게 데이터를 변환 (numpy -> torch.Tensor)
            mel = whisper.pad_or_trim(samples)  # Whisper 모델에 맞게 오디오를 패딩 및 잘라냄
            mel = torch.from_numpy(mel).float().to(model.device)  # torch.Tensor로 변환

            # Whisper 모델로 전사 실행
            result = model.transcribe(mel, language=language, temperature=0, beam_size=5)
            transcriptions.append(result["text"])

        # 전체 텍스트 결과 결합
        full_transcription = "\n".join(transcriptions)

        # **출력 포맷 개선 (줄바꿈 추가)**
        formatted_text = full_transcription.replace(". ", ".\n")

        print("===== Transcription Complete =====")
        print(f"Transcription Result:\n{formatted_text[:500]}")  # 긴 경우 앞부분만 출력

        return jsonify({"text": formatted_text})
    
    except ValueError as e:
        print(f"Model loading error: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
