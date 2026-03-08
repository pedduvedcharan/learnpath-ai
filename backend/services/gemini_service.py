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
        prompt = f"""You are a precise resume parser. Extract ONLY what is explicitly written in the resume text below. Do NOT invent, guess, or hallucinate any information.

Rules:
- "role": Use their PRIMARY professional identity based on their degree or main career field, NOT a part-time/campus job
- "skills": Extract ONLY hard/technical skills (programming languages, tools, frameworks, technologies, platforms, methodologies). IGNORE soft skills like "communication", "teamwork", "leadership", "dependable", "punctual", "organized", "detail-oriented", "time management", "customer service", "self-motivated", "responsible", "reliable", etc. If the resume only has soft skills, return an empty array.
- "experience": Summarize ALL work experience mentioned, including job titles, companies, and durations
- "education": Full degree name, university, and expected graduation if mentioned
- "certifications": Only if explicitly listed. Return empty array [] if none found.
- "projects": Only project names/descriptions explicitly mentioned. Return empty array [] if none found.

Return ONLY valid JSON with these exact keys:
{{
  "name": "Full Name",
  "role": "Primary professional identity based on degree/career",
  "skills": ["only_technical_skills"],
  "experience": "Summary of all work experience",
  "education": "Degree, University, Graduation year",
  "certifications": [],
  "projects": []
}}

Resume text:
{pdf_text}

Return ONLY the JSON object. No markdown, no backticks, no explanation."""

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


def _get_fallback_questions() -> dict:
    """Return a universal fallback question set if Gemini fails."""
    return {
        "q1": {
            "question": "What do you want to master?",
            "subtitle": "Pick the area you're focusing on right now",
            "type": "single_select_grid",
            "options": [
                {"label": "Programming", "icon": "💻"}, {"label": "Data Science", "icon": "📊"},
                {"label": "Design", "icon": "🎨"}, {"label": "Marketing", "icon": "📣"},
                {"label": "Finance", "icon": "💰"}, {"label": "Management", "icon": "📋"},
                {"label": "Writing", "icon": "✍️"}, {"label": "Healthcare", "icon": "🏥"},
                {"label": "Engineering", "icon": "⚙️"}, {"label": "Communication", "icon": "🗣️"}
            ]
        },
        "q2": {
            "question": "Which specific areas interest you?",
            "subtitle": "Select all that apply (up to 4)",
            "type": "multi_select_chips",
            "subtopicMap": {
                "Programming": ["Web Development", "Mobile Apps", "Backend", "DevOps"],
                "Data Science": ["Machine Learning", "Analytics", "Visualization", "Statistics"],
                "Design": ["UI/UX", "Graphic Design", "Product Design", "Branding"],
                "Marketing": ["Digital Marketing", "SEO", "Content Strategy", "Social Media"],
                "Finance": ["Accounting", "Investment", "Financial Planning", "Risk Management"],
                "Management": ["Project Management", "Leadership", "Strategy", "Operations"],
                "Writing": ["Technical Writing", "Creative Writing", "Copywriting", "Journalism"],
                "Healthcare": ["Clinical Skills", "Research", "Public Health", "Administration"],
                "Engineering": ["Mechanical", "Electrical", "Civil", "Chemical"],
                "Communication": ["Public Speaking", "Negotiation", "Presentation", "Networking"]
            }
        },
        "q3": {
            "question": "Rank what matters most to you right now",
            "subtitle": "Drag or tap to reorder — #1 is top priority",
            "type": "ranked_priority",
            "items": [
                {"icon": "🎯", "label": "Deep understanding of fundamentals"},
                {"icon": "🛠️", "label": "Hands-on project skills"},
                {"icon": "💼", "label": "Job-ready portfolio"},
                {"icon": "📜", "label": "Certifications & credentials"},
                {"icon": "🚀", "label": "Speed — learn as fast as possible"},
                {"icon": "🤝", "label": "Networking & community"}
            ]
        },
        "q4": {
            "question": "What is your current level?",
            "subtitle": "This directly affects your recommendations",
            "type": "level_cards",
            "options": [
                {"icon": "🌱", "label": "Complete Beginner", "description": "Just starting out, no prior experience"},
                {"icon": "📖", "label": "Novice", "description": "Know the basics but need guidance"},
                {"icon": "🔧", "label": "Intermediate", "description": "Can work independently on simple tasks"},
                {"icon": "🚀", "label": "Advanced", "description": "Comfortable with complex problems"},
                {"icon": "🏆", "label": "Expert", "description": "Could teach others and lead projects"}
            ]
        },
        "q5": {
            "question": "Rate yourself honestly on these dimensions",
            "subtitle": "1 = barely know it, 10 = could teach it",
            "type": "multi_slider_panel",
            "dimensions": [
                {"key": "theory", "label": "Theoretical Knowledge", "description": "Understanding of core concepts"},
                {"key": "practical", "label": "Practical Application", "description": "Hands-on experience"},
                {"key": "problem_solving", "label": "Problem Solving", "description": "Ability to tackle new challenges"},
                {"key": "tools", "label": "Tools & Technology", "description": "Familiarity with industry tools"},
                {"key": "communication", "label": "Domain Communication", "description": "Can explain concepts to others"}
            ]
        },
        "q6": {
            "question": "What have you already tried to learn this?",
            "subtitle": "Prevents us from recommending what didn't work",
            "type": "conditional_checklist",
            "resources": ["YouTube tutorials", "Online courses", "Books", "Bootcamp", "Official docs", "Mentorship", "Personal projects", "Work experience", "College courses", "Starting fresh"],
            "completionOptions": ["Just started, lost motivation quickly", "Got halfway through but stopped", "Finished but didn't retain much", "Completed and applied it"],
            "stopReasons": ["Too boring", "Too hard", "Too slow", "Not practical enough", "Life got busy", "Couldn't find good resources", "Didn't know what to build"]
        },
        "q7": {
            "question": "Tell me exactly where you're stuck",
            "subtitle": "The more specific you are, the better your roadmap",
            "type": "three_textarea_structured",
            "placeholders": {"trying": "e.g., Learning a new skill for career growth", "notWorking": "e.g., Can't retain information or apply it", "alreadyTried": "e.g., Watched videos, read articles"},
            "quickTags": ["Overwhelmed", "No direction", "Theory vs practice gap", "Time management", "Motivation"]
        },
        "q8": {
            "question": "Which of these describe you?",
            "subtitle": "Toggle all that apply — this shapes your learning plan",
            "type": "binary_toggle_list",
            "toggles": [
                "I need deadlines or I don't finish",
                "I learn better with a project to work toward",
                "I give up when I can't find good resources",
                "I've tried before and quit more than once",
                "I prefer short bursts over long study sessions",
                "I learn best by watching, not reading",
                "I need someone to hold me accountable",
                "I'd rather build something ugly that works than study theory",
                "I lose focus easily without variety",
                "I learn fastest when I can teach someone else"
            ]
        },
        "q9": {
            "question": "What's your end goal?",
            "subtitle": "Your goal unlocks follow-up details",
            "type": "card_plus_conditional_input",
            "goals": [
                {"icon": "💼", "label": "Get a new job", "followUp": {"type": "text", "placeholder": "Target role? e.g., Senior ML Engineer at FAANG"}},
                {"icon": "📈", "label": "Get promoted", "followUp": {"type": "text", "placeholder": "What role are you aiming for?"}},
                {"icon": "🔄", "label": "Switch careers", "followUp": {"type": "text", "placeholder": "What field are you switching to?"}},
                {"icon": "🧠", "label": "Personal growth", "followUp": null},
                {"icon": "🏗️", "label": "Build a project", "followUp": {"type": "textarea", "placeholder": "Describe your project idea..."}},
                {"icon": "📜", "label": "Get certified", "followUp": {"type": "text", "placeholder": "Which certification?"}}
            ]
        },
        "q10": {
            "question": "How much time can you commit?",
            "subtitle": "We'll calculate if it's enough for your goal",
            "type": "smart_slider_with_calculator",
            "hoursRange": [1, 40],
            "deadlineOptions": ["1 week", "2 weeks", "1 month", "2 months", "3 months", "6 months", "1 year"],
            "deadlineWeeksMap": {"1 week": 1, "2 weeks": 2, "1 month": 4, "2 months": 9, "3 months": 13, "6 months": 26, "1 year": 52}
        }
    }


def generate_dynamic_questions(resume_data: dict) -> dict:
    """Generate 10 personalized onboarding questions from resume data using Gemini.

    Uses 10 high-signal question types designed to extract maximum useful data
    in minimum time. Each type is chosen for its signal-to-effort ratio.
    """
    name = resume_data.get("name", "")
    role = resume_data.get("role", "")
    skills = resume_data.get("skills", [])
    if isinstance(skills, list):
        skills = ", ".join(skills)
    experience = resume_data.get("experience", "")
    education = resume_data.get("education", "")
    projects = resume_data.get("projects", [])
    if isinstance(projects, list):
        projects = ", ".join(projects) if projects else "None listed"

    prompt = f"""You are an expert learning coach and assessment designer.

Here is a person's resume data:
Name: {name}
Role: {role}
Skills: {skills}
Experience: {experience}
Education: {education}
Projects: {projects}

Based on EVERYTHING in their resume, generate 10 personalized onboarding questions.
Every option, label, dimension, toggle, and placeholder MUST be tailored to their actual field.
If they are in healthcare, ask about healthcare. If in tech, ask about tech. NEVER show irrelevant topics.

QUESTION TYPE REFERENCE (use EXACTLY these types):
- single_select_grid: ONE answer from many pills
- multi_select_chips: multiple chips, toggle on/off
- ranked_priority: drag/click to reorder by importance (extracts weighted priorities)
- level_cards: 5-level spectrum cards
- multi_slider_panel: N sliders on one card, 1-10 each (most data-dense)
- conditional_checklist: checkboxes with follow-up that appears based on selection
- three_textarea_structured: 3 labeled text boxes + quick-tag chips (highest signal)
- binary_toggle_list: yes/no toggles (fast, high signal)
- card_plus_conditional_input: pick a card, unlock a specific text field
- smart_slider_with_calculator: slider(s) + live calculated feedback

Return ONLY valid JSON (no markdown, no backticks):
{{
  "q1": {{
    "question": "What do you want to master?",
    "subtitle": "Pick the area you're focusing on right now",
    "type": "single_select_grid",
    "options": [{{"label": "string", "icon": "emoji"}}, ...] (10-16 options relevant to their field)
  }},
  "q2": {{
    "question": "Which specific areas interest you?",
    "subtitle": "Select all that apply (up to 4)",
    "type": "multi_select_chips",
    "subtopicMap": {{"q1_option_label": ["subtopic1", "subtopic2", ...], ...}} (subtopics for EVERY q1 option)
  }},
  "q3": {{
    "question": "Rank what matters most to you right now",
    "subtitle": "Drag or tap to reorder — #1 is top priority",
    "type": "ranked_priority",
    "items": [{{"icon": "emoji", "label": "string"}}, ...] (6 priorities relevant to their field/career stage)
  }},
  "q4": {{
    "question": "What is your current level?",
    "subtitle": "This directly affects your recommendations",
    "type": "level_cards",
    "options": [{{"icon": "emoji", "label": "string", "description": "string relevant to their field"}}, ...] (5 levels beginner to expert)
  }},
  "q5": {{
    "question": "Rate yourself honestly on these dimensions",
    "subtitle": "1 = barely know it, 10 = could teach it",
    "type": "multi_slider_panel",
    "dimensions": [{{"key": "snake_case_key", "label": "string", "description": "string"}}, ...] (5 dimensions tailored to their profession)
  }},
  "q6": {{
    "question": "What have you already tried to learn this?",
    "subtitle": "Prevents us from recommending what didn't work",
    "type": "conditional_checklist",
    "resources": ["resource1", "resource2", ...] (10 resources, mix of generic and field-specific),
    "completionOptions": ["Just started, lost motivation quickly", "Got halfway through but stopped", "Finished but didn't retain much", "Completed and applied it"],
    "stopReasons": ["Too boring", "Too hard", "Too slow", "Not practical enough", "Life got busy", "Couldn't find good resources", "Didn't know what to build"]
  }},
  "q7": {{
    "question": "Tell me exactly where you're stuck",
    "subtitle": "The more specific you are, the better your roadmap",
    "type": "three_textarea_structured",
    "placeholders": {{"trying": "example from their field", "notWorking": "example from their field", "alreadyTried": "example from their field"}},
    "quickTags": ["tag1", "tag2", ...] (5-7 tags relevant to their specific struggles)
  }},
  "q8": {{
    "question": "Which of these describe you?",
    "subtitle": "Toggle all that apply — this shapes your learning plan",
    "type": "binary_toggle_list",
    "toggles": ["statement1", "statement2", ...] (10 behavioral statements relevant to learning in their field)
  }},
  "q9": {{
    "question": "What's your end goal?",
    "subtitle": "Your goal unlocks follow-up details",
    "type": "card_plus_conditional_input",
    "goals": [
      {{"icon": "emoji", "label": "string", "followUp": {{"type": "text", "placeholder": "string"}} }},
      {{"icon": "emoji", "label": "string", "followUp": null}},
      ...
    ] (6 goals relevant to their career, each with optional followUp)
  }},
  "q10": {{
    "question": "How much time can you commit?",
    "subtitle": "We'll calculate if it's enough for your goal",
    "type": "smart_slider_with_calculator",
    "hoursRange": [1, 40],
    "deadlineOptions": ["1 week", "2 weeks", "1 month", "2 months", "3 months", "6 months", "1 year"],
    "deadlineWeeksMap": {{"1 week": 1, "2 weeks": 2, "1 month": 4, "2 months": 9, "3 months": 13, "6 months": 26, "1 year": 52}}
  }}
}}

CRITICAL RULES:
- q1 options MUST reflect their actual field from the resume
- q3 priorities MUST be relevant to their career stage and goals
- q5 dimensions MUST make sense for their profession
- q7 placeholders MUST use examples from their industry
- q8 toggles MUST be behavioral statements relevant to learning in their domain
- q9 goals MUST match realistic career outcomes for their background
- Return ONLY JSON. No markdown, no backticks, no explanation."""

    # Attempt up to 2 times (initial + 1 retry)
    for attempt in range(2):
        try:
            text = _call_gemini(prompt)
            cleaned = _clean_json_response(text)
            questions = json.loads(cleaned)
            # Basic validation: ensure we got q1 through q10
            if all(f"q{i}" in questions for i in range(1, 11)):
                return questions
            print(f"Dynamic questions missing keys on attempt {attempt + 1}, retrying...")
        except (json.JSONDecodeError, Exception) as e:
            print(f"Dynamic questions parse error on attempt {attempt + 1}: {e}")

    print("Dynamic questions generation failed, returning fallback set")
    return _get_fallback_questions()


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

        # Priorities (ranked list)
        priorities = profile.get("priorities", [])

        # Self assessment (dynamic keys from Gemini)
        sa = profile.get("selfAssessment", {}) or {}
        sa_text = ", ".join([f"{k}: {v}/10" for k, v in sa.items()]) if sa else "Not provided"

        # Learning history
        lh = profile.get("learningHistory", {}) or {}
        tried_resources = lh.get("triedResources", [])
        completion_level = lh.get("completionLevel", "")
        stop_reasons = lh.get("stopReasons", [])

        # The wall (highest signal — free text)
        tw = profile.get("theWall", {}) or {}
        trying = tw.get("trying", "")
        not_working = tw.get("notWorking", "")
        already_tried = tw.get("alreadyTried", "")

        # Behavior flags (binary toggles)
        behavior_flags = profile.get("behaviorFlags", [])

        # Goal
        goal = profile.get("goal", {}) or {}
        goal_type = goal.get("type", "")
        goal_detail = goal.get("detail", "")

        # Time commitment
        tc = profile.get("timeCommitment", {}) or {}
        hours_per_week = tc.get("hoursPerWeek", goal.get("hoursPerWeek", 10))
        deadline = tc.get("deadline", goal.get("deadline", ""))

        # Legacy fields (backward compat)
        ls = profile.get("learningStyle", {}) or {}
        primary_style = ls.get("primary", "")
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
Priorities (ranked): {', '.join(priorities) if priorities else 'Not specified'}
Current Level: {current_level}
Self Assessment: {sa_text}
Learning History: Tried {', '.join(tried_resources) if tried_resources else 'nothing yet'}, got to {completion_level or 'N/A'}, stopped because {', '.join(stop_reasons) if stop_reasons else 'N/A'}
The Wall (their own words): Trying to {trying or 'N/A'}, not working because {not_working or 'N/A'}, already tried {already_tried or 'N/A'}
Behavior Flags: {', '.join(behavior_flags) if behavior_flags else 'None selected'}
Goal: {goal_type or 'Not specified'}{f' — {goal_detail}' if goal_detail else ''} by {deadline or 'No deadline'}, {hours_per_week} hrs/week
Learning Style: {primary_style or 'Not specified'}
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


def chat_response(message: str, profile: dict, roadmap: list, history: list, diagnosis: dict = None) -> str:
    try:
        # Build history context
        history_text = ""
        for msg in history[-10:]:
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
        skills = ", ".join(profile.get("skills", []))
        role = profile.get("role", "")

        # Build diagnosis context
        diagnosis_text = ""
        if diagnosis:
            gap = diagnosis.get("gap", "")
            why_blocking = diagnosis.get("why_blocking", "")
            fix_time = diagnosis.get("fix_time", "")
            what_you_know = ", ".join(diagnosis.get("what_you_know", []))
            key_concepts = ", ".join(diagnosis.get("key_concepts", []))
            challenge = diagnosis.get("challenge", "")
            diagnosis_text = f"""
DIAGNOSIS DATA:
- Knowledge gap: {gap}
- Why it's blocking: {why_blocking}
- Estimated fix time: {fix_time}
- What they already know: {what_you_know}
- Key concepts to learn: {key_concepts}
- Practice challenge assigned: {challenge}
"""

        prompt = f"""You are Coach Sarah, an expert AI learning mentor with access to the internet and current knowledge. You are helping {name} ({role}) learn {topic} at {level} level.

LEARNER PROFILE:
- Name: {name}
- Role: {role}
- Skills: {skills}
- Topic: {topic}
- Level: {level}
{diagnosis_text}
LEARNING ROADMAP:
{roadmap_text}

RECENT CONVERSATION:
{history_text}

USER'S MESSAGE: {message}

INSTRUCTIONS:
1. You are Coach Sarah — warm, encouraging, knowledgeable, and specific.
2. You have FULL knowledge of this learner's profile, diagnosis, roadmap, and history above.
3. When the user asks questions about ANY topic (technical, career, learning strategies, etc.), give accurate, detailed answers using your knowledge.
4. Reference their specific roadmap steps, diagnosed gaps, and skills when relevant.
5. If the user asks about something outside their current topic, still answer helpfully — you're a general learning coach.
6. Provide code examples, explanations, links to concepts, or step-by-step guides when appropriate.
7. Keep responses concise but thorough. Use markdown formatting for code blocks and lists.
8. If they're stuck, give practical, actionable advice with specific next steps.
9. Always relate advice back to their learning journey when possible."""

        # Use Gemini with Google Search grounding for up-to-date answers
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            from google.generativeai.types import content_types
            response = model.generate_content(
                prompt,
                tools=[{"google_search": {}}],
            )
            return response.text
        except Exception as grounding_err:
            print(f"Grounding failed, falling back to standard: {grounding_err}")
            return _call_gemini(prompt)

    except Exception as e:
        print(f"Chat response error: {e}")
        return "I'm having trouble responding right now. Please try again in a moment."
