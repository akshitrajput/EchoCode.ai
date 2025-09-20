from fastapi import APIRouter, UploadFile, File, HTTPException
import speech_recognition as sr
import io

router = APIRouter()

@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    try:
        audio_bytes = await audio.read()
        audio_stream = io.BytesIO(audio_bytes)
        
        r = sr.Recognizer()
        with sr.AudioFile(audio_stream) as source:
            audio_data = r.record(source) # read the entire audio file

        # recognize speech using Google Speech Recognition
        try:
            text = r.recognize_google(audio_data)
            return {"text": text}
        except sr.UnknownValueError:
            raise HTTPException(status_code=400, detail="Could not understand audio")
        except sr.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Could not request results; {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))