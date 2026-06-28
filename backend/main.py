from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import engine, Base
from routers import auth, users, members, chats

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Auto-create tables (for rapid prototyping/SQLite)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: Close database connection pool
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# Configure CORS (allow local client connections)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(members.router, prefix="/api")
app.include_router(chats.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to the Enterprise Messenger API. Visit /docs for documentation."}

# Real-time WebSocket Endpoint matching: ws://localhost:8000/ws/chat/{user_id}
@app.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int
):
    from services.websocket import handle_websocket_session
    await handle_websocket_session(websocket, user_id)
