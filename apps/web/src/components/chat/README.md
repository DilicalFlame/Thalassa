# Chat Interface for Argo AI

This directory contains the complete frontend implementation for the Argo AI chat interface, built with Next.js and Tailwind CSS.

## Features

- **Real-time Chat**: Interactive chat interface with the Argo AI assistant
- **Session Management**: Create, switch between, and delete chat sessions
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Message History**: Persistent chat history stored per session
- **Typing Indicators**: Visual feedback when AI is processing
- **Suggested Questions**: Quick-start prompts for common queries

## Components

### ChatInterface

Main container component that orchestrates all chat functionality:

- Manages sessions and messages state
- Handles API communications
- Coordinates between sidebar and chat area

### ChatSidebar

Session management sidebar:

- Lists all chat sessions
- Create new sessions
- Switch between sessions
- Delete sessions
- Responsive mobile behavior

### ChatMessages

Message display area:

- Renders user and AI messages
- Auto-scrolling to latest message
- Loading states and typing indicators
- Message timestamps

### ChatInput

Message input component:

- Auto-expanding textarea
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Suggested questions for new users
- Send button with loading states

## API Integration

The chat interface communicates with the FastAPI backend through:

- `POST /sessions/new` - Create new chat session
- `GET /sessions` - List all sessions
- `GET /sessions/{id}/history` - Get session message history
- `DELETE /sessions/{id}` - Delete a session
- `POST /chat` - Send message and receive AI response

## Setup

1. **Environment Variables**
   Copy `.env.local.example` to `.env.local` and configure:
   ```
   NEXT_PUBLIC_LLM_API_URL=http://localhost:8000
   ```

2. **Start the LLM Backend**
   ```bash
   cd apps/llm
   uvicorn server:app --reload --port 8000
   ```

3. **Start the Frontend**
   ```bash
   cd apps/web
   pnpm dev
   ```

4. **Access the Chat**
   Navigate to `http://localhost:3000/chat`

## Usage

1. **Starting a Chat**: Click "Start New Chat" to create your first session
2. **Asking Questions**: Type questions about oceanographic data, Argo floats, or marine science
3. **Session Management**: Use the sidebar to switch between different chat sessions
4. **Suggested Questions**: Click on suggested prompts to get started quickly

## Styling

The interface uses:

- **Tailwind CSS** for utility-first styling
- **Custom CSS** for chat-specific animations and scrollbars
- **Responsive Design** with mobile-first approach
- **Accessibility** features including proper focus states and keyboard navigation

## Error Handling

The interface includes comprehensive error handling:

- API connection failures
- Session not found errors
- Message sending failures with retry capability
- Loading states during API calls