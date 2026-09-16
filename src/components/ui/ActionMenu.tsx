import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { EllipsisVertical } from 'lucide-react';
import { cx } from '@/utils/format';

export interface ActionItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
}

/** Row-level "⋮" menu rendered in a portal so it never gets clipped by table overflow. */
export function ActionMenu({ items, label = 'Actions' }: { items: ActionItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btn = useRef<HTMLButtonElement>(null);
  const visible = items.filter((i) => !i.hidden);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  if (visible.length === 0) return null;

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const r = btn.current!.getBoundingClientRect();
    const menuH = visible.length * 36 + 8;
    const top = r.bottom + menuH > window.innerHeight ? r.top - menuH - 4 : r.bottom + 4;
    setPos({ top, left: Math.max(8, r.right - 192) });
    setOpen((o) => !o);
  };

  return (
    <>
      <button ref={btn} onClick={toggle} aria-label={label} aria-haspopup="menu" aria-expanded={open} className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800">
        <EllipsisVertical className="size-4" />
      </button>
      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
            <div role="menu" className="fixed z-50 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg" style={{ top: pos.top, left: pos.left }}>
              {visible.map((item) => (
                <button
                  key={item.label}
                  role="menuitem"
                  onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(); }}
                  className={cx('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm', item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100')}
                >
                  <span className="text-slate-400 [&>svg]:size-4">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
