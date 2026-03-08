import os
from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def search_videos(query: str, max_results: int = 3) -> list:
    try:
        request = youtube.search().list(
            part="snippet",
            q=query,
            type="video",
            maxResults=max_results,
            order="relevance"
        )
        response = request.execute()
        videos = []
        for item in response.get("items", []):
            videos.append({
                "video_id": item["id"]["videoId"],
                "title": item["snippet"]["title"],
                "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
                "channel": item["snippet"]["channelTitle"]
            })
        return videos
    except Exception as e:
        print(f"YouTube search error: {e}")
        return []


def get_transcript_timestamp(video_id: str, topic: str) -> int:
    try:
        ytt_api = YouTubeTranscriptApi()
        transcript = ytt_api.fetch(video_id)
        transcript_text = " ".join([f"[{int(entry.start)}s] {entry.text}" for entry in transcript.snippets[:200]])

        from services.gemini_service import _call_gemini
        response_text = _call_gemini(
            f"Given this video transcript with timestamps, find the exact second where the content about '{topic}' starts. Return ONLY the number of seconds as an integer, nothing else.\n\nTranscript:\n{transcript_text}"
        )
        seconds = int(response_text.strip())
        return seconds
    except Exception as e:
        print(f"Transcript timestamp error: {e}")
        return 0


def build_timestamp_url(video_id: str, seconds: int) -> str:
    if seconds > 0:
        return f"https://www.youtube.com/watch?v={video_id}&t={seconds}"
    return f"https://www.youtube.com/watch?v={video_id}"
