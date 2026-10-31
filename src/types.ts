export type Language = 'ar' | 'en';
export type Role = 'user' | 'assistant';
export type ChatMessage = { id: string; role: Role; content: string; createdAt: number };
export type Conversation = { id: string; title: string; messages: ChatMessage[]; updatedAt: number };
export type ModelInfo = { name: string; size: number; modified_at?: string };
export type EngineStatus = { connected: boolean; version: string | null; error: string | null };
export type PullProgress = { model: string; status: string; completed?: number; total?: number; percent?: number; error?: string };
export type AppPreferences = { language: Language; defaultModel: string; conversations: Conversation[]; replyStyle?: 'natural' | 'formal' | 'concise'; detailLevel?: 'brief' | 'balanced' | 'detailed'; creativity?: number };
