import os
from dotenv import load_dotenv

load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "prasadamconnect01@gmail.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://learnpath-frontend-946079744284.us-central1.run.app")


def _build_html(name, subject, body_html):
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px 32px 24px;">
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#FFFFFF;">LearnPath AI</h1>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Your Personal AI Learning Coach</p>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;color:#0F172A;">Hi <strong>{name}</strong>,</p>
      {body_html}
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94A3B8;">LearnPath AI — HackAI 2026, UT Dallas</p>
    </div>
  </div>
</body>
</html>"""


def _cta_button(text, url):
    return f"""<a href="{url}" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#FFFFFF;
    font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;margin:16px 0;">{text}</a>"""


def send_welcome_email(email, name, user_id):
    subject = f"Welcome to LearnPath AI, {name}!"
    body = f"""
      <p style="color:#475569;line-height:1.7;">Your account has been created successfully. You're one step closer to a personalized learning roadmap powered by AI.</p>
      <p style="color:#475569;line-height:1.7;"><strong>Here's what's next:</strong></p>
      <ul style="color:#475569;line-height:2;">
        <li>Tell us about yourself (your role, skills, experience)</li>
        <li>Upload your resume for AI-powered analysis</li>
        <li>Answer 10 smart questions so we understand your goals</li>
        <li>Get your personalized diagnosis, roadmap & resources</li>
      </ul>
      {_cta_button("Continue Your Setup →", f"{FRONTEND_URL}/details?uid={user_id}")}
    """
    _send(email, subject, _build_html(name, subject, body))


def send_profile_incomplete_email(email, name, user_id):
    subject = f"{name}, your learning profile is waiting!"
    body = f"""
      <p style="color:#475569;line-height:1.7;">You started setting up your LearnPath AI profile but haven't completed the questions yet.</p>
      <p style="color:#475569;line-height:1.7;">Our AI coach is ready to diagnose your skill gaps, build a custom roadmap, and find the perfect resources for you.</p>
      <p style="color:#475569;line-height:1.7;font-weight:600;">It only takes 3 more minutes to finish!</p>
      {_cta_button("Complete Your Profile →", f"{FRONTEND_URL}/questions?uid={user_id}")}
    """
    _send(email, subject, _build_html(name, subject, body))


def send_questions_done_email(email, name, user_id):
    subject = f"{name}, one more step to your AI roadmap!"
    body = f"""
      <p style="color:#475569;line-height:1.7;">Great work answering all the questions! You're almost there.</p>
      <p style="color:#475569;line-height:1.7;">Just tell us <strong>what brings you here today</strong> and we'll generate your complete personalized learning plan with:</p>
      <ul style="color:#475569;line-height:2;">
        <li>Gap diagnosis — what's blocking you</li>
        <li>Visual learning roadmap</li>
        <li>Handpicked resources (YouTube, Coursera, GitHub & more)</li>
        <li>Custom practice challenge</li>
        <li>AI voice coach</li>
      </ul>
      {_cta_button("Get Your Roadmap →", f"{FRONTEND_URL}/need?uid={user_id}")}
    """
    _send(email, subject, _build_html(name, subject, body))


def send_dashboard_ready_email(email, name, user_id, gap="", fix_time=""):
    subject = f"{name}, your AI learning plan is ready!"
    body = f"""
      <p style="color:#475569;line-height:1.7;">Your personalized learning analysis is complete and your dashboard is ready!</p>
      <div style="background:#F0F0FF;border:1px solid #C7D2FE;border-radius:12px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#6366F1;font-weight:600;">YOUR DIAGNOSED GAP</p>
        <p style="margin:0;font-size:16px;color:#0F172A;font-weight:600;">{gap or "Check your dashboard"}</p>
        {"<p style='margin:8px 0 0;font-size:14px;color:#475569;'>Estimated fix time: <strong>" + fix_time + "</strong></p>" if fix_time else ""}
      </div>
      <p style="color:#475569;line-height:1.7;">Coach Sarah is ready to guide you. Chat with her, listen to voice coaching, and track your progress.</p>
      {_cta_button("Open Your Dashboard →", f"{FRONTEND_URL}/analysis?uid={user_id}")}
    """
    _send(email, subject, _build_html(name, subject, body))


def send_streak_reminder_email(email, name, user_id, streak=1):
    subject = f"Keep your {streak}-day streak alive, {name}!"
    body = f"""
      <p style="color:#475569;line-height:1.7;">You're on a <strong>{streak}-day learning streak</strong>! Don't break it now.</p>
      <p style="color:#475569;line-height:1.7;">Your AI coach has new insights and your roadmap is waiting. Even 10 minutes of learning today keeps you on track.</p>
      {_cta_button("Continue Learning →", f"{FRONTEND_URL}/analysis?uid={user_id}")}
      <p style="color:#94A3B8;font-size:13px;margin-top:20px;">Tip: Ask Coach Sarah anything — she knows your profile and can help with any topic.</p>
    """
    _send(email, subject, _build_html(name, subject, body))


def _send(to_email, subject, html_content):
    try:
        if not SENDGRID_API_KEY:
            print(f"[EMAIL] No SendGrid API key — would send '{subject}' to {to_email}")
            return False

        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email=FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=html_content,
        )

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"[EMAIL] Sent '{subject}' to {to_email} — status {response.status_code}")
        return True
    except Exception as e:
        print(f"[EMAIL] Failed to send '{subject}' to {to_email}: {e}")
        return False
