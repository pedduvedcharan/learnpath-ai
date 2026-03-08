from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
from models.schemas import LearningProfile
from services import gemini_service, db_service
import PyPDF2
import io

router = APIRouter(prefix="/api")


@router.post("/extract-resume")
async def extract_resume(file: UploadFile = File(...), user_id: Optional[str] = Form(None)):
    try:
        contents = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))

        pdf_text = ""
        for page in pdf_reader.pages:
            pdf_text += page.extract_text() or ""

        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        print(f"=== PDF TEXT START ===")
        print(pdf_text[:2000])
        print(f"=== PDF TEXT END (total {len(pdf_text)} chars) ===")

        # Extract structured data using Gemini
        extracted = gemini_service.extract_resume(pdf_text)
        print(f"=== GEMINI EXTRACTED: {extracted} ===")

        # If user_id provided, update existing user. Otherwise create new.
        if user_id:
            db_service.update_user(user_id, extracted)
        else:
            user_id = db_service.save_user(extracted)

        return {
            "success": True,
            "user_id": user_id,
            "data": extracted
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}")
async def get_user(user_id: str):
    try:
        user = db_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"success": True, "data": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-profile")
async def save_profile(profile: LearningProfile):
    try:
        profile_data = profile.model_dump()
        profile_id = db_service.save_learning_profile(profile_data)
        return {
            "success": True,
            "profile_id": profile_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    try:
        profile = db_service.get_learning_profile(user_id)
        if not profile:
            return {"success": True, "data": None}
        return {"success": True, "data": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class GenerateQuestionsRequest(BaseModel):
    user_id: str


@router.post("/generate-questions")
async def generate_questions(request: GenerateQuestionsRequest):
    try:
        user = db_service.get_user(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        questions = gemini_service.generate_dynamic_questions(user)

        db_service.update_user(request.user_id, {"generated_questions": questions})

        return {"success": True, "questions": questions}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/questions/{user_id}")
async def get_questions(user_id: str):
    try:
        user = db_service.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        questions = user.get("generated_questions")
        if not questions:
            return {"success": True, "questions": None}
        return {"success": True, "questions": questions}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CreateUserRequest(BaseModel):
    user_id: Optional[str] = None
    name: Optional[str] = ""
    role: Optional[str] = ""
    skills: Optional[list] = []
    industry: Optional[str] = ""
    experience: Optional[int] = 0
    learningGoal: Optional[str] = ""
    hoursPerWeek: Optional[int] = 10


@router.post("/create-user")
async def create_user(request: CreateUserRequest):
    """Create or update a user from the details form."""
    try:
        user_data = request.model_dump(exclude={"user_id"})
        if request.user_id:
            # Update existing user
            db_service.update_user(request.user_id, user_data)
            return {"success": True, "user_id": request.user_id}
        else:
            user_id = db_service.save_user(user_data)
            return {"success": True, "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SaveNeedRequest(BaseModel):
    user_id: str
    need_type: str
    note: Optional[str] = ""


@router.post("/save-need")
async def save_need(request: SaveNeedRequest):
    try:
        db_service.update_user(request.user_id, {
            "need_type": request.need_type,
            "need_note": request.note
        })
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
