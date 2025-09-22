# Argo AI Chat - Quick Start Guide

## Prerequisites

1. Make sure you have the required environment variables set up in the LLM service
2. Ensure the database file exists: `apps/llm/LOCAL/Resources/argo.db`

## Starting the Services

### 1. Start the LLM Backend API

```bash
# Navigate to the LLM service directory
cd apps/llm

# Install dependencies (if not already done)
uv sync

# Start the FastAPI server
uvicorn server:app --reload --port 8000 --host 0.0.0.0
```

The LLM API will be available at: `http://localhost:8000`

### 2. Start the Next.js Frontend

```bash
# Navigate to the web app directory
cd apps/web

# Install dependencies (if not already done)
pnpm install

# Start the development server
pnpm dev
```

The web application will be available at: `http://localhost:3000`

### 3. Access the Chat Interface

Open your browser and navigate to: `http://localhost:3000/chat`

## API Testing

You can test the API directly:

```bash
# Test API health
curl http://localhost:8000/sessions

# Create a new session
curl -X POST http://localhost:8000/sessions/new

# Send a chat message
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "YOUR_SESSION_ID", "message": "What is the average temperature in the Arabian Sea?"}'
```

## Environment Configuration

Create `apps/web/.env.local` with:

```env
NEXT_PUBLIC_LLM_API_URL=http://localhost:8000
```

## Features Available

- **Session Management**: Create, list, and delete chat sessions
- **Persistent Chat History**: Messages are stored in the database
- **AI Assistant**: Ask questions about oceanographic data
- **Real-time Chat**: Interactive conversation with typing indicators
- **Responsive Design**: Works on desktop and mobile devices

## Example Questions to Try

- "What's the average temperature in the Arabian Sea?"
- "Show me salinity data from the Pacific Ocean"
- "What are Argo floats and how do they work?"
- "Find temperature anomalies in the last month"

## Troubleshooting

1. **API Connection Error**: Ensure the LLM backend is running on port 8000
2. **Database Error**: Check that the SQLite database exists in `apps/llm/LOCAL/Resources/argo.db`
3. **CORS Issues**: The FastAPI server should handle CORS automatically
4. **Environment Variables**: Make sure `GROQ_API_KEY` is set in the LLM service