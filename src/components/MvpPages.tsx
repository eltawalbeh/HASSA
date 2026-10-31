import type { ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, Download, FileJson2, History, Info, Keyboard, Languages, MessageSquare, Search, Settings2, ShieldCheck, SlidersHorizontal, Trash2 } from 'lucide-react';
import type { AppPreferences, Conversation, Language, ModelInfo } from '../types';

export type SettingsSection = 'general' | 'intelligence' | 'privacy' | 'about';
const title = (en: boolean, arText: string, enText: string) => en ? enText : arText;
function PageHeading({heading, sub}: {heading: string; sub: string}) {
  return <div className="page-intro"><h2>{heading}</h2><p>{sub}</p></div>;
}
function Setting({icon, name, description, control}: {icon: ReactNode; name: string; description?: string; control?: ReactNode}) {
  return <div className="setting-row hassa-setting"><div className="setting-copy"><strong>{icon}{name}</strong>{description && <p>{description}</p>}</div>{control && <div className="setting-action">{control}</div>}</div>;
}
export function HistoryPanel({language,conversations,filter,onFilter,open,rename,remove}:{
  language: Language; conversations: Conversation[]; filter: string; onFilter: (v:string)=>void; open:(id:string)=>void; rename:(c:Conversation)=>void; remove:(c:Conversation)=>void;
}) {
  const en=language==='en';
  const matching=conversations.filter(c=>(c.title+' '+c.messages.map(m=>m.content).join(' ')).toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  return <main className="content-page history-page">
    <PageHeading heading={title(en,'كل محادثاتك بمكان واحد','All your conversations in one place')} sub={title(en,'ابحث محلياً في العناوين، وارجع لأي محادثة محفوظة.','Search titles and messages stored on your device.')} />
    <label className="history-search"><Search size={19}/><span className="sr-only">{title(en,'بحث في المحادثات','Search conversations')}</span><input value={filter} onChange={e=>onFilter(e.target.value)} placeholder={title(en,'ابحث عن عنوان أو كلمة...','Search by title or keyword...')} /></label>
    <div className="history-caption">{title(en,'اليوم','Conversations')} <span>{matching.length}</span></div>
    {matching.length ? <div className="history-list">{matching.map(c=><div className="history-card" key={c.id}>
      <button className="history-open" onClick={()=>open(c.id)}><span className="history-title">{c.title}</span><span className="history-preview">{c.messages.filter(m=>m.role==='assistant').at(-1)?.content.slice(0,105) ?? c.messages.at(-1)?.content.slice(0,105) ?? ''}</span><span className="history-date">{new Date(c.updatedAt).toLocaleString(en?'en-GB':'ar-JO',{dateStyle:'medium',timeStyle:'short'})}</span></button>
      <div className="history-actions"><button className="icon-button" aria-label={title(en,'إعادة تسمية المحادثة','Rename conversation')} onClick={()=>rename(c)}><Settings2 size={18}/></button><button className="icon-button" aria-label={title(en,'حذف المحادثة','Delete conversation')} onClick={()=>remove(c)}><Trash2 size={18}/></button></div>
    </div>)}</div> : <div className="history-empty"><History size={32}/><h3>{title(en,filter?'ما لقينا محادثات مطابقة.':'ما في محادثات محفوظة بعد. ',filter?'No matching conversations.':'No saved conversations yet.')}</h3><p>{title(en,'جرّب كلمة ثانية أو امسح البحث.','Try another search or clear the field.')}</p>{filter&&<button className="btn secondary" onClick={()=>onFilter('')}>{title(en,'مسح البحث','Clear search')}</button>}</div>}
  </main>;
}
export function SettingsPanel({prefs,models,engineVersion,onLanguage,onPrefs,onSection,section,onKeyboard,onClear,onExport}:{
  prefs: AppPreferences; models:ModelInfo[]; engineVersion:string|null; onLanguage:(l:Language)=>void; onPrefs:(patch:Partial<AppPreferences>)=>void; onSection:(s:SettingsSection)=>void; section:SettingsSection; onKeyboard:()=>void; onClear:()=>void; onExport:()=>void;
}) {
  const en=prefs.language==='en', chevron=en?<ChevronRight size={17}/>:<ChevronLeft size={17}/>;
  const items: Array<[SettingsSection,string,string,ReactNode]>=[
    ['general',title(en,'عام ومظهر','General & appearance'),title(en,'اللغة وشكل التطبيق','Language & appearance'),<Settings2 size={18}/>],
    ['intelligence',title(en,'الذكاء وأسلوب المحادثة','AI & response style'),title(en,'النموذج وطريقة الكلام','Model and response style'),<SlidersHorizontal size={18}/>],
    ['privacy',title(en,'الخصوصية والبيانات','Privacy & data'),title(en,'حفظ وتصدير ومسح المحادثات','Save, export, clear history'),<ShieldCheck size={18}/>],
    ['about',title(en,'حول هسّا','About HASSA'),title(en,'الإصدار والتراخيص','Version & licensing'),<Info size={18}/>]
  ];
  return <main className="content-page settings-page">
    <PageHeading heading={items.find(x=>x[0]===section)?.[1]??''} sub={section==='privacy'?title(en,'محادثاتك وملفات النماذج محلية، وإنت صاحب القرار فيها.','Your conversations and models are on your device.'):section==='intelligence'?title(en,'اضبط النموذج وطريقة كلام هسّا حسب استخدامك.','Choose your model and how HASSA replies.'):section==='about'?title(en,'هسّا — احكيها على راحتك.','HASSA — Speak your way.'):title(en,'خصّص تجربة هسّا بالطريقة اللي بتناسبك.','Customize your local assistant.')} />
    <nav className="settings-tabs" aria-label={title(en,'أقسام الإعدادات','Settings sections')}>{items.map(([id,label,,icon])=><button key={id} className={'settings-tab '+(section===id?'active':'')} aria-current={section===id?'page':undefined} onClick={()=>onSection(id)}>{icon}{label}</button>)}</nav>
    <div className="settings-list">
    {section==='general'&&<>
      <Setting icon={<Languages size={19}/>} name={title(en,'لغة التطبيق','App language')} description={title(en,'اختَر لغة القوائم والمحادثات.','Choose the interface language.')} control={<select aria-label={title(en,'لغة التطبيق','App language')} value={prefs.language} onChange={e=>onLanguage(e.target.value==='en'?'en':'ar')}><option value="ar">العربية</option><option value="en">English</option></select>} />
      <Setting icon={<Settings2 size={19}/>} name={title(en,'مظهر التطبيق','Appearance')} description={title(en,'الوضع الداكن معتمد حالياً.','Dark Mode is the current desktop design.')} control={<span className="setting-value">Dark</span>}/>
      <Setting icon={<Keyboard size={19}/>} name={title(en,'اختصارات لوحة المفاتيح','Keyboard shortcuts')} description={title(en,'تعلّم التنقل باستخدام الكيبورد.','Navigate using your keyboard.')} control={<button className="setting-link" onClick={onKeyboard}>{title(en,'عرض الاختصارات','View shortcuts')}{chevron}</button>}/>
      <div className="settings-hint"><Check size={18}/>{title(en,'التغييرات محفوظة محلياً على هذا الجهاز.','Changes are stored on this device.')}</div>
    </>}
    {section==='intelligence'&&<>
      <Setting icon={<MessageSquare size={19}/>} name={title(en,'النموذج الافتراضي','Default AI model')} description={title(en,'النموذج المستخدم عند بدء محادثة جديدة.','Model selected for new chats.')} control={<select aria-label={title(en,'النموذج الافتراضي','Default model')} value={prefs.defaultModel} disabled={!models.length} onChange={e=>onPrefs({defaultModel:e.target.value})}>{models.length?models.map(m=><option value={m.name} key={m.name}>{m.name}</option>):<option value="">{title(en,'لا يوجد نموذج','No model')}</option>}</select>}/>
      <Setting icon={<MessageSquare size={19}/>} name={title(en,'طريقة الرد','Response style')} description={title(en,'اختَر نبرة الرد بدون تغيير دقة الإجابة.','Choose a response tone.')} control={<select aria-label={title(en,'طريقة الرد','Response style')} value={prefs.replyStyle??'natural'} onChange={e=>onPrefs({replyStyle:e.target.value as AppPreferences['replyStyle']})}><option value="natural">{title(en,'أردني طبيعي','Natural')}</option><option value="formal">{title(en,'رسمي','Formal')}</option><option value="concise">{title(en,'مختصر','Concise')}</option></select>}/>
      <Setting icon={<SlidersHorizontal size={19}/>} name={title(en,'مستوى التفصيل','Level of detail')} description={title(en,'مختصر، متوازن، أو مفصّل.','Short, balanced, or detailed.')} control={<select aria-label={title(en,'مستوى التفصيل','Level of detail')} value={prefs.detailLevel??'balanced'} onChange={e=>onPrefs({detailLevel:e.target.value as AppPreferences['detailLevel']})}><option value="brief">{title(en,'مختصر','Brief')}</option><option value="balanced">{title(en,'متوازن','Balanced')}</option><option value="detailed">{title(en,'مفصّل','Detailed')}</option></select>}/>
      <div className="creativity-card"><div><strong>{title(en,'الإبداع مقابل الدقة','Creativity vs consistency')}</strong><p>{title(en,'الوسط مناسب للكتابة اليومية. لا يضمن هذا الإعداد صحة المعلومات.','The middle works well for everyday writing. This does not guarantee factual accuracy.')}</p></div><input type="range" aria-label={title(en,'الإبداع مقابل الدقة','Creativity')} min="0" max="100" step="10" value={prefs.creativity??50} onChange={e=>onPrefs({creativity:Number(e.target.value)})}/><span className="sr-only">{prefs.creativity??50}%</span></div>
    </>}
    {section==='privacy'&&<>
      <Setting icon={<ShieldCheck size={19}/>} name={title(en,'حفظ المحادثات','Conversation storage')} description={title(en,'محادثاتك محفوظة داخل بيانات التطبيق على هذا الجهاز.','Chats are stored in this app on your device.')} control={<span className="setting-value">{title(en,'محلي','Local')}</span>}/>
      <Setting icon={<History size={19}/>} name={title(en,'مجلد البيانات','Data location')} description={title(en,'التخزين الحالي داخل بيانات التطبيق، وليس مجلداً يمكنك تحديده.','Currently stored in app storage; custom folders are not supported.')} control={<span className="setting-value">Local storage</span>}/>
      <Setting icon={<FileJson2 size={19}/>} name={title(en,'تصدير البيانات','Export data')} description={title(en,'نزّل نسخة JSON من سجل المحادثات.','Download your conversations as JSON.')} control={<button className="setting-link" onClick={onExport}><Download size={17}/>{title(en,'تصدير','Export')}</button>}/>
      <Setting icon={<Trash2 size={19}/>} name={title(en,'مسح سجل المحادثات','Clear conversation history')} description={title(en,'يحذف محادثات هسّا؛ لا يحذف النماذج.','Deletes chats, not installed models.')} control={<button className="setting-link dangerous" onClick={onClear}>{title(en,'مسح السجل','Clear history')}{chevron}</button>}/>
      <div className="privacy-notice"><ShieldCheck size={22}/><div><strong>{title(en,'الاتصال بالإنترنت — بشفافية','Internet access — transparency')}</strong><p>{title(en,'تنزيل النماذج والتحديثات يحتاج إنترنت. المحادثة ترسل إلى Ollama المحلي على جهازك.','Downloading models needs internet. Chat requests go to local Ollama.')}</p></div></div>
    </>}
    {section==='about'&&<>
      <div className="about-identity"><img src="/hassa-logo.svg" alt="HASSA AI"/><h2>{title(en,'هسّا — احكيها على راحتك.','HASSA — Speak your way.')}</h2><p>{title(en,'مساعد ذكاء اصطناعي أردني مجاني، يشتغل على جهازك.','A free Jordanian local-first AI assistant.')}</p></div>
      <Setting icon={<Info size={19}/>} name={title(en,'الإصدار الحالي','Current version')} description="HASSA AI Desktop MVP" control={<span className="setting-value">0.2.0</span>}/>
      <Setting icon={<Download size={19}/>} name={title(en,'التحديثات','Updates')} description={title(en,'ميزة التحديث التلقائي غير متاحة في هذه النسخة التجريبية.','Automatic updates are not available in this preview.')} control={<span className="setting-value">{title(en,'تجريبي','Preview')}</span>}/>
      <Setting icon={<ShieldCheck size={19}/>} name={title(en,'الحقوق والرخص','Licenses')} description={title(en,'Ollama والنماذج لها رخص مستقلة. تحقق من رخصة كل نموذج قبل إعادة التوزيع.','Ollama and model licenses are separate; check before redistribution.')} control={<span className="setting-value">{title(en,'محلي','Local')}</span>}/>
      <p className="app-version">{title(en,'محرك Ollama: ','Ollama engine: ')}{engineVersion||title(en,'غير متصل','Disconnected')}</p>
    </>}
    </div>
  </main>;
}
export function ShortcutsPanel({language}:{language:Language}) {
 const en=language==='en';
 const entries=[
  ['Tab / Shift+Tab',title(en,'الانتقال بين العناصر','Move between controls')],
  ['Enter',title(en,'إرسال رسالة','Send message')],
  ['Shift+Enter',title(en,'سطر جديد في الرسالة','New line in composer')],
  ['Escape',title(en,'إغلاق النافذة','Close dialog')],
  ['Ctrl+N',title(en,'محادثة جديدة','New conversation')],
  ['Ctrl+K',title(en,'بحث في المحادثات','Search conversations')]
 ];
 return <div className="shortcut-panel"><p>{title(en,'استخدم لوحة المفاتيح للتنقل بسرعة.','Navigate quickly using your keyboard.')}</p>{entries.map(([key,value])=><div className="shortcut-row" key={key}><span>{value}</span><kbd dir="ltr">{key}</kbd></div>)}</div>;
}
