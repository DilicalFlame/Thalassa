export interface Session {
    id: string
    created_at: string
}

export interface Message {
    role: 'user' | 'assistant'
    content: string
    created_at?: string
}

export interface ChatRequest {
    session_id: string
    message: string
}

export interface ChatResponse {
    session_id: string
    answer: string
    history: Message[]
}

export interface SessionsResponse {
    sessions: Session[]
}

export interface HistoryResponse {
    session_id: string
    history: Message[]
}

export interface NewSessionResponse {
    session_id: string
    message: string
}
