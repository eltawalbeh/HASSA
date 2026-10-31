import { describe, expect, it } from 'vitest';
import { buildChatMessages, HASSA_IDENTITY } from '../lib/persona';

describe('HASSA identity', () => {
  it('adds the identity as first system message before any model call', () => {
    const messages = buildChatMessages([{ role: 'user', content: 'مين إنت؟' }], 'ar');
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toBe(HASSA_IDENTITY);
    expect(messages[1]).toEqual({ role: 'user', content: 'مين إنت؟' });
  });
  it('keeps existing user and assistant turns intact without persisting an extra system message', () => {
    const history = [{ role: 'user' as const, content: 'Hello' }, { role: 'assistant' as const, content: 'Hi!' }];
    const result = buildChatMessages(history, 'en');
    expect(result.slice(1)).toEqual(history);
    expect(history).toHaveLength(2);
  });
  it('does not misrepresent HASSA as a freshly trained Jordanian foundation model', () => {
    expect(HASSA_IDENTITY).toContain('not a human and must not claim');
    expect(HASSA_IDENTITY).toContain('Jordanian');
  });
});
