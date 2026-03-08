import os
import json
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def _call_gemini(prompt: str, max_retries: int = 3) -> str:
    """Call Gemini with retry logic for rate limits."""
    model = genai.GenerativeModel("gemini-2.5-flash")
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower() or "rate" in str(e).lower():
                wait = (attempt + 1) * 5
                print(f"Gemini rate limited, waiting {wait}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait)
            else:
                raise
    raise Exception("Gemini rate limit exceeded after retries")


def _clean_json_response(text: str) -> str:
    """Strip markdown code fences from Gemini responses."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def extract_resume(pdf_text: str) -> dict:
    try:
        prompt = f"""Extract the following information from this resume text and return ONLY valid JSON with these keys:
- name (string)
- role (string - current or most recent job title)
- skills (array of strings)
- experience (string - summary of work experience)
- education (string - highest education)
- certifications (array of strings)
- projects (array of strings - project names/descriptions)

Resume text:
{pdf_text}

Return ONLY valid JSON, no markdown, no backticks, no explanation."""

        text = _call_gemini(prompt)
        cleaned = _clean_json_response(text)
        return json.loads(cleaned)
    except Exception as e:
        print(f"Resume extraction error: {e}")
        return {
            "name": "",
            "role": "",
            "skills": [],
            "experience": "",
            "education": "",
            "certifications": [],
            "projects": []
        }


def generate_questions(profile: dict) -> list:
    try:
        topic = profile.get("topic", "")
        level = profile.get("currentLevel", "beginner")
        background = profile.get("professionalBackground", "")
        skills = profile.get("skills", [])

        prompt = f"""You are a learning assessment expert. Generate 4 smart personalized multiple-choice questions to assess someone's readiness for learning {topic}.

Their current level: {level}
Their background: {background}
Their skills: {', '.join(skills) if skills else 'Not specified'}

Each question should test a different aspect: theory, practical application, problem-solving, and conceptual understanding.

Return ONLY this JSON array (no markdown, no backticks):
[
  {{
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }},
  {{
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1
  }},
  {{
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 2
  }},
  {{
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }}
]"""

        text = _call_gemini(prompt)
        cleaned = _clean_json_response(text)
        return json.loads(cleaned)
    except Exception as e:
        print(f"Question generation error: {e}")
        return []


def diagnose_and_plan(profile: dict) -> dict:
    try:
        # Extract all profile fields safely
        name = profile.get("name", "Learner")
        role = profile.get("role", "")
        skills = profile.get("skills", [])
        topic = profile.get("topic", "")
        subtopics = profile.get("subtopics", [])
        current_level = profile.get("currentLevel", "beginner")

        # Self assessment
        sa = profile.get("selfAssessment", {}) or {}
        theory = sa.get("theory", 5)
        practical = sa.get("practical", 5)
        debugging = sa.get("debugging", 5)
        docs = sa.get("docs", 5)
        teaching = sa.get("teaching", 5)

        # Learning history
        lh = profile.get("learningHistory", {}) or {}
        tried_resources = lh.get("triedResources", [])
        completion_level = lh.get("completionLevel", "")
        stop_reasons = lh.get("stopReasons", [])

        # The wall
        tw = profile.get("theWall", {}) or {}
        trying = tw.get("trying", "")
        not_working = tw.get("notWorking", "")
        already_tried = tw.get("alreadyTried", "")

        # Learning style
        ls = profile.get("learningStyle", {}) or {}
        primary_style = ls.get("primary", "")
        environment = ls.get("environment", [])
        study_time = ls.get("studyTime", "")

        # Goal
        goal = profile.get("goal", {}) or {}
        goal_type = goal.get("type", "")
        deadline = goal.get("deadline", "")
        hours_per_week = goal.get("hoursPerWeek", 10)

        # Context
        ctx = profile.get("context", {}) or {}
        professional_background = ctx.get("professionalBackground", "")
        industry = ctx.get("industry", "")
        additional_context = ctx.get("additionalContext", "")

        prompt = f"""You are an expert learning coach AI. Analyze this learner deeply.

Learner Profile:
Name: {name}
Role: {role}
Skills: {', '.join(skills) if skills else 'Not specified'}
Topic: {topic}
Subtopics: {', '.join(subtopics) if subtopics else 'Not specified'}
Current Level: {current_level}
Self Assessment: Theory {theory}/10, Practical {practical}/10, Debugging {debugging}/10, Docs {docs}/10, Teaching {teaching}/10
Learning History: Tried {', '.join(tried_resources) if tried_resources else 'nothing yet'}, got to {completion_level or 'N/A'}, stopped because {', '.join(stop_reasons) if stop_reasons else 'N/A'}
The Wall: Trying to {trying or 'N/A'}, not working because {not_working or 'N/A'}, already tried {already_tried or 'N/A'}
Learning Style: {primary_style or 'Not specified'}, prefers {', '.join(environment) if environment else 'Not specified'}, studies at {study_time or 'Not specified'}
Goal: {goal_type or 'Not specified'} by {deadline or 'No deadline'}, {hours_per_week} hrs/week
Background: {professional_background or 'Not specified'} in {industry or 'Not specified'}
Additional: {additional_context or 'None'}

Return ONLY this JSON (no markdown, no backticks):
{{
  "gap": "exact knowledge gap identified",
  "why_blocking": "why this specific gap is blocking them",
  "fix_time": "estimated time to fix (e.g. 2-3 weeks)",
  "what_you_know": ["skill1 they already have", "skill2", "skill3"],
  "roadmap": [
    {{"node": "Step 1 name", "status": "complete", "description": "what this covers"}},
    {{"node": "Step 2 name", "status": "complete", "description": "what this covers"}},
    {{"node": "Step 3 name", "status": "current", "description": "what this covers"}},
    {{"node": "Step 4 name", "status": "locked", "description": "what this covers"}},
    {{"node": "Step 5 name", "status": "locked", "description": "what this covers"}}
  ],
  "key_concepts": ["concept1", "concept2", "concept3"],
  "challenge": "A custom practice challenge tailored to their specific background and profession",
  "challenge_time": "estimated time (e.g. 45 mins)",
  "voice_narration": "A warm, mentor-style paragraph greeting them by name and summarizing the diagnosis and plan. Speak as Coach Sarah."
}}"""

        text = _call_gemini(prompt)
        cleaned = _clean_json_response(text)
        return json.loads(cleaned)
    except Exception as e:
        print(f"Diagnose and plan error: {e}")
        return {
            "gap": "Unable to analyze at this time",
            "why_blocking": "",
            "fix_time": "Unknown",
            "what_you_know": [],
            "roadmap": [],
            "key_concepts": [],
            "challenge": "",
            "challenge_time": "",
            "voice_narration": ""
        }


def search_resources(topic: str, gap: str, subtopics: list, level: str) -> list:
    try:
        prompt = f"""Find the best learning resources for someone learning {topic} (subtopics: {', '.join(subtopics) if subtopics else 'general'}) at {level} level who has this gap: {gap}.

Return ONLY this JSON array (no markdown):
[
  {{"platform": "YouTube", "title": "video title", "url": "https://youtube.com/watch?v=...", "specific_section": "Start at 4:32 - topic name", "why_it_fits": "reason this fits this specific learner"}},
  {{"platform": "Coursera", "title": "course title", "url": "https://coursera.org/...", "specific_section": "Week 3, Module 2", "why_it_fits": "reason"}},
  {{"platform": "GitHub", "title": "repo name", "url": "https://github.com/...", "specific_section": "specific folder or file", "why_it_fits": "reason"}},
  {{"platform": "Medium", "title": "article title", "url": "https://medium.com/...", "specific_section": "key section", "why_it_fits": "reason"}},
  {{"platform": "LinkedIn Learning", "title": "course title", "url": "https://linkedin.com/learning/...", "specific_section": "Chapter 5", "why_it_fits": "reason"}}
]"""

        text = _call_gemini(prompt)
        cleaned = _clean_json_response(text)
        return json.loads(cleaned)
    except Exception as e:
        print(f"Resource search error: {e}")
        return []


def score_readiness(questions: list, answers: list, topic: str) -> dict:
    try:
        qa_text = ""
        for i, q in enumerate(questions):
            answer = answers[i] if i < len(answers) else "No answer"
            qa_text += f"\nQ{i+1}: {q.get('question', '')}\nAnswer: {answer}\n"

        prompt = f"""You are assessing a learner's readiness for {topic}.

Here are their answers to assessment questions:
{qa_text}

Score their readiness from 0-100 and provide feedback.

Return ONLY this JSON (no markdown, no backticks):
{{
  "score": 75,
  "ready": true,
  "feedback": "Detailed feedback about their readiness level and what they should focus on."
}}

Set "ready" to true if score >= 60."""

        text = _call_gemini(prompt)
        cleaned = _clean_json_response(text)
        return json.loads(cleaned)
    except Exception as e:
        print(f"Readiness scoring error: {e}")
        return {"score": 0, "ready": False, "feedback": "Unable to score at this time."}


def chat_response(message: str, profile: dict, roadmap: list, history: list) -> str:
    try:
        # Build history context
        history_text = ""
        for msg in history[-10:]:  # Last 10 messages
            role = msg.get("role", "user")
            text = msg.get("text", "")
            history_text += f"{role}: {text}\n"

        # Build roadmap context
        roadmap_text = ""
        for step in roadmap:
            roadmap_text += f"- {step.get('node', '')}: {step.get('status', '')} - {step.get('description', '')}\n"

        name = profile.get("name", "Learner")
        topic = profile.get("topic", "")
        level = profile.get("currentLevel", "")

        prompt = f"""You are Coach Sarah, an expert AI learning mentor. You are helping {name} learn {topic} at {level} level.

Their learning roadmap:
{roadmap_text}

Recent conversation:
{history_text}

User's message: {message}

Respond helpfully as Coach Sarah. Be warm, encouraging, and specific. Keep responses concise but informative. If they ask about their roadmap, reference the specific steps. If they're stuck, provide practical advice."""

        return _call_gemini(prompt)
    except Exception as e:
        print(f"Chat response error: {e}")
        return "I'm having trouble responding right now. Please try again in a moment."
