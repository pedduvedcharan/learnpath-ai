from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import LearningProfile
from services import gemini_service, db_service
import PyPDF2
import io

router = APIRouter(prefix="/api")


@router.post("/extract-resume")
async def extract_resume(file: UploadFile = File(...)):
    try:
        # Read PDF content
        contents = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))

        pdf_text = ""
        for page in pdf_reader.pages:
            pdf_text += page.extract_text() or ""

        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        # Extract structured data using Gemini
        extracted = gemini_service.extract_resume(pdf_text)

        # Save user to database
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


@router.post("/generate-questions")
async def generate_questions(profile: dict):
    try:
        questions = gemini_service.generate_questions(profile)
        return {
            "success": True,
            "questions": questions
        }
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
