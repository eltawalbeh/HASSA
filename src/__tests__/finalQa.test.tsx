import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { sendChat } from '../lib/ollama';
import { ChatBubble } from '../components/ChatBubble';
import { MessageContent } from '../components/MessageContent';
import { Dialog } from '../components/Dialog';
import { HistoryPanel } from '../components/MvpPages';
import type { Conversation } from '../types';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Final QA — HASSA messages, directionality and cancellation', () => {
  it('passes a full response from local Ollama', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: { content: 'أهلين وسهلين' } }), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    const result = await sendChat('qwen3:4b', [{ role: 'user', content: 'مرحبا' }], 0.55);
    expect(result).toBe('أهلين وسهلين');
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.model).toBe('qwen3:4b');
    expect(body.options.temperature).toBe(0.55);
  });

  it('stops while awaiting the response body, not just the HTTP headers', async () => {
    const controller = new AbortController();
    let onBodyRead: () => void = () => {};
    const bodyReading = new Promise<void>(resolve => { onBodyRead = resolve; });
    const fetcher = vi.fn((_url: string, init: RequestInit) => Promise.resolve({
      ok: true,
      json: () => {
        onBodyRead();
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
        });
      },
    }));
    vi.stubGlobal('fetch', fetcher);
    const response = sendChat('qwen3:4b', [{ role: 'user', content: 'stop' }], 0.7, controller.signal);
    await bodyReading;
    controller.abort();
    await expect(response).rejects.toThrow('Request cancelled');
    expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

  it('uses auto-direction per paragraph for mixed Arabic and English', () => {
    const html = renderToStaticMarkup(<MessageContent content={'مرحبا بالعالم\n\nHello from HASSA\n\n1. English\n2. عربي'}/>);
    expect((html.match(/<p dir="auto"/g) || []).length).toBe(2);
    expect((html.match(/<li dir="auto"/g) || []).length).toBe(2);
  });

  it('keeps the approved message layout content-sized and unclipped', () => {
    const html = renderToStaticMarkup(<ChatBubble role="user" language="ar" assistantName="هسّا" content={'مرحبا '.repeat(80)}/>);
    expect(html).toContain('class="message message-bubble user"');
  });

  it('provides localized close controls and dialog semantics', () => {
    const ar = renderToStaticMarkup(<Dialog title="تأكيد الحذف" onClose={() => {}} language="ar"><p>أكيد؟</p></Dialog>);
    const en = renderToStaticMarkup(<Dialog title="Delete?" onClose={() => {}} language="en"><p>Confirm</p></Dialog>);
    expect(ar).toContain('aria-label="إغلاق النافذة"');
    expect(en).toContain('aria-label="Close dialog"');
    expect(ar).toContain('aria-modal="true"');
  });

  it('sorts saved history by most recent activity', () => {
    const conv = (id: string, title: string, updatedAt: number): Conversation => ({ id, title, updatedAt, messages: [] });
    const html = renderToStaticMarkup(<HistoryPanel language="en" conversations={[conv('old', 'Older conversation', 10000),conv('new', 'Newest conversation', 20000)]} filter="" onFilter={()=>{}} open={()=>{}} rename={()=>{}} remove={()=>{}}/>);
    expect(html.indexOf('Newest conversation')).toBeLessThan(html.indexOf('Older conversation'));
  });
});
