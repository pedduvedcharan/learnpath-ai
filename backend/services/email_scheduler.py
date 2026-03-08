import threading
import time
from datetime import datetime, timedelta
from services import db_service, email_service


def _check_and_send_emails():
    """Check all users and send progress emails based on their current status."""
    try:
        db = db_service.get_db()
        users = list(db["users"].find({"email": {"$exists": True, "$ne": ""}}))

        now = datetime.utcnow()

        for user in users:
            try:
                user_id = str(user["_id"])
                email = user.get("email", "")
                name = user.get("name") or user.get("first_name", "Learner")
                created_at = user.get("created_at")

                if not email:
                    continue

                # Track which emails we've already sent
                emails_sent = user.get("emails_sent", [])

                # Get completion status
                status = db_service.get_user_completion_status(user_id)

                # Determine which email to send based on status
                if status["has_session"]:
                    # User has completed everything — send dashboard/streak email
                    if "dashboard_ready" not in emails_sent:
                        # Get gap info from session
                        session = db_service.get_latest_session(user_id)
                        gap = ""
                        fix_time = ""
                        if session and "diagnosis" in session:
                            gap = session["diagnosis"].get("gap", "")
                            fix_time = session["diagnosis"].get("fix_time", "")
                        email_service.send_dashboard_ready_email(email, name, user_id, gap, fix_time)
                        _mark_email_sent(user_id, "dashboard_ready")
                    elif "streak_1" not in emails_sent:
                        email_service.send_streak_reminder_email(email, name, user_id, streak=1)
                        _mark_email_sent(user_id, "streak_1")
                    elif "streak_2" not in emails_sent:
                        email_service.send_streak_reminder_email(email, name, user_id, streak=2)
                        _mark_email_sent(user_id, "streak_2")

                elif status["has_profile"] or status["has_need"]:
                    # User answered questions but hasn't generated analysis yet
                    if "questions_done" not in emails_sent:
                        email_service.send_questions_done_email(email, name, user_id)
                        _mark_email_sent(user_id, "questions_done")

                elif status["has_questions"]:
                    # User has generated questions but hasn't answered them yet
                    if "profile_incomplete" not in emails_sent:
                        email_service.send_profile_incomplete_email(email, name, user_id)
                        _mark_email_sent(user_id, "profile_incomplete")

                else:
                    # User just signed up — send welcome if not sent
                    if "welcome" not in emails_sent:
                        email_service.send_welcome_email(email, name, user_id)
                        _mark_email_sent(user_id, "welcome")
                    elif "profile_incomplete" not in emails_sent:
                        email_service.send_profile_incomplete_email(email, name, user_id)
                        _mark_email_sent(user_id, "profile_incomplete")

            except Exception as user_err:
                print(f"[SCHEDULER] Error processing user {user.get('_id')}: {user_err}")

    except Exception as e:
        print(f"[SCHEDULER] Error in email check: {e}")


def _mark_email_sent(user_id, email_type):
    try:
        db_service.get_db()["users"].update_one(
            {"_id": __import__("bson").ObjectId(user_id)},
            {"$addToSet": {"emails_sent": email_type}},
        )
    except Exception as e:
        print(f"[SCHEDULER] Failed to mark email sent: {e}")


def _scheduler_loop(interval_seconds=300):
    """Run email checks every interval_seconds (default 5 minutes)."""
    print(f"[SCHEDULER] Email scheduler started — checking every {interval_seconds}s")
    while True:
        time.sleep(interval_seconds)
        print(f"[SCHEDULER] Running email check at {datetime.utcnow().isoformat()}")
        _check_and_send_emails()


def start_email_scheduler(interval_seconds=300):
    """Start the email scheduler in a background daemon thread."""
    thread = threading.Thread(
        target=_scheduler_loop,
        args=(interval_seconds,),
        daemon=True,
    )
    thread.start()
    print(f"[SCHEDULER] Background email scheduler thread started")
