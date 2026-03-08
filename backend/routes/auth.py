from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services import db_service, email_service
import threading

router = APIRouter(prefix="/api/auth")


class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str


class LoginRequest(BaseModel):
    email: str
    phone: str


@router.post("/signup")
async def signup(request: SignupRequest):
    try:
        email = request.email.lower().strip()

        # Check if email already exists
        existing = db_service.find_user_by_email(email)
        if existing:
            raise HTTPException(status_code=409, detail="Account already exists with this email. Please login.")

        user_data = {
            "first_name": request.first_name.strip(),
            "last_name": request.last_name.strip(),
            "name": f"{request.first_name.strip()} {request.last_name.strip()}",
            "email": email,
            "phone": request.phone.strip(),
            "role": "",
            "skills": [],
        }

        user_id = db_service.save_user(user_data)

        # Send welcome email immediately (in background so signup is fast)
        threading.Thread(
            target=_send_welcome,
            args=(email, user_data["name"], user_id),
            daemon=True,
        ).start()

        return {
            "success": True,
            "user_id": user_id,
            "name": user_data["name"],
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _send_welcome(email, name, user_id):
    try:
        email_service.send_welcome_email(email, name, user_id)
        # Mark as sent
        from bson import ObjectId
        db_service.get_db()["users"].update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"emails_sent": "welcome"}},
        )
    except Exception as e:
        print(f"Welcome email error: {e}")


@router.post("/login")
async def login(request: LoginRequest):
    try:
        email = request.email.lower().strip()

        user = db_service.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="No account found with this email. Please sign up first.")

        # Verify phone
        if user.get("phone", "").strip() != request.phone.strip():
            raise HTTPException(status_code=401, detail="Phone number doesn't match. Please try again.")

        user_id = user["_id"]

        # Check completion status
        status = db_service.get_user_completion_status(user_id)

        return {
            "success": True,
            "user_id": user_id,
            "name": user.get("name", ""),
            "has_session": status["has_session"],
            "completion": status,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{user_id}")
async def get_status(user_id: str):
    try:
        user = db_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        status = db_service.get_user_completion_status(user_id)

        return {
            "success": True,
            "user_id": user_id,
            "name": user.get("name", ""),
            "has_session": status["has_session"],
            "completion": status,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
