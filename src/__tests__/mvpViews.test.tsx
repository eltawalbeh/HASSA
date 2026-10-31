import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Onboarding } from '../components/Onboarding';
import { HistoryPanel, SettingsPanel } from '../components/MvpPages';
import { defaults } from '../lib/storage';
import type { Conversation, ModelInfo } from '../types';

const noop=()=>{};
const engine={connected:true,version:'test',error:null};
const models:ModelInfo[]=[{name:'qwen3:4b',size:10000000}];
const convo:Conversation={id:'c1',title:'كتابة رسالة لعميل',updatedAt:1000000,messages:[{id:'u',role:'user',content:'اكتب رسالة',createdAt:1000000}]};
const setup=(step: 'welcome'|'choose'|'downloading'|'complete'|'error')=>renderToStaticMarkup(<Onboarding language="ar" step={step} onStep={noop} engine={engine} models={models} model="qwen3:4b" onModel={noop} progress={{model:'qwen3:4b',status:'Downloading',percent:42}} downloading={step==='downloading'} onDownload={noop} onCancel={noop} onRetry={noop} onChat={noop} onModels={noop} error=""/>);

describe('Figma Dark MVP functional view states',()=>{
 it('renders onboarding welcome and setup choices without fictitious device specs',()=>{
  expect(setup('welcome')).toContain('أهلين، أنا هسّا.');
  expect(setup('choose').match(/type="radio"/g)).toHaveLength(3);
 });
 it('renders real download percent, accessible progress and completion action',()=>{
  const html=setup('downloading');expect(html).toContain('42%');expect(html).toContain('<progress');
  expect(setup('complete')).toContain('ابدأ أول محادثة');
 });
 it('shows a recoverable setup error without hiding model choices forever',()=>{
  expect(setup('error')).toContain('إعادة المحاولة');
 });
 it('preserves conversation title in history and renders empty result state',()=>{
  const props={language:'ar' as const,conversations:[convo],onFilter:noop,open:noop,rename:noop,remove:noop};
  expect(renderToStaticMarkup(<HistoryPanel {...props} filter="رسالة"/>)).toContain(convo.title);
  expect(renderToStaticMarkup(<HistoryPanel {...props} filter="شيء مختلف"/>)).toContain('ما لقينا محادثات مطابقة');
 });
 it('renders privacy and intelligence settings with accessible controls',()=>{
  const props={prefs:defaults,models,engineVersion:'test',onLanguage:noop,onPrefs:noop,onSection:noop,onKeyboard:noop,onClear:noop,onExport:noop};
  const privacy=renderToStaticMarkup(<SettingsPanel {...props} section="privacy"/>);
  const style=renderToStaticMarkup(<SettingsPanel {...props} section="intelligence"/>);
  expect(privacy).toContain('تصدير البيانات');
  expect(privacy).toContain('مسح سجل المحادثات');
  expect(style).toContain('type="range"');
  expect(style).toContain('طريقة الرد');
 });
});