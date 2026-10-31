import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatBubble } from '../components/ChatBubble';

describe('chat message bubble structure', () => {
  const arabic = 'مرحبا هسّا، عرّفني عن نفسك باللهجة الأردنية، واحكيلي شو بتقدر تساعدني فيه. '.repeat(8);

  it('keeps a long Arabic user message inside a content-sized RTL bubble', () => {
    const html = renderToStaticMarkup(<ChatBubble role="user" language="ar" assistantName="هسّا" content={arabic}/>);
    expect(html).toContain('class="message message-bubble user"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('class="message-markdown"');
    expect(html).toContain('مرحبا هسّا');
  });

  it('renders mixed Arabic and English responses without flattening markdown', () => {
    const text = 'أهلين! هذا رابط طويل: https://example.org/very-long-path-without-spaces\n\n**Important**: Chat works locally.';
    const html = renderToStaticMarkup(<ChatBubble role="assistant" language="ar" assistantName="هسّا" content={text}/>);
    expect(html).toContain('class="message message-bubble assistant"');
    expect(html).toContain('class="message-markdown"');
    expect(html).toContain('<strong>Important</strong>');
  });

  it('uses LTR presentation for English user messages', () => {
    const html = renderToStaticMarkup(<ChatBubble role="user" language="en" assistantName="HASSA" content="Hello there, what can you do?"/>);
    expect(html).toContain('dir="ltr"');
    expect(html).toContain('Hello there');
  });
});
