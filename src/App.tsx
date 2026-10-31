import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Check, ChevronDown, CircleHelp, Download, HardDrive, History, Menu, MessageSquare, MoreHorizontal, Plus, RefreshCw, Search, Settings, Trash2, WifiOff, X } from 'lucide-react';
import { Dialog } from './components/Dialog';
import { MessageContent } from './components/MessageContent';
import { HistoryPanel, SettingsPanel, ShortcutsPanel, type SettingsSection } from './components/MvpPages';
import { Onboarding, type SetupStep } from './components/Onboarding';
import { buildChatMessages } from './lib/persona';
import { checkEngine, deleteModel, listModels, pullModel, sendChat } from './lib/ollama';
import { readPreferences, writePreferences } from './lib/storage';
import { t } from './i18n';
import type { AppPreferences, ChatMessage, Conversation, EngineStatus, ModelInfo, PullProgress } from './types';

type Page = 'chat' | 'models' | 'settings' | 'history' | 'onboarding';
type Modal = { type: 'delete-chat'; id: string } | { type: 'rename-chat'; id: string } | { type: 'delete-model'; name: string } | {type:'clear-history'} | {type:'export-success'} | {type:'shortcuts'} | {type:'cancel-download'} | null;
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const EMPTY_ENGINE: EngineStatus = { connected: false, version: null, error: null };
const SUGGESTED_MODEL = 'qwen3:4b';
const SUGGESTED_MODELS = ['qwen3:1.7b', 'qwen3:4b', 'qwen3:8b'];

export function App() {
  const [prefs, setPrefs] = useState<AppPreferences>(readPreferences);
  const [page, setPage] = useState<Page>('chat');
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('general');
  const [setupStep, setSetupStep] = useState<SetupStep>('welcome');
  const [setupModel, setSetupModel] = useState(SUGGESTED_MODEL);
  const [setupError, setSetupError] = useState('');
  const pullAbort = useRef<AbortController|null>(null);
  const chatAbort = useRef<AbortController|null>(null);
  const firstSetup = useRef(false);
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
  const suggestions = SUGGESTED_MODELS.filter(name => !models.some(m => m.name === name));

  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; }, [lang]);
  useEffect(() => { if (!writePreferences(prefs)) setNotice(lang === 'ar' ? 'تعذر حفظ المحادثات على الجهاز.' : 'Could not save conversations locally.'); }, [prefs, lang]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [current?.messages.length, pending]);
  useEffect(() => { if (!connecting && engine.connected && !models.length && !conversations.length && !firstSetup.current) { firstSetup.current=true; setPage('onboarding'); } }, [connecting, engine.connected, models.length, conversations.length]);
  useEffect(() => { const keys=(e:KeyboardEvent)=>{ if(e.ctrlKey && !e.shiftKey && e.key.toLowerCase()==='n'){e.preventDefault();newConversation();} if(e.ctrlKey && !e.shiftKey && e.key.toLowerCase()==='k'){e.preventDefault();setPage('history');requestAnimationFrame(()=>document.querySelector<HTMLInputElement>('.history-search input')?.focus());} };document.addEventListener('keydown',keys);return()=>document.removeEventListener('keydown',keys); }, []);

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
  function newConversation() { chatAbort.current?.abort(); setActiveId(null); setDraft(''); setPage('chat'); setNotice(''); requestAnimationFrame(() => composerRef.current?.focus()); }
  function openChat(id: string) { chatAbort.current?.abort(); setActiveId(id); setPage('chat'); setDraft(''); setNotice(''); }
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
    const controller=new AbortController();chatAbort.current=controller;setPending(true);
    try {
      const reply = await sendChat(activeModel, buildChatMessages(nextMessages, lang, prefs), 0.15 + (prefs.creativity??50) / 100 * 1.05, controller.signal);
      if(controller.signal.aborted)return;
      if (!reply.trim()) throw new Error(i.emptyResponse);
      const assistant: ChatMessage = { id: uid(), role: 'assistant', content: reply.trim(), createdAt: Date.now() };
      patchConversation(id, c => ({ ...c, messages: [...c.messages, assistant], updatedAt: Date.now() }));
    } catch (e) { if(!controller.signal.aborted)setNotice(e instanceof Error ? e.message : i.genericError); }
    finally {chatAbort.current=null;setPending(false); }
  }
  async function download(name: string) {
    const controller=new AbortController();pullAbort.current=controller;setDownloading(name);setProgress({model:name,status:i.downloading});setNotice('');
    if(page==='onboarding')setSetupStep('downloading');
    try {
      await pullModel(name,setProgress,controller.signal);
      if(controller.signal.aborted)return;
      await refresh();setPrefs(old=>({...old,defaultModel:name}));
      if(page==='onboarding')setSetupStep('complete');
    } catch(e) {
      if(controller.signal.aborted){ if(page==='onboarding')setSetupStep('choose');return; }
      const message=e instanceof Error?e.message:i.genericError;setNotice(message);setSetupError(message);
      if(page==='onboarding')setSetupStep('error');
    } finally {pullAbort.current=null;setDownloading(null);}
  }
  function exportConversations(){
    try {const json=JSON.stringify({product:'HASSA AI',exportedAt:new Date().toISOString(),conversations:prefs.conversations},null,2);
      const url=URL.createObjectURL(new Blob([json],{type:'application/json;charset=utf-8'}));
      const link=document.createElement('a');link.href=url;link.download='hassa-conversations-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);setModal({type:'export-success'});
    }catch(e){setNotice(e instanceof Error?e.message:i.genericError);}
  }
  async function confirmModalAction() {
    if (!modal) return;
    try {
      if (modal.type === 'delete-chat') {
        setPrefs(old => ({ ...old, conversations: old.conversations.filter(c => c.id !== modal.id) }));
        if (activeId === modal.id) setActiveId(null);
      } else if (modal.type === 'delete-model') await deleteModel(modal.name).then(refresh);
      else if (modal.type === 'clear-history') {setPrefs(old=>({...old,conversations:[]}));setActiveId(null);setQuery('');setPage('settings');}
      else if (modal.type === 'cancel-download') pullAbort.current?.abort();
    } catch (e) { setNotice(e instanceof Error ? e.message : i.genericError); }
    finally { setModal(null); }
  }
  const statusText = connecting ? i.loading : !engine.connected ? i.offline : !models.length ? i.noModel : i.online;

  if(page==='onboarding')return <div dir={lang==='ar'?'rtl':'ltr'} className="hassa-onboarding-root"><Onboarding language={lang} step={setupStep} onStep={setSetupStep} engine={engine} models={models} model={setupModel} onModel={setSetupModel} progress={progress} downloading={Boolean(downloading)} onDownload={()=>void download(setupModel)} onCancel={()=>setModal({type:'cancel-download'})} onRetry={()=>{ if(!engine.connected){void refresh();setSetupStep('choose');} else void download(setupModel);}} onChat={newConversation} onModels={()=>setPage('models')} error={setupError}/>{modal?.type==='cancel-download'&&<Dialog title={lang==='ar'?'بدك توقف التنزيل؟':'Cancel download?'} onClose={()=>setModal(null)}><p className="dialog-description">{lang==='ar'?'إذا ألغيت، قد تحتاج تبدأ التنزيل من جديد. محادثاتك ما بتتأثر.':'You may need to download again. Your conversations remain intact.'}</p><div className="dialog-actions"><button className="btn secondary" onClick={()=>setModal(null)}>{i.cancel}</button><button className="btn danger" onClick={()=>{pullAbort.current?.abort();setModal(null);setSetupStep('choose');}}>{lang==='ar'?'إيقاف التنزيل':'Stop download'}</button></div></Dialog>}</div>;

  return <div className="app-shell" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <aside className="sidebar" aria-label={i.history}>
      <div className="brand"><img className="brand-logo" src="/hassa-logo.svg" alt={lang === "ar" ? "هسّا — HASSA AI" : "HASSA AI"} /></div>
      <button className="new-chat" onClick={newConversation}><Plus size={18}/><span>{i.newChat}</span></button>
      <div className="sidebar-heading">{i.today}</div>
      <div className="sidebar-search"><Search size={16}/><input value={query} onChange={e => {setQuery(e.target.value);if(e.target.value)setPage('history');}} placeholder={i.search} aria-label={i.search}/>{query && <button className="clear-search" onClick={() => setQuery('')} aria-label={i.clearSearch}><X size={15}/></button>}</div>
      <nav className="conversation-list" aria-label={i.history}>
        {filtered.length ? filtered.map(c => <div className={'conversation-entry ' + (activeId === c.id && page === 'chat' ? 'active' : '')} key={c.id}>
          <button className="conversation-link" onClick={() => openChat(c.id)} aria-current={activeId === c.id && page === 'chat' ? 'page' : undefined}><MessageSquare size={15}/><span title={c.title}>{c.title}</span></button>
          <div className="item-menu"><button aria-label={i.renameConversation} title={i.renameConversation} onClick={() => openRename(c)}><MoreHorizontal size={17}/></button><button aria-label={i.removeConversation} title={i.removeConversation} onClick={() => setModal({ type: 'delete-chat', id: c.id })}><Trash2 size={14}/></button></div>
        </div>) : <p className="empty-history">{query ? i.noResults : i.noChats}</p>}
      </nav>
      <div className="sidebar-bottom">
        <button className={'nav-action ' + (page === 'history' ? 'selected' : '')} onClick={() => {setPage('history');setNotice('');}}><History size={18}/>{lang==='ar'?'كل المحادثات':'All conversations'}</button>
        <button className={'nav-action ' + (page === 'models' ? 'selected' : '')} onClick={() => { setPage('models'); setNotice(''); }}><HardDrive size={18}/>{i.models}</button>
        <button className={'nav-action ' + (page === 'settings' ? 'selected' : '')} onClick={() => { setPage('settings'); setNotice(''); }}><Settings size={18}/>{i.settings}</button>
      </div>
    </aside>

    <div className="workspace">
      <header className="topbar">
        <div className="page-heading"><Menu size={17} aria-hidden="true"/><h1>{page === 'chat' ? (current?.title ?? i.header) : page === 'models' ? i.models : page === 'history' ? i.history : settingsSection==='about' ? (lang==='ar'?'حول هسّا':'About HASSA') : i.settings}</h1></div>
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
          <img className="welcome-logo" src="/hassa-logo.svg" alt="" aria-hidden="true"/><h2>{i.greeting}</h2><p>{i.greetingSub}</p>
          <div className="suggestions">{([1, 2, 3] as const).map(n => <button className="suggestion" key={n} onClick={() => void send(i[`prompt${n}`])}>{i[`idea${n}`]}<span>↗</span></button>)}</div>
        </section>}
        {isReady && current?.messages.length ? <section className="messages" aria-label={i.history}>
          {current.messages.map(m => <article className={'message ' + m.role} key={m.id}><div className="message-role">{m.role === 'user' ? (lang === 'ar' ? 'أنت' : 'You') : i.app}</div><MessageContent content={m.content}/></article>)}
          {pending && <div className="thinking" role="status"><span className="dot-pulse"/>{i.stop}<button type="button" className="btn secondary stop-generation" onClick={()=>chatAbort.current?.abort()}>{lang==='ar'?'إيقاف التوليد':'Stop generating'}</button></div>}<div ref={endRef}/>
        </section> : null}
        <div className="composer-zone">
          <div className={'composer ' + (!isReady || pending ? 'composer-disabled' : '')}><label htmlFor="chat-composer" className="sr-only">{i.input}</label><textarea id="chat-composer" ref={composerRef} rows={2} value={draft} onChange={e => setDraft(e.target.value)} placeholder={i.input} disabled={!isReady || pending} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }}/><button className="send-button" aria-label={i.send} title={i.send} disabled={!isReady || pending || !draft.trim()} onClick={() => void send()}><ArrowUp size={20}/></button></div>
          <p className="composer-footnote">{i.disclaimer}</p>
        </div>
      </main> : null}

      {page === 'models' && <main className="content-page models-page"><div className="page-intro"><h2>{i.modelsTitle}</h2><p>{i.modelsDescription}</p></div><div className="section-header"><div><h2>{i.installed}</h2><p>{i.modelHint}</p></div><button className="btn secondary" onClick={() => void refresh()}><RefreshCw size={16}/>{i.retry}</button></div>
        {!engine.connected ? <div className="state-panel compact"><WifiOff size={24}/>{i.engineMissing}</div> : models.length ? <div className="model-list">{models.map(m => <div className="model-card" key={m.name}><div className="model-details"><div className="model-icon"><HardDrive size={20}/></div><div><div className="model-name">{m.name} {m.name === activeModel && <span className="model-active"><Check size={13}/>{i.active}</span>}</div><p>{(m.size / (1024 ** 3)).toFixed(1)} GB · {i.savedLocally}</p></div></div><div className="model-actions"><button className="btn secondary" onClick={() => setPrefs(old => ({ ...old, defaultModel: m.name }))} disabled={activeModel === m.name}>{i.choose}</button><button className="btn danger-outline" onClick={() => setModal({ type: 'delete-model', name: m.name })}><Trash2 size={16}/>{i.delete}</button></div></div>)}</div> : <div className="state-panel compact"><HardDrive size={25}/>{i.installModel}</div>}
        {suggestions.length>0 && <><div className="section-header model-suggested"><div><h2>{lang==='ar'?'نماذج متاحة للتنزيل':'Available models'}</h2><p>{i.modelHint}</p></div></div>
        <div className="model-list suggested-list">{suggestions.map(name=><div className="model-card" key={name}><div className="model-details"><div className="model-icon"><HardDrive size={20}/></div><div><div className="model-name">{name}</div><p>{name.endsWith('1.7b')?(lang==='ar'?'للأجهزة الأخف':'Lighter model'):name.endsWith('8b')?(lang==='ar'?'يتطلب موارد أكبر':'Higher resource use'):(lang==='ar'?'خيار متوازن':'Balanced option')}</p></div></div><button className="btn primary" disabled={!engine.connected||Boolean(downloading)} onClick={()=>void download(name)}><Download size={16}/>{downloading===name?i.downloading:i.download}</button></div>)}</div></>}
        {downloading && <div className="download-progress" role="status" aria-live="polite"><div>{progress?.status || i.downloading} {typeof progress?.percent === 'number' ? `${progress.percent}%` : ''}</div><progress value={progress?.percent ?? undefined} max="100"/></div>}
      </main>}

      {page==='history' && <HistoryPanel language={lang} conversations={conversations} filter={query} onFilter={setQuery} open={openChat} rename={openRename} remove={c=>setModal({type:'delete-chat',id:c.id})}/>}
      {page==='settings' && <SettingsPanel prefs={prefs} models={models} engineVersion={engine.version} section={settingsSection} onSection={setSettingsSection} onLanguage={language=>setPrefs(old=>({...old,language}))} onPrefs={patch=>setPrefs(old=>({...old,...patch}))} onKeyboard={()=>setModal({type:'shortcuts'})} onClear={()=>setModal({type:'clear-history'})} onExport={exportConversations}/>}
    </div>

    {modal && <Dialog title={modal.type==='delete-model'?i.confirmDelete:modal.type==='rename-chat'?i.renameConversation:modal.type==='delete-chat'?i.removeConversation:modal.type==='clear-history'?(lang==='ar'?'حذف جميع المحادثات نهائياً؟':'Delete all conversations?'):modal.type==='shortcuts'?(lang==='ar'?'اختصارات لوحة المفاتيح':'Keyboard shortcuts'):modal.type==='export-success'?(lang==='ar'?'تم تجهيز نسخة بياناتك':'Your export is ready'):'Cancel download'} onClose={()=>setModal(null)}>
      {modal.type==='rename-chat'?<><label className="modal-field"><span>{i.rename}</span><input autoFocus value={renameDraft} onChange={e=>setRenameDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveRename();}}/></label><div className="dialog-actions"><button className="btn secondary" onClick={()=>setModal(null)}>{i.cancel}</button><button className="btn primary" onClick={saveRename} disabled={!renameDraft.trim()}>{i.save}</button></div></>:
      modal.type==='shortcuts'?<><ShortcutsPanel language={lang}/><div className="dialog-actions"><button className="btn secondary" onClick={()=>setModal(null)}>{i.close}</button></div></>:
      modal.type==='export-success'?<><p className="dialog-description">{lang==='ar'?'تم تجهيز ملف التنزيل في المتصفح. تأكّد من مكان حفظه.':'The download was prepared in your browser. Check where it was saved.'}</p><div className="dialog-actions"><button className="btn primary" onClick={()=>setModal(null)}>{i.close}</button></div></>:
      <><p className="dialog-description">{modal.type==='delete-model'?i.deleteDesc:modal.type==='clear-history'?(lang==='ar'?'رح ينحذف سجل محادثات هسّا من الجهاز نهائياً. النماذج المثبّتة ما بتتأثر.':'Your HASSA conversation history will be erased. Installed models remain.'):modal.type==='delete-chat'?(lang==='ar'?'هذه المحادثة رح تنحذف نهائياً. باقي المحادثات ما بتتأثر.':'This conversation will be permanently deleted.'):lang==='ar'?'قد تحتاج تبدأ التنزيل من جديد.':'You may need to start the download again.'}</p>
      <div className="dialog-actions"><button className="btn secondary" onClick={()=>setModal(null)}>{i.cancel}</button><button className="btn danger" onClick={()=>void confirmModalAction()}><Trash2 size={16}/>{i.delete}</button></div></>}
    </Dialog>}
  </div>;
}
