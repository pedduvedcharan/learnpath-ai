from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class UserProfile(BaseModel):
    name: str
    role: str
    skills: List[str]
    experience: str
    education: str
    certifications: List[str]
    projects: List[str]


class LearningProfile(BaseModel):
    """Flexible learning profile that accepts any data from dynamic questions.
    The question types vary based on what Gemini generates, so we accept
    arbitrary nested data rather than rigid typed sub-models."""
    user_id: str
    topic: Optional[str] = ""
    subtopics: Optional[List[str]] = []
    priorities: Optional[List[str]] = []
    currentLevel: Optional[str] = ""
    selfAssessment: Optional[Dict[str, Any]] = {}
    learningHistory: Optional[Dict[str, Any]] = {}
    theWall: Optional[Dict[str, Any]] = {}
    behaviorFlags: Optional[List[str]] = []
    goal: Optional[Dict[str, Any]] = {}
    timeCommitment: Optional[Dict[str, Any]] = {}
    # Legacy fields for backward compatibility
    learningStyle: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"


class ChatMessage(BaseModel):
    user_id: str
    message: str
    is_voice: bool = False


class ReadinessRequest(BaseModel):
    user_id: str
    answers: List[str]


class GenerateRequest(BaseModel):
    user_id: str
