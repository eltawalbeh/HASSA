import { describe, expect, it, vi } from 'vitest';
import { parsePullEvent, readPullStream, OllamaProtocolError } from '../lib/ollamaStream';

describe('local Ollama download protocol', () => {
  it('parses and clamps completed progress', () => {
    expect(parsePullEvent('{"status":"pulling","completed":45,"total":100}', 'qwen3:4b')?.percent).toBe(45);
    expect(parsePullEvent('{"completed":150,"total":100}', 'qwen3:4b')?.percent).toBe(100);
  });
  it('handles an absent total without inventing a percentage', () => {
    expect(parsePullEvent('{"status":"verifying"}', 'qwen3:4b')?.percent).toBeUndefined();
  });
  it('rejects malformed JSON and model errors', () => {
    expect(() => parsePullEvent('not-json', 'qwen3:4b')).toThrow(OllamaProtocolError);
    expect(() => parsePullEvent('{"error":"out of disk space"}', 'qwen3:4b')).toThrow('out of disk space');
  });
  it('handles fragmented UTF-8 and final line without newline', async () => {
    const payload = new TextEncoder().encode('{"status":"تنزيل","completed":1,"total":2}\n{"status":"done","completed":2,"total":2}');
    let pos = 0;
    const stream = new ReadableStream<Uint8Array>({ pull(controller) {
      if (pos === payload.length) { controller.close(); return; }
      controller.enqueue(payload.slice(pos, ++pos));
    }});
    const observe = vi.fn();
    await readPullStream(stream, 'qwen3:4b', observe);
    expect(observe).toHaveBeenCalledTimes(2);
    expect(observe.mock.calls[0][0].status).toBe('تنزيل');
    expect(observe.mock.calls[1][0].percent).toBe(100);
  });
});
