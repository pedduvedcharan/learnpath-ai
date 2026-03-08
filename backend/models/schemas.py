from pydantic import BaseModel
from typing import List, Optional


class UserProfile(BaseModel):
    name: str
    role: str
    skills: List[str]
    experience: str
    education: str
    certifications: List[str]
    projects: List[str]


class SelfAssessment(BaseModel):
    theory: int
    practical: int
    debugging: int
    docs: int
    teaching: int


class LearningHistory(BaseModel):
    triedResources: List[str] = []
    completionLevel: str = ""
    stopReasons: List[str] = []


class TheWall(BaseModel):
    trying: str = ""
    notWorking: str = ""
    alreadyTried: str = ""
    quickTags: List[str] = []


class LearningStyleData(BaseModel):
    primary: str
    environment: List[str] = []
    studyTime: str = ""


class GoalData(BaseModel):
    type: str
    deadline: str = ""
    hoursPerWeek: int = 10
    totalHours: int = 0
    targetRole: str = ""
    projectDescription: str = ""


class ContextData(BaseModel):
    professionalBackground: str = ""
    industry: str = ""
    preferredLanguage: str = "English"
    additionalContext: str = ""


class LearningProfile(BaseModel):
    user_id: str
    topic: str
    subtopics: List[str] = []
    currentLevel: str
    selfAssessment: Optional[SelfAssessment] = None
    learningHistory: Optional[LearningHistory] = None
    theWall: Optional[TheWall] = None
    learningStyle: Optional[LearningStyleData] = None
    goal: Optional[GoalData] = None
    context: Optional[ContextData] = None


class ChatMessage(BaseModel):
    user_id: str
    message: str
    is_voice: bool = False


class ReadinessRequest(BaseModel):
    user_id: str
    answers: List[str]


class GenerateRequest(BaseModel):
    user_id: str
