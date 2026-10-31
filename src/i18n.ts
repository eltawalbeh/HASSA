import type { Language } from './types';
export const dictionaries = {
  ar: {
    app: 'هسّا', subtitle: 'الذكاء الاصطناعي على جهازك', newChat: 'محادثة جديدة', today: 'محادثاتك', history: 'المحادثات', models: 'النماذج', settings: 'الإعدادات', search: 'ابحث في محادثاتك...', noChats: 'لا توجد محادثات بعد',
    header: 'محادثة جديدة', online: 'يعمل محلياً', offline: 'المحرك غير متصل', noModel: 'بدون نموذج', ready: 'جاهز للمحادثة',
    greeting: 'شو بتحب نعمل هسّا؟', greetingSub: 'مساعدك المحلي. محادثاتك على جهازك.',
    idea1: 'كتابة رسالة لعميل', idea2: 'أفكار لمشروع صغير', idea3: 'شرح مفهوم بالإنجليزي',
    prompt1: 'اكتب لي رسالة مهنية قصيرة لعميل', prompt2: 'اقترح أفكاراً لمشروع صغير في الأردن', prompt3: 'اشرح لي هذا المفهوم بالإنجليزي بطريقة بسيطة',
    input: 'احكي اللي ببالك...', disclaimer: 'قد يخطئ الذكاء الاصطناعي. تحقّق من المعلومات المهمة.', send: 'إرسال', stop: 'جارٍ توليد الإجابة…',
    retry: 'إعادة المحاولة', engineMissing: 'تعذّر الاتصال بمحرك Ollama المحلي. شغّل Ollama أولاً.', engineHow: 'ثبّت Ollama وشغّله على جهازك، ثم اضغط إعادة المحاولة.',
    installModel: 'لا يوجد نموذج مثبت بعد. نزّل نموذجاً لبدء المحادثة.', selectModel: 'اختر النموذج', installed: 'النماذج المثبّتة', suggested: 'نموذج مقترح', download: 'تنزيل', delete: 'حذف', active: 'الافتراضي', choose: 'استخدم', modelHint: 'تنزيل النموذج يتطلب إنترنت مرة واحدة. التشغيل بعد ذلك محلي.',
    cancel: 'إلغاء', confirmDelete: 'حذف النموذج؟', deleteDesc: 'سيُحذف هذا النموذج من Ollama على جهازك. باقي المحادثات لن تُحذف.',
    removeConversation: 'حذف المحادثة', renameConversation: 'إعادة تسمية', rename: 'اسم المحادثة', close: 'إغلاق', save: 'حفظ',
    language: 'لغة الواجهة', privacy: 'الخصوصية', privacyDesc: 'طلبات المحادثة تُرسل إلى Ollama المحلي فقط. المحادثات محفوظة على هذا الجهاز.',
    hassaIdentity: 'هوية هسّا', hassaIdentityDesc: 'مساعد أردني مبني على نموذج محلي جاهز. يرد بالعربية أو الإنجليزية، وبلهجة أردنية طبيعية عند طلبها. مش نموذج مدرّب من الصفر.',
    keyboard: 'اختصارات لوحة المفاتيح', keyboardDesc: 'Enter للإرسال، Shift+Enter لسطر جديد، Esc لإغلاق النوافذ.', appearance: 'المظهر', darkOnly: 'الوضع الداكن — معتمد للـMVP',
    modelLoadError: 'تعذر تحميل النماذج. تأكد أن Ollama يعمل.', emptyResponse: 'لم يرجع النموذج نصاً. حاول مرة أخرى.', genericError: 'حدث خطأ. حاول مجدداً.',
    loading: 'جارٍ الاتصال...', downloading: 'جارٍ التنزيل...', savedLocally: 'محفوظ على جهازك', clearSearch: 'مسح البحث', chooseModel: 'اختر نموذجاً أولاً', about: 'هسّا AI — إصدار تجريبي Desktop', noResults: 'لا توجد نتائج',
  },
  en: {
    app: 'HASSA', subtitle: 'Local AI on your device', newChat: 'New conversation', today: 'Your conversations', history: 'History', models: 'Models', settings: 'Settings', search: 'Search conversations...', noChats: 'No conversations yet',
    header: 'New conversation', online: 'Running locally', offline: 'Engine disconnected', noModel: 'No model installed', ready: 'Ready to chat',
    greeting: 'What would you like to do now?', greetingSub: 'Your local assistant. Your conversations stay on your device.',
    idea1: 'Write a client email', idea2: 'Small business ideas', idea3: 'Explain a concept',
    prompt1: 'Write a short professional email to a client', prompt2: 'Suggest small business ideas in Jordan', prompt3: 'Explain this concept in simple English',
    input: 'Type your message...', disclaimer: 'AI may make mistakes. Verify important information.', send: 'Send', stop: 'Generating response…',
    retry: 'Retry', engineMissing: 'Cannot connect to your local Ollama engine. Start Ollama first.', engineHow: 'Install and start Ollama on your device, then retry.',
    installModel: 'No models installed. Download one to begin.', selectModel: 'Choose a model', installed: 'Installed models', suggested: 'Suggested model', download: 'Download', delete: 'Delete', active: 'Default', choose: 'Use', modelHint: 'Downloading needs internet once; inference remains local afterward.',
    cancel: 'Cancel', confirmDelete: 'Delete model?', deleteDesc: 'The model will be removed from local Ollama. Your conversations will remain.',
    removeConversation: 'Delete conversation', renameConversation: 'Rename', rename: 'Conversation title', close: 'Close', save: 'Save',
    language: 'Interface language', privacy: 'Privacy', privacyDesc: 'Chats are sent only to local Ollama. Your conversation history stays on this device.',
    hassaIdentity: 'HASSA identity', hassaIdentityDesc: 'A Jordanian local-first assistant built on existing on-device models, with a natural Jordanian Arabic voice when suitable. Not a model trained from scratch.',
    keyboard: 'Keyboard shortcuts', keyboardDesc: 'Enter sends, Shift+Enter adds a line, Escape closes dialogs.', appearance: 'Appearance', darkOnly: 'Dark Mode — approved for MVP',
    modelLoadError: 'Unable to load models. Make sure Ollama is running.', emptyResponse: 'The model returned an empty response. Try again.', genericError: 'Something went wrong. Please retry.',
    loading: 'Connecting…', downloading: 'Downloading…', savedLocally: 'Stored on device', clearSearch: 'Clear search', chooseModel: 'Choose a model first', about: 'HASSA AI — Desktop preview', noResults: 'No results',
  }
} as const;
export function t(lang: Language) { return dictionaries[lang]; }
