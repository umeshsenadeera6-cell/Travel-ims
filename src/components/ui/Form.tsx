import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cx } from '@/utils/format';

export function Field({ label, required, error, hint, children, className }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input({ className, invalid, ...rest }, ref) {
  return <input ref={ref} className={cx('input', invalid && 'border-red-400 focus:border-red-500 focus:ring-red-100', className)} {...rest} />;
});

export function Select({ options, placeholder, className, invalid, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { options: ReadonlyArray<string | { value: string; label: string }>; placeholder?: string; invalid?: boolean }) {
  return (
    <select className={cx('input pr-8', invalid && 'border-red-400', className)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx('input min-h-[88px] resize-y', className)} {...rest} />;
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={cx('flex h-10 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm', disabled && 'opacity-60')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx('relative h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-slate-300')}
      >
        <span className={cx('absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0.5')} />
      </button>
      <span className="text-slate-700">{label}</span>
    </label>
  );
}

export function ChipSelect({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? value.filter((x) => x !== o) : [...value, o])}
            className={cx('rounded-full border px-2.5 py-1 text-xs font-medium transition-colors', active ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700')}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function FormSection({ title, description, icon, children }: { title: string; description?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
        {icon && <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>}
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </header>
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}
