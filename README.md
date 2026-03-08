# LearnPath AI -- Your Personal AI Learning Coach

**HackAI 2026 | UT Dallas | Solo Project by Vedcharan Peddu**

---

## The Problem

When people want to learn new skills, they face a frustrating reality:

- **Information overload** -- thousands of tutorials, courses, and videos with no clear starting point
- **Wasted time** -- watching 45-minute videos when only 2 minutes are relevant to what you need
- **Generic advice** -- "just learn Python" doesn't help when you have a unique background and specific goals
- **No personalization** -- existing platforms ignore your resume, experience, and learning style
- **No accountability** -- without structure, gamification, or coaching, most people quit within a week

## What LearnPath AI Does

LearnPath AI is a full-stack AI-powered learning platform that builds a completely personalized learning roadmap based on who you are, what you know, and what you want to learn.

1. **Resume Upload & Auto-Profiling** -- Upload your resume (PDF) and Gemini AI extracts your skills, experience, education, and projects automatically. No forms to fill out.
2. **Smart Diagnostic Questions** -- AI generates targeted questions based on your profile to understand your exact skill level and learning goals.
3. **Gap Diagnosis** -- Compares where you are vs. where you want to be and identifies the precise knowledge gaps to fill.
4. **Visual Learning Roadmap** -- Interactive node-based roadmap (React Flow) showing your personalized learning path with phases, modules, and dependencies.
5. **Multi-Platform Resources with Timestamps** -- For each topic, find curated resources from YouTube, official docs, Medium, GitHub, and Dev.to -- with exact video timestamps so you jump to the relevant section.
6. **AI Voice Coach** -- ElevenLabs-powered voice narration that reads your roadmap aloud, explains concepts, and acts as a personal tutor.
7. **AI Chat Mentor** -- Conversational AI assistant that answers questions about your roadmap, explains concepts, and provides guidance in real time.
8. **Gamification System** -- XP points, level progression, streaks, daily missions, and achievements to keep you motivated and consistent.
9. **Progress Tracking** -- Track completion across modules, monitor your learning streaks, and visualize your growth over time.

## Tech Stack

| Layer | Technology |
|----------|---------------------------------------------|
| Frontend | React, Tailwind CSS, Framer Motion, React Flow |
| Backend | Python FastAPI |
| Database | MongoDB Atlas |
| AI | Google Gemini 2.0 Flash + Pro |
| Voice | ElevenLabs API |
| Video | YouTube Data API v3 + youtube-transcript-api |
| Search | Gemini Google Search Grounding |
| Speech | Web Speech API (browser-native) |
| Deploy | Google Cloud Build + Cloud Run |

## User Journey

1. **Welcome Screen** -- Land on the homepage, see what LearnPath AI offers, and get started.
2. **Profile Setup** -- Upload your resume or manually enter your background. AI extracts your skills and experience, then asks smart follow-up questions to understand your goals.
3. **Roadmap Generation** -- AI analyzes your gaps and generates a personalized, phase-by-phase learning roadmap with curated resources and timestamps.
4. **Interactive Roadmap View** -- Explore your roadmap as a visual node graph. Click any topic to see resources, watch videos at exact timestamps, and mark modules complete.
5. **AI Chat & Voice Coach** -- Ask questions, get explanations, and listen to voice-narrated guidance from your AI mentor.
6. **Progress & Gamification** -- Earn XP, maintain streaks, complete daily missions, level up, and track your learning journey over time.

## How to Run Locally

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB Atlas account
- API keys for: Google Gemini, YouTube Data API, ElevenLabs

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
MONGODB_URI=your_mongodb_connection_string
```

Start the server:

```bash
uvicorn main:app --reload
```

The backend runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

## API Endpoints

| Method | Path | Description |
|--------|----------------------|------------------------------------------------|
| GET | `/` | Health check -- confirms backend is running |
| POST | `/extract-resume` | Upload a PDF resume and extract skills/profile via Gemini AI |
| POST | `/generate-questions` | Generate smart diagnostic questions based on user profile |
| POST | `/save-profile` | Save the completed user profile to MongoDB |
| POST | `/readiness` | Assess skill readiness and identify knowledge gaps |
| POST | `/generate` | Generate a personalized learning roadmap with resources |
| POST | `/chat` | Send a message to the AI chat mentor and get a response |
| GET | `/progress/{user_id}` | Retrieve learning progress, XP, streaks, and stats |

## Deployment

This project is configured for Google Cloud Build and Cloud Run.

```bash
# Submit a build from the project root
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_GEMINI_API_KEY="...",_YOUTUBE_API_KEY="...",_ELEVENLABS_API_KEY="...",_MONGODB_URI="..."
```

Cloud Build will:
1. Build Docker images for both frontend and backend
2. Push images to Google Container Registry
3. Deploy both services to Cloud Run in `us-central1`

## Hackathon Tracks

- **Dallas AI Sponsor Track** (primary)
- **NRVE Sponsor Track** (gamified learning)
- **MLH Best Use of Gemini API**
- **MLH Best Use of ElevenLabs**
- **MLH Best Use of MongoDB Atlas**
- **Best Solo Project**
- **Data Science/ML Mini Track**
- **General Track**

## What Makes This Different

1. **Resume to auto-profile** -- Upload once, and AI understands your entire background. Zero manual forms.
2. **YouTube exact timestamps** -- Don't watch a 40-minute video. Jump to the 2-minute segment that matters.
3. **5 resource platforms with specific sections** -- YouTube, official docs, Medium, GitHub, and Dev.to, each with targeted links and relevant sections.
4. **Personalized reasoning** -- Every resource recommendation explains WHY it's relevant to YOUR specific background and goals.
5. **Voice coach narration** -- ElevenLabs-powered AI reads your roadmap and explains concepts out loud, like a personal tutor.
6. **Gemini Search grounding** -- Live web search ensures resources are current and not hallucinated.
7. **XP, streaks, and daily missions** -- Gamification mechanics borrowed from the best learning apps to keep you consistent.
8. **Full voice conversation** -- Talk to your AI mentor using browser-native speech recognition and get spoken responses back.

## Architecture

```
User
  |
  v
React Frontend (Tailwind CSS + Framer Motion + React Flow)
  |
  v
FastAPI Backend (Python)
  |
  +---> Google Gemini AI (profile extraction, gap analysis, roadmap generation, chat)
  +---> YouTube Data API v3 + Transcript API (video resources with timestamps)
  +---> ElevenLabs API (voice narration and coaching)
  +---> MongoDB Atlas (user profiles, progress, learning data)
```

**Data Flow:** User uploads resume or enters profile --> React frontend sends data to FastAPI --> Gemini AI processes and generates personalized roadmap --> YouTube API finds relevant videos with timestamps --> ElevenLabs generates voice coaching --> MongoDB stores progress --> User explores interactive roadmap with AI chat support.

---

Built with dedication for HackAI 2026 at UT Dallas.
