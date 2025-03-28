import whisper
from pydub import AudioSegment
import sys

# MP3 파일을 WAV로 변환하는 함수
def mp3_to_wav(mp3_path, wav_path):
    audio = AudioSegment.from_mp3(mp3_path)
    audio.export(wav_path, format="wav")

# Whisper 모델 로드
model = whisper.load_model("base")  # 'base' 모델은 중간 성능과 속도를 제공

# MP3 파일을 텍스트로 변환하는 함수
def transcribe_audio(mp3_path):
    wav_path = mp3_path.replace(".mp3", ".wav")
    mp3_to_wav(mp3_path, wav_path)
    result = model.transcribe(wav_path)
    return result['text']

if __name__ == "__main__":
    mp3_path = sys.argv[1]  # 명령행 인수로 MP3 파일 경로를 받음
    print(transcribe_audio(mp3_path))  # 텍스트를 출력
