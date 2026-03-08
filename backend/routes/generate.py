import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from models.schemas import GenerateRequest
from services import gemini_service, db_service, youtube_service, elevenlabs_service

router = APIRouter(prefix="/api")


class GenerateWithProfileRequest(BaseModel):
    user_id: Optional[str] = None
    profile: Optional[dict] = None


@router.post("/generate")
async def generate(request: GenerateWithProfileRequest):
    try:
        profile = request.profile or {}

        # Try to get from DB if user_id provided and no profile sent
        if request.user_id and not profile:
            try:
                user = db_service.get_user(request.user_id)
                db_profile = db_service.get_learning_profile(request.user_id)
                if db_profile:
                    profile = db_profile
                if user:
                    profile["name"] = user.get("name", "")
                    profile["role"] = user.get("role", "")
                    profile["skills"] = user.get("skills", [])
                    profile["experience"] = user.get("experience", "")
                    profile["education"] = user.get("education", "")
            except Exception as db_err:
                print(f"DB read failed, using provided profile: {db_err}")

        if not profile.get("topic"):
            raise HTTPException(status_code=400, detail="No profile data available. Please provide profile or valid user_id.")

        # Generate diagnosis and learning plan
        diagnosis = gemini_service.diagnose_and_plan(profile)

        # Brief pause to avoid Gemini rate limits on free tier
        time.sleep(3)

        # Search for curated resources
        resources = gemini_service.search_resources(
            topic=profile.get("topic", ""),
            gap=diagnosis.get("gap", ""),
            subtopics=profile.get("subtopics", []),
            level=profile.get("currentLevel", "beginner")
        )

        # Search YouTube for relevant videos with timestamps
        youtube_results = []
        topic = profile.get("topic", "")
        gap = diagnosis.get("gap", "")
        if topic:
            try:
                videos = youtube_service.search_videos(f"{topic} {gap} tutorial")
                for video in videos[:2]:
                    video_id = video["video_id"]
                    timestamp = youtube_service.get_transcript_timestamp(video_id, gap or topic)
                    video["url"] = youtube_service.build_timestamp_url(video_id, timestamp)
                    video["timestamp"] = timestamp
                    youtube_results.append(video)
            except Exception as yt_err:
                print(f"YouTube search failed: {yt_err}")

        # Generate voice narration
        audio_url = None
        narration = diagnosis.get("voice_narration", "")
        if narration:
            try:
                audio_url = elevenlabs_service.text_to_speech(narration)
            except Exception as voice_err:
                print(f"Voice generation failed: {voice_err}")

        # Try to save session to database
        session_id = None
        try:
            session_data = {
                "user_id": request.user_id or "anonymous",
                "diagnosis": diagnosis,
                "resources": resources,
                "youtube_results": youtube_results,
                "audio_url": audio_url,
                "status": "active"
            }
            session_id = db_service.save_session(session_data)
        except Exception as db_err:
            print(f"Could not save session: {db_err}")

        return {
            "success": True,
            "session_id": session_id,
            "diagnosis": diagnosis,
            "resources": resources,
            "youtube_results": youtube_results,
            "audio_url": audio_url
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Generate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
