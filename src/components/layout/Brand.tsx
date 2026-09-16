export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="10" fill="#0b6b4f" />
      <path d="M11 27c4-10 14-11 19-14-2.5 6.5-7 15.5-19 14z" fill="#fff" />
      <path d="M11 27c5-3 9-6 13-10" stroke="#0b6b4f" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="29" cy="11" r="2.2" fill="#c8962e" />
    </svg>
  );
}

export function BrandLockup({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <div className="leading-tight">
        <p className={`text-[15px] font-bold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>Serendib</p>
        <p className={`text-[10px] font-semibold tracking-[0.14em] uppercase ${light ? 'text-brand-200' : 'text-brand-600'}`}>Travel & Tours</p>
      </div>
    </div>
  );
}
