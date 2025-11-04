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
            audio_data = r.record(source)

        text = ""
        lang = ""

        # 1. Try to recognize as English first
        try:
            text = r.recognize_google(audio_data, language='en-IN')
            lang = 'en'
            print(f"STT (en): {text}")
        except sr.UnknownValueError:
            # 2. If English fails, try to recognize as Hindi
            print("Could not understand English, trying Hindi...")
            try:
                text = r.recognize_google(audio_data, language='hi-IN')
                lang = 'hi'
                print(f"STT (hi): {text}")
            except sr.UnknownValueError:
                print("Could not understand Hindi either.")
                raise HTTPException(status_code=400, detail="Could not understand audio in English or Hindi.")
        
        except sr.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Google Speech API error; {e}")

        # Return both the text and the detected language
        return {"text": text, "language": lang}

    except Exception as e:
        import traceback
        print("Error in STT:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))