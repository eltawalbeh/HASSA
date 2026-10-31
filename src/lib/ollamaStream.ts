import type { PullProgress } from '../types';

export class OllamaProtocolError extends Error {
  constructor(message: string) { super(message); this.name = 'OllamaProtocolError'; }
}

type PullEvent = { status?: unknown; completed?: unknown; total?: unknown; error?: unknown };

export function parsePullEvent(line: string, model: string): PullProgress | null {
  if (!line.trim()) return null;
  let event: PullEvent;
  try { event = JSON.parse(line) as PullEvent; }
  catch { throw new OllamaProtocolError('Ollama returned invalid model-download data.'); }
  if (!event || typeof event !== 'object') throw new OllamaProtocolError('Invalid Ollama download event.');
  if (typeof event.error === 'string' && event.error) throw new OllamaProtocolError(event.error);
  const total = typeof event.total === 'number' && Number.isFinite(event.total) && event.total > 0 ? event.total : undefined;
  const completed = typeof event.completed === 'number' && Number.isFinite(event.completed) && event.completed >= 0 ? event.completed : undefined;
  return {
    model, status: typeof event.status === 'string' ? event.status : '', completed, total,
    percent: total && completed !== undefined ? Math.max(0, Math.min(100, Math.round(completed / total * 100))) : undefined,
  };
}

/** Parses NDJSON even when byte chunks split UTF-8 characters or JSON lines. */
export async function readPullStream(
  stream: ReadableStream<Uint8Array>, model: string, onProgress: (progress: PullProgress) => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const event = parsePullEvent(line, model);
        if (event) onProgress(event);
      }
    }
    buffer += decoder.decode();
    const last = parsePullEvent(buffer, model);
    if (last) onProgress(last);
  } finally { reader.releaseLock(); }
}
