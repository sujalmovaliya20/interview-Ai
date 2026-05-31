'use client'

import { create } from 'zustand'

export interface TranscriptBlock {
  id: string
  text: string
  isQuestion: boolean
  timestamp: number
  isFinal: boolean
}

export interface AnswerBlock {
  id: string
  text: string
  isStreaming: boolean
  timestamp: number
  modelUsed: 'claude' | 'gpt-5' | string
}

export interface SessionState {
  sessionId: string | null
  status: 'idle' | 'joining' | 'active' | 'paused' | 'ending' | 'ended'
  model: 'claude' | 'gpt-5'
  language: string
  transcriptBlocks: TranscriptBlock[]
  answerBlocks: AnswerBlock[]
  isRecording: boolean
  isPaused: boolean
  audioLevel: number
  isConnected: boolean
  creditBalance: number
  startedAt: number | null
  error: string | null

  // Actions
  setSessionId: (id: string) => void
  setStatus: (status: SessionState['status']) => void
  setModel: (model: SessionState['model']) => void
  setLanguage: (lang: string) => void
  appendTranscriptDelta: (payload: { text: string; isFinal: boolean; timestamp: number }) => void
  appendAnswerDelta: (payload: { id: string; text: string; isStreaming: boolean; modelUsed: string }) => void
  finalizeAnswer: (id: string) => void
  setAudioLevel: (level: number) => void
  setIsRecording: (v: boolean) => void
  setIsPaused: (v: boolean) => void
  setIsConnected: (v: boolean) => void
  setCreditBalance: (v: number) => void
  setError: (msg: string | null) => void
  resetSession: () => void
}

const initialState = {
  sessionId: null,
  status: 'idle' as const,
  model: 'claude' as const,
  language: 'en',
  transcriptBlocks: [],
  answerBlocks: [],
  isRecording: false,
  isPaused: false,
  audioLevel: 0,
  isConnected: false,
  creditBalance: 0,
  startedAt: null,
  error: null,
}

const isQuestionText = (text: string) => {
  const t = text.trim().toLowerCase()
  if (t.endsWith('?')) return true
  
  const questionWords = ['how', 'what', 'why', 'where', 'when', 'who', 'can', 'could', 'tell', 'describe', 'explain']
  return questionWords.some(w => t.startsWith(w))
}

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setSessionId: (id) => set({ sessionId: id }),
  setStatus: (status) => set({ status }),
  setModel: (model) => set({ model }),
  setLanguage: (lang) => set({ language: lang }),
  
  appendTranscriptDelta: (payload) => set((state) => {
    const blocks = [...state.transcriptBlocks]
    const lastBlock = blocks[blocks.length - 1]

    if (lastBlock && !lastBlock.isFinal) {
      lastBlock.text = payload.text
      lastBlock.isFinal = payload.isFinal
      lastBlock.timestamp = payload.timestamp
      if (payload.isFinal) {
        lastBlock.isQuestion = isQuestionText(payload.text)
      }
    } else {
      blocks.push({
        id: `tb_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        text: payload.text,
        isQuestion: payload.isFinal ? isQuestionText(payload.text) : false,
        timestamp: payload.timestamp,
        isFinal: payload.isFinal
      })
    }
    return { transcriptBlocks: blocks }
  }),

  appendAnswerDelta: (payload) => set((state) => {
    const blocks = [...state.answerBlocks]
    const existingIndex = blocks.findIndex(b => b.id === payload.id)

    if (existingIndex >= 0) {
      blocks[existingIndex].text += payload.text
      blocks[existingIndex].isStreaming = payload.isStreaming
    } else {
      blocks.push({
        id: payload.id,
        text: payload.text,
        isStreaming: payload.isStreaming,
        timestamp: Date.now(),
        modelUsed: payload.modelUsed
      })
    }
    return { answerBlocks: blocks }
  }),

  finalizeAnswer: (id) => set((state) => {
    const blocks = state.answerBlocks.map(b => 
      b.id === id ? { ...b, isStreaming: false } : b
    )
    return { answerBlocks: blocks }
  }),

  setAudioLevel: (level) => set({ audioLevel: level }),
  setIsRecording: (v) => set({ isRecording: v }),
  setIsPaused: (v) => set({ isPaused: v }),
  setIsConnected: (v) => set({ isConnected: v }),
  setCreditBalance: (v) => set({ creditBalance: v }),
  setError: (msg) => set({ error: msg }),
  resetSession: () => set(initialState),
}))
