from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from googletrans import Translator
import httpx  # 1. Import httpx for the timeout
import traceback  # 2. Import traceback for logging

router = APIRouter()

# 3. Initialize the translator with a 10-second timeout
translator = Translator(timeout=httpx.Timeout(10.0))

class TranslationRequest(BaseModel):
    text: str
    target: str
    source: str = 'auto'

class TranslationResponse(BaseModel):
    translatedText: str
    detectedLanguage: str

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    try:
        # --- First attempt (using 'auto') ---
        print(f"Translate attempt 1: src='{request.source}', text='{request.text}'")
        translation = translator.translate(
            request.text,
            dest=request.target,
            src=request.source
        )
        
        return TranslationResponse(
            translatedText=translation.text,
            detectedLanguage=translation.src
        )
    except Exception as e:
        # --- First attempt FAILED ---
        print(f"Translation (auto) failed: {e}")
        print(traceback.format_exc())
        
        # --- Second attempt (forcing 'hi') ---
        # This is our fallback for Hinglish text, which often fails 'auto' detection.
        if request.source == 'auto':
            try:
                print(f"Translate attempt 2: Forcing src='hi' for Hinglish fallback")
                translation = translator.translate(
                    request.text,
                    dest=request.target,
                    src='hi' # Force Hindi
                )
                
                # If this succeeds, we return 'hi' as the detected language
                return TranslationResponse(
                    translatedText=translation.text,
                    detectedLanguage='hi'
                )
            except Exception as e2:
                # If the fallback also fails, then we give up
                print(f"Translation (forced hi) also failed: {e2}")
                raise HTTPException(status_code=500, detail=f"Translation failed on fallback: {e2}")
        
        # If the source wasn't 'auto' and it failed, just fail.
        raise HTTPException(status_code=500, detail=f"Translation failed: {e}")