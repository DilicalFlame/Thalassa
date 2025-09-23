import { useState, useRef, useCallback } from 'react'

export interface SpeechToTextOptions {
    onTranscriptionComplete?: (transcript: string) => void
    onError?: (error: string) => void
}

export interface SpeechToTextResult {
    isRecording: boolean
    isProcessing: boolean
    startRecording: () => Promise<void>
    stopRecording: () => void
    error: string | null
}

const API_BASE_URL =
    process.env.NEXT_PUBLIC_LLM_API_URL || 'http://localhost:8001'

export function useSpeechToText({
    onTranscriptionComplete,
    onError,
}: SpeechToTextOptions = {}): SpeechToTextResult {
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    // Debug browser environment
    console.log('Browser environment:', {
        isSecureContext:
            typeof window !== 'undefined' ? window.isSecureContext : 'unknown',
        protocol:
            typeof window !== 'undefined'
                ? window.location.protocol
                : 'unknown',
        hasMediaDevices:
            typeof navigator !== 'undefined' && !!navigator.mediaDevices,
        hasGetUserMedia:
            typeof navigator !== 'undefined' &&
            !!navigator.mediaDevices?.getUserMedia,
        hasMediaRecorder: typeof MediaRecorder !== 'undefined',
    })

    const processAudioBlob = useCallback(
        async (audioBlob: Blob) => {
            try {
                // Convert WebM to WAV format for better compatibility
                const wavBlob = await convertToWav(audioBlob)

                // Create FormData for file upload
                const formData = new FormData()
                formData.append('file', wavBlob, 'recording.wav')

                // Send to transcription endpoint
                const response = await fetch(`${API_BASE_URL}/transcribe`, {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    throw new Error(
                        `Transcription failed: ${response.statusText}`
                    )
                }

                const data = await response.json()
                const transcript = data.transcript?.trim() || ''

                if (transcript) {
                    onTranscriptionComplete?.(transcript)
                } else {
                    throw new Error('No speech detected in the recording')
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to process audio'
                setError(errorMessage)
                onError?.(errorMessage)
            } finally {
                setIsProcessing(false)
            }
        },
        [onTranscriptionComplete, onError]
    )

    const startRecording = useCallback(async () => {
        console.log('startRecording called')
        try {
            setError(null)

            // Check for browser support
            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                throw new Error('Your browser does not support audio recording')
            }

            // Check MediaRecorder support
            if (!MediaRecorder) {
                throw new Error(
                    'MediaRecorder is not supported in your browser'
                )
            }

            console.log('Requesting microphone access...')
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                },
            })

            console.log('Microphone access granted, creating MediaRecorder...')

            // Check supported MIME types and use a fallback
            let mimeType = 'audio/webm;codecs=opus'
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                console.log('webm/opus not supported, trying webm')
                mimeType = 'audio/webm'
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    console.log('webm not supported, trying mp4')
                    mimeType = 'audio/mp4'
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        console.log('Using default MIME type')
                        mimeType = ''
                    }
                }
            }

            console.log('Using MIME type:', mimeType)

            // Create MediaRecorder instance
            const mediaRecorder = new MediaRecorder(
                stream,
                mimeType ? { mimeType } : undefined
            )

            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: 'audio/webm;codecs=opus',
                })

                // Stop all tracks to release microphone
                stream.getTracks().forEach((track) => track.stop())

                await processAudioBlob(audioBlob)
            }

            mediaRecorder.start()
            console.log('Recording started')
            setIsRecording(true)
        } catch (err) {
            console.error('Error in startRecording:', err)
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to start recording'
            setError(errorMessage)
            onError?.(errorMessage)
        }
    }, [onError, processAudioBlob])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsProcessing(true)
        }
    }, [isRecording])

    const convertToWav = async (webmBlob: Blob): Promise<Blob> => {
        try {
            const audioContext = new AudioContext()
            const arrayBuffer = await webmBlob.arrayBuffer()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

            // Create WAV file from AudioBuffer
            const wavArrayBuffer = audioBufferToWav(audioBuffer)
            return new Blob([wavArrayBuffer], { type: 'audio/wav' })
        } catch (err) {
            // If conversion fails, return original blob
            console.warn('Failed to convert audio format, using original:', err)
            return webmBlob
        }
    }

    return {
        isRecording,
        isProcessing,
        startRecording,
        stopRecording,
        error,
    }
}

// Helper function to convert AudioBuffer to WAV format
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16

    const bytesPerSample = bitDepth / 8
    const blockAlign = numberOfChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = length * blockAlign
    const bufferSize = 44 + dataSize

    const arrayBuffer = new ArrayBuffer(bufferSize)
    const view = new DataView(arrayBuffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
        }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, bufferSize - 8, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // Sub-chunk size
    view.setUint16(20, format, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)

    // Convert audio data
    let offset = 44
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(
                -1,
                Math.min(1, buffer.getChannelData(channel)[i])
            )
            view.setInt16(offset, sample * 0x7fff, true)
            offset += 2
        }
    }

    return arrayBuffer
}
