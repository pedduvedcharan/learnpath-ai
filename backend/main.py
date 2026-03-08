from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from routes.auth import router as auth_router
from routes.profile import router as profile_router
from routes.generate import router as generate_router
from routes.readiness import router as readiness_router
from routes.chat import router as chat_router
from routes.progress import router as progress_router
from services.email_scheduler import start_email_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch email scheduler (every 5 minutes)
    start_email_scheduler(interval_seconds=300)
    yield
    # Shutdown: nothing to clean up (daemon thread dies with process)


app = FastAPI(title="LearnPath AI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for audio
static_dir = Path(__file__).parent / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(generate_router)
app.include_router(readiness_router)
app.include_router(chat_router)
app.include_router(progress_router)


@app.get("/")
def root():
    return {"status": "LearnPath AI Backend Running"}
