import type {
    ChatRequest,
    ChatResponse,
    SessionsResponse,
    HistoryResponse,
    NewSessionResponse,
} from '@/types/chat'

const API_BASE_URL =
    process.env.NEXT_PUBLIC_LLM_API_URL || 'http://localhost:8001'

class ChatService {
    private async fetchApi<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        })

        if (!response.ok) {
            throw new Error(
                `API Error: ${response.status} ${response.statusText}`
            )
        }

        return response.json()
    }

    async createSession(): Promise<NewSessionResponse> {
        return this.fetchApi<NewSessionResponse>('/sessions/new', {
            method: 'POST',
        })
    }

    async getSessions(): Promise<SessionsResponse> {
        return this.fetchApi<SessionsResponse>('/sessions')
    }

    async getHistory(sessionId: string): Promise<HistoryResponse> {
        return this.fetchApi<HistoryResponse>(`/sessions/${sessionId}/history`)
    }

    async deleteSession(sessionId: string): Promise<{ message: string }> {
        return this.fetchApi<{ message: string }>(`/sessions/${sessionId}`, {
            method: 'DELETE',
        })
    }

    async sendMessage(
        sessionId: string,
        message: string
    ): Promise<ChatResponse> {
        const requestBody: ChatRequest = {
            session_id: sessionId,
            message,
        }

        return this.fetchApi<ChatResponse>('/chat', {
            method: 'POST',
            body: JSON.stringify(requestBody),
        })
    }

    async transcribeAudio(audioFile: File): Promise<{ transcript: string }> {
        const formData = new FormData()
        formData.append('file', audioFile)

        const response = await fetch(`${API_BASE_URL}/transcribe`, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            throw new Error(
                `Transcription Error: ${response.status} ${response.statusText}`
            )
        }

        return response.json()
    }
}

export const chatService = new ChatService()
