# server.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, UploadFile, File
from config import GEMINI_API_KEY
from pydantic import BaseModel
from app import app as agent_app, chat_model
from langchain.memory import ConversationSummaryBufferMemory
from langchain_core.messages import HumanMessage
from google import genai
import duckdb
import uuid
import tempfile


DB_PATH = "LOCAL/Resources/argo-old-2.db"

# ---------- Ensure DB + Tables ----------
conn = duckdb.connect(DB_PATH)
conn.execute("""
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    summary TEXT
)
""")
# messages table, using AUTOINCREMENT since DuckDB 0.10 supports it
conn.execute("""
CREATE SEQUENCE IF NOT EXISTS message_id_seq;
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER DEFAULT nextval('message_id_seq'),
    session_id VARCHAR,
    role VARCHAR,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")
conn.close()

# ---------- FastAPI ----------
app = FastAPI(title="Argo AI Agent API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Schemas ----------
class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    session_id: str
    answer: str
    history: list

# ---------- Helpers ----------
def new_memory():
    """Create a fresh summary memory buffer."""
    return ConversationSummaryBufferMemory(
        llm=chat_model,
        max_token_limit=500,
        return_messages=True
    )


def load_memory_from_db(session_id: str):
    memory = new_memory()
    with duckdb.connect(DB_PATH) as conn:
        past_msgs = conn.execute(
            "SELECT role, content FROM messages WHERE session_id=? ORDER BY created_at ASC",
            [session_id]
        ).fetchall()

        # ✅ Load summary from sessions table
        result = conn.execute(
            "SELECT summary FROM sessions WHERE id=?", [session_id]
        ).fetchone()
        summary = result[0] if result else None

    if summary:
        memory.moving_summary_buffer = summary  # ✅ Restore memory summary

    for role, content in past_msgs:
        if role == "user":
            memory.chat_memory.add_user_message(content)
        elif role == "assistant":
            memory.chat_memory.add_ai_message(content)

    return memory

# ---------- Endpoints ----------

@app.post("/sessions/new")
async def create_session():
    session_id = str(uuid.uuid4())
    with duckdb.connect(DB_PATH) as conn:
        conn.execute("INSERT INTO sessions (id) VALUES (?)", [session_id])
    return {"session_id": session_id, "message": "New session created."}

@app.get("/sessions")
async def list_sessions():
    with duckdb.connect(DB_PATH) as conn:
        rows = conn.execute("SELECT id, created_at FROM sessions ORDER BY created_at DESC").fetchall()
    return {"sessions": [{"id": r[0], "created_at": str(r[1])} for r in rows]}

@app.get("/sessions/{session_id}/history")
async def get_history(session_id: str):
    with duckdb.connect(DB_PATH) as conn:
        rows = conn.execute(
            "SELECT role, content, created_at FROM messages WHERE session_id=? ORDER BY created_at ASC",
            [session_id]
        ).fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail="Session not found or no messages")
    history = [{"role": r[0], "content": r[1], "created_at": str(r[2])} for r in rows]
    return {"session_id": session_id, "history": history}

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    with duckdb.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM messages WHERE session_id=?", [session_id])
        conn.execute("DELETE FROM sessions WHERE id=?", [session_id])
    return {"message": f"Session {session_id} deleted."}

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # 1️⃣ Check if session exists
    with duckdb.connect(DB_PATH) as conn:
        session_exists = conn.execute(
            "SELECT COUNT(*) FROM sessions WHERE id=?", [req.session_id]
        ).fetchone()[0]
    if not session_exists:
        raise HTTPException(status_code=404, detail="Session not found")

    # 2️⃣ Load session memory (messages + summary)
    memory = load_memory_from_db(req.session_id)

    # 3️⃣ Overwrite the global memory in app so the agent sees it
    import app as app_module
    app_module.summary_memory = memory

    # 4️⃣ Add current user message to memory
    user_msg = HumanMessage(content=req.message)
    memory.chat_memory.add_user_message(req.message)

    # 5️⃣ Prepare conversation state for LangGraph
    conversation_state = {"messages": [user_msg]}
    final_answer = None

    # 6️⃣ Stream the agent
    for event in app_module.app.stream(conversation_state, {"recursion_limit": 15}):
        if "call_model" in event:
            last_message = event["call_model"]["messages"][-1]
            # Only final AI response, not tool calls
            if not getattr(last_message, "tool_calls", None):
                final_answer = last_message
                memory.chat_memory.add_ai_message(final_answer.content)

    if not final_answer:
        raise HTTPException(status_code=500, detail="Agent could not produce a response")

    # 7️⃣ Save messages and updated summary to DB
    with duckdb.connect(DB_PATH) as conn:
        # Save user message
        conn.execute(
            "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
            [req.session_id, "user", req.message]
        )
        # Save AI response
        conn.execute(
            "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
            [req.session_id, "assistant", final_answer.content]
        )
        # Update session summary
        conn.execute(
            "UPDATE sessions SET summary=? WHERE id=?",
            [memory.moving_summary_buffer, req.session_id]
        )

        # Reload full history for response
        history = conn.execute(
            "SELECT role, content FROM messages WHERE session_id=? ORDER BY created_at ASC",
            [req.session_id]
        ).fetchall()

    return ChatResponse(
        session_id=req.session_id,
        answer=final_answer.content,
        history=[{"role": r[0], "content": r[1]} for r in history]
    )

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    client = genai.Client(api_key=GEMINI_API_KEY)
    # Save the uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    # Upload the file to Gemini
    uploaded = client.files.upload(file=tmp_path)

    # Ask Gemini to transcribe
    prompt = "Transcribe the following audio file to plain text. Return only the transcript."
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[prompt, uploaded]
    )

    return {"transcript": response.text}