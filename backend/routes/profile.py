from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
from models.schemas import LearningProfile
from services import gemini_service, db_service
import PyPDF2
import io

router = APIRouter(prefix="/api")


@router.post("/extract-resume")
async def extract_resume(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))

        pdf_text = ""
        for page in pdf_reader.pages:
            pdf_text += page.extract_text() or ""

        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        # Log what PyPDF2 actually extracted so we can debug
        print(f"=== PDF TEXT START ===")
        print(pdf_text[:2000])
        print(f"=== PDF TEXT END (total {len(pdf_text)} chars) ===")

        # Extract structured data using Gemini
        extracted = gemini_service.extract_resume(pdf_text)
        print(f"=== GEMINI EXTRACTED: {extracted} ===")

        # Save to MongoDB
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
