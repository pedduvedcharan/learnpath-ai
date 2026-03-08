from fastapi import APIRouter, HTTPException
from services import db_service
from datetime import datetime, timedelta

router = APIRouter(prefix="/api")


@router.get("/progress/{user_id}")
async def get_progress(user_id: str):
    try:
        # Get all sessions for the user
        all_sessions = db_service.get_sessions(user_id)

        if not all_sessions:
            return {
                "success": True,
                "xp": 0,
                "streak": 0,
                "completed_nodes": 0,
                "total_sessions": 0,
                "readiness_scores": [],
                "sessions": []
            }

        # Calculate XP (100 per session)
        xp = len(all_sessions) * 100

        # Calculate streak (consecutive days with sessions)
        session_dates = set()
        for s in all_sessions:
            created = s.get("created_at")
            if created:
                if isinstance(created, datetime):
                    session_dates.add(created.date())
                elif isinstance(created, str):
                    try:
                        session_dates.add(datetime.fromisoformat(created).date())
                    except (ValueError, TypeError):
                        pass

        streak = 0
        if session_dates:
            today = datetime.utcnow().date()
            current_date = today
            while current_date in session_dates:
                streak += 1
                current_date -= timedelta(days=1)

        # Count completed nodes from latest session
        completed_nodes = 0
        latest = all_sessions[0] if all_sessions else None
        if latest and "diagnosis" in latest:
            roadmap = latest["diagnosis"].get("roadmap", [])
            completed_nodes = sum(1 for node in roadmap if node.get("status") == "complete")

        # Collect readiness scores
        readiness_scores = []
        for s in all_sessions:
            score = s.get("readiness_score")
            if score is not None:
                readiness_scores.append({
                    "score": score,
                    "ready": s.get("readiness_ready", False),
                    "date": str(s.get("created_at", ""))
                })

        return {
            "success": True,
            "xp": xp,
            "streak": streak,
            "completed_nodes": completed_nodes,
            "total_sessions": len(all_sessions),
            "readiness_scores": readiness_scores,
            "sessions": [
                {
                    "id": s["_id"],
                    "topic": s.get("diagnosis", {}).get("gap", "Session"),
                    "date": str(s.get("created_at", "")),
                    "status": s.get("status", "active")
                }
                for s in all_sessions[:10]
            ]
        }
    except Exception as e:
        print(f"Progress error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
