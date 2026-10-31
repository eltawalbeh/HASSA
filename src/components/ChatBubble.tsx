import { MessageContent } from './MessageContent';
import type { Language, Role } from '../types';

type Props = {
  role: Role;
  content: string;
  language: Language;
  assistantName: string;
};

/** A content-sized chat bubble; the body is allowed to grow vertically as text wraps. */
export function ChatBubble({ role, content, language, assistantName }: Props) {
  const label = role === 'user'
    ? (language === 'ar' ? 'أنت' : 'You')
    : assistantName;

  return (
    <article className={`message message-bubble ${role}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="message-role">{label}</div>
      <MessageContent content={content} />
    </article>
  );
}
