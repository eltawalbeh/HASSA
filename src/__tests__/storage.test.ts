import { describe, expect, it } from 'vitest';
import { parsePreferences, sanitizeConversations } from '../lib/storage';
describe('local preferences', () => {
  it('starts Arabic and with no conversations', () => expect(parsePreferences(null)).toEqual({ language: 'ar', defaultModel: '', conversations: [] }));
  it('falls back on invalid JSON', () => expect(parsePreferences('{')).toEqual({ language: 'ar', defaultModel: '', conversations: [] }));
  it('rejects malformed messages', () => {
    const conversations = sanitizeConversations([{ id: 'one', title: 'Hello', updatedAt: 1, messages: [{ role: 'user', content: 'ok', id: 'x', createdAt: 1 }, { role: 'system', content: 'bad', id: 'y', createdAt: 1 }] }]);
    expect(conversations[0].messages).toHaveLength(1);
  });
});
