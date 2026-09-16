export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <img
      src="/logo-icon.png"
      alt="Serendib Travel & Tours"
      className={`object-contain ${className}`}
    />
  );
}

export function BrandLockup({ light, className = 'h-10' }: { light?: boolean; className?: string }) {
  return (
    <div className="flex items-center">
      <img
        src={light ? '/logo-white-text.png' : '/logo.png'}
        alt="Serendib Travel & Tours"
        className={`w-auto object-contain ${className}`}
      />
    </div>
  );
}

