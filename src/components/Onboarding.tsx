import { AlertTriangle, Check, CheckCircle2, Cpu, Download, HardDrive, RefreshCw, ShieldCheck } from 'lucide-react';
import type { EngineStatus, Language, ModelInfo, PullProgress } from '../types';
export type SetupStep = 'welcome' | 'device' | 'choose' | 'downloading' | 'complete' | 'error';
const options = ['qwen3:1.7b', 'qwen3:4b', 'qwen3:8b'];
export function Onboarding({language, step, onStep, engine, models, model, onModel, progress, downloading, onDownload, onCancel, onRetry, onChat, onModels, error}:{
  language: Language; step: SetupStep; onStep: (value:SetupStep)=>void; engine:EngineStatus; models:ModelInfo[];
  model:string; onModel:(model:string)=>void; progress:PullProgress|null; downloading:boolean; onDownload:()=>void; onCancel:()=>void; onRetry:()=>void; onChat:()=>void; onModels:()=>void; error:string;
}) {
 const en = language === 'en', t=(ar:string,english:string)=>en?english:ar;
 const headings:Record<SetupStep,[string,string]>={
  welcome:[t('أهلين، أنا هسّا.','Hello, I’m HASSA.'),t('مساعدك الأردني المحلي. بدون حساب أو اشتراك.','Your Jordanian on-device AI assistant. No account needed.')],
  device:[t('خلّينا نختار المناسب لجهازك.','Choose a model for your device.'),t('فحص مواصفات الجهاز غير متاح بعد؛ الاختيار يدوي.','Automatic hardware detection is not yet available; choose manually.')],
  choose:[t('اختَر نموذجك المحلي.','Choose your local model.'),t('نزّل النموذج مرة واحدة، ثم استخدمه محلياً.','Download once; chat locally afterward.')],
  downloading:[t('هسّا بجهّز حاله على جهازك.','Preparing HASSA on your device.'),t('خلّي التطبيق مفتوح لحد انتهاء التنزيل.','Keep the app open until download completes.')],
  complete:[t('مبروك! هسّا صار جاهز.','HASSA is ready!'),t('بتقدر تبدأ أول محادثة.','Start your first conversation.')],
  error:[t('واجهتنا مشكلة بالتنزيل.','Download or setup failed.'),t('محادثاتك المحفوظة ما تأثرت.','Your existing conversations are unaffected.')]
 };
 return <main className="onboarding-page">
  <aside className="onboarding-sidebar"><img src="/hassa-logo.svg" alt="HASSA AI"/><div className="onboarding-steps">
    {[t('أهلاً بهسّا','Welcome'),t('اختيار النموذج','Choose model'),t('أول محادثة','First conversation')].map((name,n)=><div className={'onboarding-step '+((step==='complete'||n===0||n===1&&step!=='welcome')?'active':'')} key={name}><span>{n+1}</span>{name}</div>)}
  </div><p><ShieldCheck size={18}/>{t('محادثاتك على جهازك.','Chats stay on this device.')}</p></aside>
  <section className="onboarding-body"><div className="onboarding-top">{t('إعداد هسّا • Desktop','HASSA Setup • Desktop')}</div>
   <div className="onboarding-main">
    {step==='welcome'&&<img className="onboarding-logo" src="/hassa-logo.svg" alt=""/>}
    <h1>{headings[step][0]}</h1><p>{headings[step][1]}</p>
    {step==='welcome'&&<div className="onboarding-panel"><ShieldCheck size={25}/>{t('مجاني، محلي، وأنت صاحب القرار.','Free, on-device, under your control.')}</div>}
    {step==='device'&&<div className="onboarding-panel"><Cpu size={25}/>{t('Qwen3 4B خيار متوسط، والأداء يعتمد على مواصفات الجهاز الفعلية.','Qwen3 4B is a balanced choice; actual performance depends on your device.')}</div>}
    {step==='choose'&&<div className="onboarding-choices">{options.map(name=><label key={name} className={'onboarding-option '+(model===name?'selected':'')}><input type="radio" name="onboarding-model" value={name} checked={model===name} onChange={()=>onModel(name)}/><span><strong>{name}</strong><small>{name.endsWith('1.7b')?t('أخف على الجهاز','Lighter'):name.endsWith('8b')?t('يحتاج موارد أكثر','Higher resource use'):t('متوازن','Balanced')}</small></span>{model===name&&<Check size={18}/>}</label>)}</div>}
    {step==='downloading'&&<div className="onboarding-panel download"><Download size={25}/><strong>{model}</strong><span>{progress?.status||t('جارٍ التنزيل...','Downloading...')}</span><progress max="100" value={progress?.percent}/><b>{typeof progress?.percent==='number'?String(progress.percent)+'%':''}</b></div>}
    {step==='complete'&&<div className="onboarding-panel success"><CheckCircle2 size={30}/><strong>{t('التهيئة مكتملة','Setup completed')}</strong><small>{models.map(m=>m.name).join(' • ')||model}</small></div>}
    {step==='error'&&<div className="onboarding-panel error"><AlertTriangle size={28}/><strong>{t('تعذر إكمال الإعداد','Could not finish setup')}</strong><p>{error||engine.error||t('تأكد إن المحرك المحلي شغّال.','Check local Ollama.')}</p></div>}
    <div className="onboarding-actions">
    {step==='welcome'&&<button className="btn primary" onClick={()=>onStep('device')}>{t('يلا نبدأ','Get started')}</button>}
    {step==='device'&&<><button className="btn secondary" onClick={()=>onStep('welcome')}>{t('رجوع','Back')}</button><button className="btn primary" onClick={()=>onStep('choose')}>{t('اختيار النموذج','Choose model')}</button></>}
    {step==='choose'&&<><button className="btn secondary" onClick={()=>onStep('device')}>{t('رجوع','Back')}</button><button className="btn primary" onClick={onDownload} disabled={!engine.connected||downloading}><Download size={17}/>{t('تنزيل النموذج','Download')}</button></>}
    {step==='downloading'&&<button className="btn secondary" onClick={onCancel}>{t('إلغاء التنزيل','Cancel download')}</button>}
    {step==='complete'&&<><button className="btn secondary" onClick={onModels}>{t('إدارة النماذج','Manage models')}</button><button className="btn primary" onClick={onChat}>{t('ابدأ أول محادثة','Start chatting')}</button></>}
    {step==='error'&&<><button className="btn secondary" onClick={()=>onStep('choose')}>{t('نموذج آخر','Another model')}</button><button className="btn primary" onClick={onRetry}><RefreshCw size={17}/>{t('إعادة المحاولة','Retry')}</button></>}
    </div>
   </div>
   <p className="onboarding-note"><HardDrive size={16}/>{t('بيانات النماذج على جهازك. لا يوجد فحص عتاد تلقائي في هذه النسخة.','Models stay on your device. Automated hardware check is not available.')}</p>
  </section>
 </main>;
}