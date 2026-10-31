import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef=useRef(onClose);
  useEffect(()=>{closeRef.current=onClose;},[onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current; const selector = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[href],[tabindex]:not([tabindex="-1"])';
    ((root?.querySelector('.modal-field input') ?? root?.querySelector(selector)) as HTMLElement | null)?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key !== 'Tab' || !root) return;
      const elements = [...root.querySelectorAll<HTMLElement>(selector)].filter(el => el.getClientRects().length > 0);
      if (!elements.length) { e.preventDefault(); return; }
      const first = elements[0], last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handle);
    return () => { document.removeEventListener('keydown', handle); previous?.focus(); };
  }, []);
  return <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="dialog" ref={ref} role="dialog" aria-modal="true" aria-labelledby="hassa-dialog-title">
      <div className="dialog-heading"><h2 id="hassa-dialog-title">{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18}/></button></div>
      {children}
    </div>
  </div>;
}
