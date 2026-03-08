from fastapi import APIRouter, HTTPException
from models.schemas import GenerateRequest
from services import gemini_service, db_service, youtube_service, elevenlabs_service

router = APIRouter(prefix="/api")


@router.post("/generate")
async def generate(request: GenerateRequest):
    try:
        user_id = request.user_id

        # Get user and learning profile from database
        user = db_service.get_user(user_id)
        profile = db_service.get_learning_profile(user_id)

        if not profile:
            raise HTTPException(status_code=404, detail="Learning profile not found")

        # Merge user data into profile for complete context
        if user:
            profile["name"] = user.get("name", "")
            profile["role"] = user.get("role", "")
            profile["skills"] = user.get("skills", [])
            profile["experience"] = user.get("experience", "")
            profile["education"] = user.get("education", "")
            profile["certifications"] = user.get("certifications", [])
            profile["projects"] = user.get("projects", [])

        # Generate diagnosis and learning plan
        diagnosis = gemini_service.diagnose_and_plan(profile)

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
            videos = youtube_service.search_videos(f"{topic} {gap} tutorial")
            for video in videos[:2]:
                video_id = video["video_id"]
                timestamp = youtube_service.get_transcript_timestamp(video_id, gap or topic)
                video["url"] = youtube_service.build_timestamp_url(video_id, timestamp)
                video["timestamp"] = timestamp
                youtube_results.append(video)

        # Generate voice narration
        audio_url = None
        narration = diagnosis.get("voice_narration", "")
        if narration:
            audio_url = elevenlabs_service.text_to_speech(narration)

        # Save session to database
        session_data = {
            "user_id": user_id,
            "diagnosis": diagnosis,
            "resources": resources,
            "youtube_results": youtube_results,
            "audio_url": audio_url,
            "status": "active"
        }
        session_id = db_service.save_session(session_data)

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
