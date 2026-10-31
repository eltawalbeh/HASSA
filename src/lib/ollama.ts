import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { EngineStatus, ModelInfo, PullProgress } from '../types';
import type { ChatTurn } from './persona';
import { readPullStream } from './ollamaStream';

export type WireMessage = ChatTurn;
const BASE = 'http://127.0.0.1:11434';
const REQUEST_TIMEOUT_MS = 300_000;
export class EngineError extends Error { constructor(message: string) { super(message); this.name = 'EngineError'; } }

async function request(path: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  const abortExternal=()=>ctrl.abort();
  init?.signal?.addEventListener('abort',abortExternal,{once:true});
  try {
    if(init?.signal?.aborted) throw new EngineError('Request cancelled.');
    const response = await fetch(`${BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new EngineError(`Ollama HTTP ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`);
    }
    return response;
  } catch (error) {
    if (error instanceof EngineError) throw error;
    if (init?.signal?.aborted) throw new EngineError('Request cancelled.');
    if (ctrl.signal.aborted) throw new EngineError('Ollama request timed out.');
    throw new EngineError(error instanceof Error ? error.message : 'Cannot connect to local Ollama.');
  } finally { clearTimeout(timeout); init?.signal?.removeEventListener('abort',abortExternal); }
}
async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await request(path, init);
  try { return await response.json() as T; }
  catch { throw new EngineError('Ollama returned an invalid response.'); }
}
export async function checkEngine(): Promise<EngineStatus> {
  if (isTauri()) return invoke<EngineStatus>('check_engine');
  try { const obj = await jsonRequest<{version?: string}>('/api/version'); return { connected: true, version: obj.version ?? null, error: null }; }
  catch (error) { return { connected: false, version: null, error: error instanceof Error ? error.message : String(error) }; }
}
export async function listModels(): Promise<ModelInfo[]> {
  if (isTauri()) return invoke<ModelInfo[]>('list_models');
  const obj = await jsonRequest<{models?: ModelInfo[]}>('/api/tags');
  return (obj.models ?? []).map(model => ({ name: model.name, size: model.size, modified_at: model.modified_at }));
}
export async function sendChat(model: string, messages: WireMessage[], temperature = 0.7, signal?: AbortSignal): Promise<string> {
  if (!model.trim()) throw new EngineError('Select a local model first.');
  if (isTauri()) {
    const onAbort=()=>{void invoke('cancel_chat').catch(()=>{});};
    signal?.addEventListener('abort', onAbort, {once:true});
    try {return await invoke<string>('chat_with_model', { model, messages, temperature });}
    finally {signal?.removeEventListener('abort', onAbort);}
  }
  const obj = await jsonRequest<{message?: {content?: string}}>('/api/chat', {
    method: 'POST', body: JSON.stringify({ model, messages, stream: false, options: { temperature } }), signal,
  });
  return obj.message?.content ?? '';
}
export async function deleteModel(name: string): Promise<void> {
  if (isTauri()) { await invoke('delete_model', { name }); return; }
  await request('/api/delete', { method: 'DELETE', body: JSON.stringify({ model: name }) });
}
export async function pullModel(name: string, onProgress: (p: PullProgress) => void, signal?: AbortSignal): Promise<void> {
  if (isTauri()) {
    const unlisten = await listen<PullProgress>('model-pull-progress', event => {
      if (event.payload.model === name) onProgress(event.payload);
    });
    const cancel = () => { void invoke('cancel_pull').catch(()=>{}); };
    signal?.addEventListener('abort', cancel, { once:true });
    try { await invoke('pull_model', { name }); } finally { signal?.removeEventListener('abort', cancel); unlisten(); }
    return;
  }
  // Streaming pulls can take much longer than normal requests, so do not apply the 5-minute timeout.
  let response: Response;
  try {
    response = await fetch(`${BASE}/api/pull`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: name, stream: true }), signal,
    });
  } catch (error) { throw new EngineError(error instanceof Error ? error.message : 'Ollama is not connected.'); }
  if (!response.ok || !response.body) throw new EngineError(`Ollama model download failed (HTTP ${response.status}).`);
  await readPullStream(response.body, name, onProgress);
}
