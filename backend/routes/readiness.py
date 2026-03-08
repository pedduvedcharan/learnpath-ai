from fastapi import APIRouter, HTTPException
from models.schemas import ReadinessRequest
from services import gemini_service, db_service

router = APIRouter(prefix="/api")


@router.post("/readiness")
async def check_readiness(request: ReadinessRequest):
    try:
        user_id = request.user_id
        answers = request.answers

        # Get latest session to retrieve questions
        session = db_service.get_latest_session(user_id)
        if not session:
            raise HTTPException(status_code=404, detail="No active session found")

        # Get learning profile for topic context
        profile = db_service.get_learning_profile(user_id)
        topic = profile.get("topic", "") if profile else ""

        # Get questions from session or generate context
        questions = session.get("questions", [])

        # Score readiness using Gemini
        result = gemini_service.score_readiness(questions, answers, topic)

        # Update session with readiness results
        db_service.update_session(session["_id"], {
            "readiness_score": result.get("score", 0),
            "readiness_ready": result.get("ready", False),
            "readiness_feedback": result.get("feedback", ""),
            "readiness_answers": answers
        })

        return {
            "success": True,
            "score": result.get("score", 0),
            "ready": result.get("ready", False),
            "feedback": result.get("feedback", "")
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Readiness error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
