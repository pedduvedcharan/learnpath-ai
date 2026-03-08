import os
import uuid
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
AUDIO_DIR = Path(__file__).parent.parent / "static" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


def text_to_speech(text: str, base_url: str = "") -> str:
    try:
        if not ELEVENLABS_API_KEY:
            print("ElevenLabs API key not configured")
            return None

        from elevenlabs import ElevenLabs

        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

        # Truncate long text to avoid API limits (max ~5000 chars for TTS)
        tts_text = text[:4500] if len(text) > 4500 else text

        audio_generator = client.text_to_speech.convert(
            voice_id="21m00Tcm4TlvDq8ikWAM",  # Rachel
            text=tts_text,
            model_id="eleven_monolingual_v1",
            output_format="mp3_44100_128",
        )

        # Collect audio bytes from generator
        audio_bytes = b""
        for chunk in audio_generator:
            audio_bytes += chunk

        if not audio_bytes:
            print("ElevenLabs returned empty audio")
            return None

        filename = f"{uuid.uuid4().hex}.mp3"
        filepath = AUDIO_DIR / filename
        with open(filepath, "wb") as f:
            f.write(audio_bytes)

        audio_path = f"/static/audio/{filename}"

        # Return full URL if base_url provided (for Cloud Run deployment)
        if base_url:
            return f"{base_url.rstrip('/')}{audio_path}"

        return audio_path
    except Exception as e:
        print(f"ElevenLabs error: {e}")
        return None
