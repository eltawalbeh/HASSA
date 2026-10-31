import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Check, ChevronDown, CircleHelp, Download, HardDrive, Languages, Menu, MessageSquare, MoreHorizontal, Plus, RefreshCw, Search, Settings, ShieldCheck, Trash2, WifiOff, X } from 'lucide-react';
import { Dialog } from './components/Dialog';
import { MessageContent } from './components/MessageContent';
import { buildChatMessages } from './lib/persona';
import { checkEngine, deleteModel, listModels, pullModel, sendChat } from './lib/ollama';
import { readPreferences, writePreferences } from './lib/storage';
import { t } from './i18n';
import type { AppPreferences, ChatMessage, Conversation, EngineStatus, ModelInfo, PullProgress } from './types';

type Page = 'chat' | 'models' | 'settings';
type Modal = { type: 'delete-chat'; id: string } | { type: 'rename-chat'; id: string } | { type: 'delete-model'; name: string } | null;
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const EMPTY_ENGINE: EngineStatus = { connected: false, version: null, error: null };
const SUGGESTED_MODEL = 'qwen3:4b';

export function App() {
  const [prefs, setPrefs] = useState<AppPreferences>(readPreferences);
  const [page, setPage] = useState<Page>('chat');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [engine, setEngine] = useState<EngineStatus>(EMPTY_ENGINE);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [connecting, setConnecting] = useState(true);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState<PullProgress | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [notice, setNotice] = useState('');
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lang = prefs.language;
  const i = t(lang);
  const conversations = prefs.conversations;
  const current = conversations.find(c => c.id === activeId) ?? null;
  const activeModel = models.find(m => m.name === prefs.defaultModel)?.name ?? models[0]?.name ?? '';
  const isReady = engine.connected && models.length > 0;
  const suggestedInstalled = models.some(m => m.name === SUGGESTED_MODEL);

  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; }, [lang]);
  useEffect(() => { if (!writePreferences(prefs)) setNotice(lang === 'ar' ? 'تعذر حفظ المحادثات على الجهاز.' : 'Could not save conversations locally.'); }, [prefs, lang]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [current?.messages.length, pending]);

  const refresh = useCallback(async () => {
    setConnecting(true);
    try {
      const status = await checkEngine(); setEngine(status);
      if (status.connected) {
        const installed = await listModels(); setModels(installed);
        setPrefs(old => ({ ...old, defaultModel: installed.some(m => m.name === old.defaultModel) ? old.defaultModel : (installed[0]?.name ?? '') }));
      } else setModels([]);
    } catch (e) { setEngine({ connected: false, version: null, error: String(e) }); setModels([]); }
    finally { setConnecting(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const filtered = useMemo(() => conversations.filter(c => (c.title + ' ' + c.messages.map(m => m.content).join(' ')).toLocaleLowerCase().includes(query.toLocaleLowerCase())), [conversations, query]);

  function patchConversation(id: string, apply: (c: Conversation) => Conversation) {
    setPrefs(old => ({ ...old, conversations: old.conversations.map(c => c.id === id ? apply(c) : c) }));
  }
  function newConversation() { setActiveId(null); setDraft(''); setPage('chat'); setNotice(''); requestAnimationFrame(() => composerRef.current?.focus()); }
  function openChat(id: string) { setActiveId(id); setPage('chat'); setDraft(''); setNotice(''); }
  function openRename(c: Conversation) { setRenameDraft(c.title); setModal({ type: 'rename-chat', id: c.id }); }
  function saveRename() {
    if (modal?.type !== 'rename-chat' || !renameDraft.trim()) return;
    patchConversation(modal.id, c => ({ ...c, title: renameDraft.trim(), updatedAt: Date.now() })); setModal(null);
  }
  async function send(text = draft) {
    const content = text.trim(); if (!content || pending) return;
    if (!engine.connected) { setNotice(i.engineMissing); return; }
    if (!activeModel) { setNotice(i.chooseModel); setPage('models'); return; }
    setNotice(''); setDraft('');
    const id = activeId ?? uid(), now = Date.now();
    const userMessage: ChatMessage = { id: uid(), role: 'user', content, createdAt: now };
    const previous = conversations.find(c => c.id === id);
    const nextMessages = [...(previous?.messages ?? []), userMessage];
    if (!previous) {
      const item: Conversation = { id, title: content.slice(0, 55), messages: nextMessages, updatedAt: now };
      setPrefs(old => ({ ...old, conversations: [item, ...old.conversations] }));
      setActiveId(id);
    } else patchConversation(id, c => ({ ...c, messages: nextMessages, updatedAt: now }));
    setPending(true);
    try {
      const reply = await sendChat(activeModel, buildChatMessages(nextMessages, lang));
      if (!reply.trim()) throw new Error(i.emptyResponse);
      const assistant: ChatMessage = { id: uid(), role: 'assistant', content: reply.trim(), createdAt: Date.now() };
      patchConversation(id, c => ({ ...c, messages: [...c.messages, assistant], updatedAt: Date.now() }));
    } catch (e) { setNotice(e instanceof Error ? e.message : i.genericError); }
    finally { setPending(false); }
  }
  async function download(name: string) {
    setDownloading(name); setProgress({ model: name, status: i.downloading }); setNotice('');
    try { await pullModel(name, setProgress); await refresh(); setPrefs(old => ({ ...old, defaultModel: name })); }
    catch (e) { setNotice(e instanceof Error ? e.message : i.genericError); }
    finally { setDownloading(null); }
  }
  async function confirmModalAction() {
    if (!modal) return;
    try {
      if (modal.type === 'delete-chat') {
        setPrefs(old => ({ ...old, conversations: old.conversations.filter(c => c.id !== modal.id) }));
        if (activeId === modal.id) setActiveId(null);
      } else if (modal.type === 'delete-model') await deleteModel(modal.name).then(refresh);
    } catch (e) { setNotice(e instanceof Error ? e.message : i.genericError); }
    finally { setModal(null); }
  }
  const statusText = connecting ? i.loading : !engine.connected ? i.offline : !models.length ? i.noModel : i.online;

  return <div className="app-shell" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <aside className="sidebar" aria-label={i.history}>
      <div className="brand"><div className="brand-mark" aria-hidden="true">ه</div><div><div className="brand-word">{i.app}</div><div className="brand-sub">HASSA AI</div></div></div>
      <button className="new-chat" onClick={newConversation}><Plus size={18}/><span>{i.newChat}</span></button>
      <div className="sidebar-heading">{i.today}</div>
      <div className="sidebar-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={i.search} aria-label={i.search}/>{query && <button className="clear-search" onClick={() => setQuery('')} aria-label={i.clearSearch}><X size={15}/></button>}</div>
      <nav className="conversation-list" aria-label={i.history}>
        {filtered.length ? filtered.map(c => <div className={'conversation-entry ' + (activeId === c.id && page === 'chat' ? 'active' : '')} key={c.id}>
          <button className="conversation-link" onClick={() => openChat(c.id)} aria-current={activeId === c.id && page === 'chat' ? 'page' : undefined}><MessageSquare size={15}/><span title={c.title}>{c.title}</span></button>
          <div className="item-menu"><button aria-label={i.renameConversation} title={i.renameConversation} onClick={() => openRename(c)}><MoreHorizontal size={17}/></button><button aria-label={i.removeConversation} title={i.removeConversation} onClick={() => setModal({ type: 'delete-chat', id: c.id })}><Trash2 size={14}/></button></div>
        </div>) : <p className="empty-history">{query ? i.noResults : i.noChats}</p>}
      </nav>
      <div className="sidebar-bottom">
        <button className={'nav-action ' + (page === 'models' ? 'selected' : '')} onClick={() => { setPage('models'); setNotice(''); }}><HardDrive size={18}/>{i.models}</button>
        <button className={'nav-action ' + (page === 'settings' ? 'selected' : '')} onClick={() => { setPage('settings'); setNotice(''); }}><Settings size={18}/>{i.settings}</button>
      </div>
    </aside>

    <div className="workspace">
      <header className="topbar">
        <div className="page-heading"><Menu size={17} aria-hidden="true"/><h1>{page === 'chat' ? (current?.title ?? i.header) : page === 'models' ? i.models : i.settings}</h1></div>
        <div className="topbar-tools">
          <div className="model-select-wrap"><label className="sr-only" htmlFor="active-model">{i.selectModel}</label><select id="active-model" value={activeModel} onChange={e => setPrefs(old => ({ ...old, defaultModel: e.target.value }))} disabled={!models.length || pending}>{models.length ? models.map(m => <option key={m.name} value={m.name}>{m.name}</option>) : <option value="">{i.noModel}</option>}</select><ChevronDown size={15} aria-hidden="true"/></div>
          <span className={'status-pill ' + (engine.connected ? models.length ? 'connected' : 'warning' : 'disconnected')} role="status"><span className="status-dot"/>{statusText}</span>
          <button className="icon-button refresh-button" onClick={() => void refresh()} disabled={connecting} aria-label={i.retry} title={i.retry}><RefreshCw size={16} className={connecting ? 'spin' : ''}/></button>
        </div>
      </header>

      {notice && <div className="notice" role="alert"><CircleHelp size={18}/><span>{notice}</span><button onClick={() => setNotice('')} aria-label={i.close}><X size={17}/></button></div>}

      {page === 'chat' ? <main className="chat-page">
        {!engine.connected && !connecting && <section className="state-panel" role="status"><WifiOff size={29}/><h2>{i.offline}</h2><p>{i.engineMissing} {i.engineHow}</p><button className="btn secondary" onClick={() => void refresh()}><RefreshCw size={17}/>{i.retry}</button></section>}
        {engine.connected && !models.length && !connecting && <section className="state-panel" role="status"><HardDrive size={29}/><h2>{i.noModel}</h2><p>{i.installModel}</p><button className="btn primary" onClick={() => setPage('models')}><Download size={17}/>{i.download}</button></section>}
        {isReady && !current?.messages.length && <section className="welcome" aria-label={i.greeting}>
          <div className="welcome-symbol" aria-hidden="true">✦</div><h2>{i.greeting}</h2><p>{i.greetingSub}</p>
          <div className="suggestions">{([1, 2, 3] as const).map(n => <button className="suggestion" key={n} onClick={() => void send(i[`prompt${n}`])}>{i[`idea${n}`]}<span>↗</span></button>)}</div>
        </section>}
        {isReady && current?.messages.length ? <section className="messages" aria-label={i.history}>
          {current.messages.map(m => <article className={'message ' + m.role} key={m.id}><div className="message-role">{m.role === 'user' ? (lang === 'ar' ? 'أنت' : 'You') : i.app}</div><MessageContent content={m.content}/></article>)}
          {pending && <div className="thinking" role="status"><span className="dot-pulse"/>{i.stop}</div>}<div ref={endRef}/>
        </section> : null}
        <div className="composer-zone">
          <div className={'composer ' + (!isReady || pending ? 'composer-disabled' : '')}><label htmlFor="chat-composer" className="sr-only">{i.input}</label><textarea id="chat-composer" ref={composerRef} rows={2} value={draft} onChange={e => setDraft(e.target.value)} placeholder={i.input} disabled={!isReady || pending} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }}/><button className="send-button" aria-label={i.send} title={i.send} disabled={!isReady || pending || !draft.trim()} onClick={() => void send()}><ArrowUp size={20}/></button></div>
          <p className="composer-footnote">{i.disclaimer}</p>
        </div>
      </main> : null}

      {page === 'models' && <main className="content-page"><div className="section-header"><div><h2>{i.installed}</h2><p>{i.modelHint}</p></div><button className="btn secondary" onClick={() => void refresh()}><RefreshCw size={16}/>{i.retry}</button></div>
        {!engine.connected ? <div className="state-panel compact"><WifiOff size={24}/>{i.engineMissing}</div> : models.length ? <div className="model-list">{models.map(m => <div className="model-card" key={m.name}><div className="model-details"><div className="model-icon"><HardDrive size={20}/></div><div><div className="model-name">{m.name} {m.name === activeModel && <span className="model-active"><Check size={13}/>{i.active}</span>}</div><p>{(m.size / (1024 ** 3)).toFixed(1)} GB · {i.savedLocally}</p></div></div><div className="model-actions"><button className="btn secondary" onClick={() => setPrefs(old => ({ ...old, defaultModel: m.name }))} disabled={activeModel === m.name}>{i.choose}</button><button className="btn danger-outline" onClick={() => setModal({ type: 'delete-model', name: m.name })}><Trash2 size={16}/>{i.delete}</button></div></div>)}</div> : <div className="state-panel compact"><HardDrive size={25}/>{i.installModel}</div>}
        {!suggestedInstalled && <><div className="section-header model-suggested"><div><h2>{i.suggested}</h2><p>{SUGGESTED_MODEL}</p></div></div>
        <div className="model-card"><div className="model-details"><div className="model-icon"><HardDrive size={20}/></div><div><div className="model-name">Qwen3 4B</div><p>{i.modelHint}</p></div></div><button className="btn primary" disabled={!engine.connected || Boolean(downloading) || models.some(m => m.name === SUGGESTED_MODEL)} onClick={() => void download(SUGGESTED_MODEL)}><Download size={16}/>{downloading ? i.downloading : i.download}</button></div>
        </>}
        {downloading && <div className="download-progress" role="status" aria-live="polite"><div>{progress?.status || i.downloading} {typeof progress?.percent === 'number' ? `${progress.percent}%` : ''}</div><progress value={progress?.percent ?? undefined} max="100"/></div>}
      </main>}

      {page === 'settings' && <main className="content-page"><div className="section-header"><div><h2>{i.settings}</h2><p>{i.subtitle}</p></div></div>
        <div className="settings-list"><div className="setting-row"><div><strong><ShieldCheck size={18}/>{i.hassaIdentity}</strong><p>{i.hassaIdentityDesc}</p></div><span className="setting-value">HASSA AI</span></div><div className="setting-row"><div><strong><Languages size={18}/>{i.language}</strong><p>العربية / English</p></div><select aria-label={i.language} value={lang} onChange={e => setPrefs(old => ({ ...old, language: e.target.value === 'en' ? 'en' : 'ar' }))}><option value="ar">العربية</option><option value="en">English</option></select></div>
          <div className="setting-row"><div><strong><ShieldCheck size={18}/>{i.privacy}</strong><p>{i.privacyDesc}</p></div><span className="setting-value">{i.savedLocally}</span></div>
          <div className="setting-row"><div><strong><Settings size={18}/>{i.appearance}</strong><p>{i.darkOnly}</p></div><span className="setting-value">Dark</span></div>
          <div className="setting-row"><div><strong><CircleHelp size={18}/>{i.keyboard}</strong><p>{i.keyboardDesc}</p></div><span className="setting-value">Enter / Shift+Enter / Esc</span></div></div>
        <p className="app-version">{i.about} · {engine.version ? `Ollama ${engine.version}` : 'Ollama —'}</p>
      </main>}
    </div>

    {modal && <Dialog title={modal.type === 'delete-model' ? i.confirmDelete : modal.type === 'delete-chat' ? i.removeConversation : i.renameConversation} onClose={() => setModal(null)}>
      {modal.type === 'rename-chat' ? <><label className="modal-field"><span>{i.rename}</span><input autoFocus value={renameDraft} onChange={e => setRenameDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveRename(); }}/></label><div className="dialog-actions"><button className="btn secondary" onClick={() => setModal(null)}>{i.cancel}</button><button className="btn primary" onClick={saveRename} disabled={!renameDraft.trim()}>{i.save}</button></div></> : <><p className="dialog-description">{modal.type === 'delete-model' ? i.deleteDesc : i.removeConversation}</p><div className="dialog-actions"><button className="btn secondary" onClick={() => setModal(null)}>{i.cancel}</button><button className="btn danger" onClick={() => void confirmModalAction()}><Trash2 size={16}/>{i.delete}</button></div></>}
    </Dialog>}
  </div>;
}
