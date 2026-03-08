from fastapi import APIRouter, HTTPException, Request
from models.schemas import ChatMessage
from services import gemini_service, db_service, elevenlabs_service

router = APIRouter(prefix="/api")


@router.post("/chat")
async def chat(message: ChatMessage, request: Request):
    try:
        user_id = message.user_id
        text = message.message
        is_voice = message.is_voice

        profile = {}
        roadmap = []
        diagnosis = {}
        history = []

        # Only load from DB if we have a valid user_id
        if user_id and len(user_id) >= 12:
            try:
                # Get learning profile
                lp = db_service.get_learning_profile(user_id)
                if lp:
                    profile = lp

                # Get user data and merge
                user = db_service.get_user(user_id)
                if user:
                    profile["name"] = user.get("name", "Learner")
                    profile["role"] = user.get("role", "")
                    profile["skills"] = user.get("skills", [])

                # Get latest session for roadmap + diagnosis
                session = db_service.get_latest_session(user_id)
                if session and "diagnosis" in session:
                    diagnosis = session["diagnosis"]
                    roadmap = diagnosis.get("roadmap", [])

                # Get chat history
                history = db_service.get_chat_history(user_id)

                # Save user message
                db_service.save_chat_message(user_id, "user", text)
            except Exception as db_err:
                print(f"Chat DB error (non-fatal): {db_err}")

        # Generate AI response with whatever context we have
        response_text = gemini_service.chat_response(
            text, profile, roadmap, history, diagnosis
        )

        # Save AI response if we have a user
        if user_id and len(user_id) >= 12:
            try:
                db_service.save_chat_message(user_id, "assistant", response_text)
            except Exception:
                pass

        # Convert to speech if voice message
        audio_url = None
        if is_voice:
            forwarded_proto = request.headers.get("x-forwarded-proto", "")
            forwarded_host = request.headers.get("x-forwarded-host", "") or request.headers.get("host", "")
            if forwarded_proto and forwarded_host:
                base_url = f"{forwarded_proto}://{forwarded_host}"
            else:
                base_url = str(request.base_url).rstrip("/")
            audio_url = elevenlabs_service.text_to_speech(response_text, base_url)

        return {
            "success": True,
            "response": response_text,
            "audio_url": audio_url,
        }
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/voice-reply")
async def voice_reply(message: ChatMessage, request: Request):
    """Generate voice audio for the last AI response."""
    try:
        text = message.message

        forwarded_proto = request.headers.get("x-forwarded-proto", "")
        forwarded_host = request.headers.get("x-forwarded-host", "") or request.headers.get("host", "")
        if forwarded_proto and forwarded_host:
            base_url = f"{forwarded_proto}://{forwarded_host}"
        else:
            base_url = str(request.base_url).rstrip("/")
        audio_url = elevenlabs_service.text_to_speech(text, base_url)

        return {
            "success": True,
            "audio_url": audio_url,
        }
    except Exception as e:
        print(f"Voice reply error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
