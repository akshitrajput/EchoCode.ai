from fastapi import APIRouter, UploadFile, File, HTTPException
import speech_recognition as sr
import io
import traceback

router = APIRouter()

# --- 1. Define your 25 supported languages in one list ---
SUPPORTED_LANGUAGES = [
    # 15 Indian Languages
    'en-IN', # English (India)
    'hi-IN', # Hindi
    'ta-IN', # Tamil
    'te-IN', # Telugu
    'mr-IN', # Marathi
    'gu-IN', # Gujarati
    'bn-IN', # Bengali
    'kn-IN', # Kannada
    'ml-IN', # Malayalam
    'pa-IN', # Punjabi
    'ur-IN', # Urdu
    'or-IN', # Odia
    'sa-IN', # Sanskrit
    'ne-NP', # Nepali (Commonly spoken in India)
    'bho-IN',# Bhojpuri
    
    # 10 World Languages
    'es-ES', # Spanish
    'fr-FR', # French
    'de-DE', # German
    'ja-JP', # Japanese
    'zh-CN', # Chinese (Mandarin, Simplified)
    'ru-RU', # Russian
    'pt-BR', # Portuguese (Brazil)
    'ar-SA', # Arabic (Saudi Arabia)
    'ko-KR', # Korean
    'it-IT', # Italian
]

@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    try:
        audio_bytes = await audio.read()
        audio_stream = io.BytesIO(audio_bytes)
        
        r = sr.Recognizer()
        with sr.AudioFile(audio_stream) as source:
            audio_data = r.record(source) # read the entire audio file

        # --- 2. Loop through the list ---
        for lang_code in SUPPORTED_LANGUAGES:
            try:
                # Try to recognize with the current language
                text = r.recognize_google(audio_data, language=lang_code)
                
                # Success! Get the simple lang code (e.g., 'ta-IN' -> 'ta')
                lang = lang_code.split('-')[0] 
                
                print(f"STT success ({lang}): {text}")
                return {"text": text, "language": lang}
            
            except sr.UnknownValueError:
                # This is OK. It just means the audio wasn't this language.
                # The loop will continue and try the next one.
                print(f"Audio was not recognized as {lang_code}.")
                continue 
            
            except sr.RequestError as e:
                # This is a real API error (e.g., network issue)
                raise HTTPException(status_code=500, detail=f"Google Speech API error; {e}")
        
        # --- 3. If the loop finishes, no language was recognized ---
        raise HTTPException(status_code=400, detail="Could not understand audio in any supported language.")

    except Exception as e:
        print("Error in STT:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))