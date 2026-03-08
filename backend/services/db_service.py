import os
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
from datetime import datetime

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))
db = client["learnpath_ai"]

users = db["users"]
learning_profiles = db["learning_profiles"]
sessions = db["sessions"]
chat_history = db["chat_history"]

# Create indexes
users.create_index("user_id")
learning_profiles.create_index("user_id")
sessions.create_index("user_id")
chat_history.create_index("user_id")


def save_user(user_data: dict) -> str:
    user_data["created_at"] = datetime.utcnow()
    result = users.insert_one(user_data)
    return str(result.inserted_id)


def get_user(user_id: str) -> dict:
    user = users.find_one({"_id": ObjectId(user_id)})
    if user:
        user["_id"] = str(user["_id"])
    return user


def save_learning_profile(profile_data: dict) -> str:
    profile_data["created_at"] = datetime.utcnow()
    # Update if exists, insert if not
    existing = learning_profiles.find_one({"user_id": profile_data["user_id"]})
    if existing:
        learning_profiles.update_one({"user_id": profile_data["user_id"]}, {"$set": profile_data})
        return str(existing["_id"])
    result = learning_profiles.insert_one(profile_data)
    return str(result.inserted_id)


def get_learning_profile(user_id: str) -> dict:
    profile = learning_profiles.find_one({"user_id": user_id})
    if profile:
        profile["_id"] = str(profile["_id"])
    return profile


def save_session(session_data: dict) -> str:
    session_data["created_at"] = datetime.utcnow()
    result = sessions.insert_one(session_data)
    return str(result.inserted_id)


def get_sessions(user_id: str) -> list:
    results = list(sessions.find({"user_id": user_id}).sort("created_at", -1))
    for r in results:
        r["_id"] = str(r["_id"])
    return results


def get_latest_session(user_id: str) -> dict:
    session = sessions.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if session:
        session["_id"] = str(session["_id"])
    return session


def update_session(session_id: str, update_data: dict):
    sessions.update_one({"_id": ObjectId(session_id)}, {"$set": update_data})


def save_chat_message(user_id: str, role: str, text: str):
    chat_history.update_one(
        {"user_id": user_id},
        {"$push": {"messages": {"role": role, "text": text, "timestamp": datetime.utcnow()}}},
        upsert=True
    )


def get_chat_history(user_id: str) -> list:
    doc = chat_history.find_one({"user_id": user_id})
    if doc and "messages" in doc:
        return doc["messages"]
    return []
