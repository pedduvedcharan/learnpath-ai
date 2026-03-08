import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
from datetime import datetime

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

_client = None
_db = None
_indexes_created = False


def get_db():
    global _client, _db, _indexes_created
    if _db is None:
        _client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            retryWrites=True,
            tls=True,
            tlsCAFile=certifi.where(),
        )
        # Test connection immediately
        try:
            _client.admin.command("ping")
            print("MongoDB connected successfully")
        except Exception as e:
            print(f"MongoDB ping failed: {e}")
            # Reset and retry with fresh client
            _client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=30000,
                connectTimeoutMS=30000,
                socketTimeoutMS=30000,
                retryWrites=True,
                tls=True,
                tlsCAFile=certifi.where(),
            )
        _db = _client["learnpath_ai"]
    if not _indexes_created:
        try:
            _db["users"].create_index("user_id")
            _db["users"].create_index("email", unique=True, sparse=True)
            _db["learning_profiles"].create_index("user_id")
            _db["sessions"].create_index("user_id")
            _db["chat_history"].create_index("user_id")
            _indexes_created = True
        except Exception as e:
            print(f"Warning: Could not create indexes: {e}")
    return _db


def save_user(user_data: dict) -> str:
    doc = {**user_data, "created_at": datetime.utcnow()}
    result = get_db()["users"].insert_one(doc)
    return str(result.inserted_id)


def get_user(user_id: str) -> dict:
    user = get_db()["users"].find_one({"_id": ObjectId(user_id)})
    if user:
        user["_id"] = str(user["_id"])
    return user


def update_user(user_id: str, update_data: dict):
    get_db()["users"].update_one({"_id": ObjectId(user_id)}, {"$set": update_data})


def save_learning_profile(profile_data: dict) -> str:
    doc = {**profile_data, "created_at": datetime.utcnow()}
    db = get_db()
    existing = db["learning_profiles"].find_one({"user_id": doc["user_id"]})
    if existing:
        db["learning_profiles"].update_one({"user_id": doc["user_id"]}, {"$set": doc})
        return str(existing["_id"])
    result = db["learning_profiles"].insert_one(doc)
    return str(result.inserted_id)


def get_learning_profile(user_id: str) -> dict:
    profile = get_db()["learning_profiles"].find_one({"user_id": user_id})
    if profile:
        profile["_id"] = str(profile["_id"])
    return profile


def save_session(session_data: dict) -> str:
    doc = {**session_data, "created_at": datetime.utcnow()}
    result = get_db()["sessions"].insert_one(doc)
    return str(result.inserted_id)


def get_sessions(user_id: str) -> list:
    results = list(get_db()["sessions"].find({"user_id": user_id}).sort("created_at", -1))
    for r in results:
        r["_id"] = str(r["_id"])
    return results


def get_latest_session(user_id: str) -> dict:
    session = get_db()["sessions"].find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if session:
        session["_id"] = str(session["_id"])
    return session


def update_session(session_id: str, update_data: dict):
    get_db()["sessions"].update_one({"_id": ObjectId(session_id)}, {"$set": update_data})


def save_chat_message(user_id: str, role: str, text: str):
    get_db()["chat_history"].update_one(
        {"user_id": user_id},
        {"$push": {"messages": {"role": role, "text": text, "timestamp": datetime.utcnow()}}},
        upsert=True
    )


def get_chat_history(user_id: str) -> list:
    doc = get_db()["chat_history"].find_one({"user_id": user_id})
    if doc and "messages" in doc:
        return doc["messages"]
    return []


def find_user_by_email(email: str) -> dict:
    user = get_db()["users"].find_one({"email": email.lower().strip()})
    if user:
        user["_id"] = str(user["_id"])
    return user


def get_user_completion_status(user_id: str) -> dict:
    """Check how far a user has progressed through the flow."""
    status = {
        "has_profile": False,
        "has_questions": False,
        "has_need": False,
        "has_session": False,
    }
    try:
        user = get_user(user_id)
        if user:
            status["has_questions"] = bool(user.get("generated_questions"))
            status["has_need"] = bool(user.get("need_type"))

        profile = get_learning_profile(user_id)
        status["has_profile"] = bool(profile)

        session = get_latest_session(user_id)
        status["has_session"] = bool(session)
    except Exception as e:
        print(f"Completion status error: {e}")
    return status
