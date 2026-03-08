from fastapi import APIRouter, HTTPException
from models.schemas import ChatMessage
from services import gemini_service, db_service, elevenlabs_service

router = APIRouter(prefix="/api")


@router.post("/chat")
async def chat(message: ChatMessage):
    try:
        user_id = message.user_id
        text = message.message
        is_voice = message.is_voice

        # Get learning profile
        profile = db_service.get_learning_profile(user_id)
        if not profile:
            profile = {}

        # Get user data and merge
        user = db_service.get_user(user_id)
        if user:
            profile["name"] = user.get("name", "Learner")
            profile["role"] = user.get("role", "")
            profile["skills"] = user.get("skills", [])

        # Get latest session for roadmap
        session = db_service.get_latest_session(user_id)
        roadmap = []
        if session and "diagnosis" in session:
            roadmap = session["diagnosis"].get("roadmap", [])

        # Get chat history
        history = db_service.get_chat_history(user_id)

        # Save user message
        db_service.save_chat_message(user_id, "user", text)

        # Generate AI response
        response_text = gemini_service.chat_response(text, profile, roadmap, history)

        # Save AI response
        db_service.save_chat_message(user_id, "assistant", response_text)

        # Convert to speech if voice message
        audio_url = None
        if is_voice:
            audio_url = elevenlabs_service.text_to_speech(response_text)

        return {
            "success": True,
            "response": response_text,
            "audio_url": audio_url
        }
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
