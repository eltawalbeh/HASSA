import type { AppPreferences, Conversation } from '../types';
export const STORAGE_KEY = 'hassa-ai:desktop:v1';
export const defaults: AppPreferences = { language: 'ar', defaultModel: '', conversations: [] };
export function sanitizeConversations(input: unknown): Conversation[] {
  if (!Array.isArray(input)) return [];
  return input.filter((v): v is Conversation => Boolean(v && typeof v === 'object' && typeof v.id === 'string' && typeof v.title === 'string' && typeof v.updatedAt === 'number' && Array.isArray(v.messages))).map(v => ({ ...v, messages: v.messages.filter(m => m && typeof m.id === 'string' && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && typeof m.createdAt === 'number') }));
}
export function parsePreferences(json: string | null): AppPreferences {
  if (!json) return { ...defaults };
  try {
    const v: unknown = JSON.parse(json);
    if (!v || typeof v !== 'object') return { ...defaults };
    const obj = v as Partial<AppPreferences>;
    return { language: obj.language === 'en' ? 'en' : 'ar', defaultModel: typeof obj.defaultModel === 'string' ? obj.defaultModel : '', conversations: sanitizeConversations(obj.conversations) };
  } catch { return { ...defaults }; }
}
export function readPreferences(): AppPreferences {
  try { return parsePreferences(localStorage.getItem(STORAGE_KEY)); } catch { return { ...defaults }; }
}
export function writePreferences(prefs: AppPreferences): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); return true; } catch { return false; }
}
