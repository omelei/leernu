import { brand } from '@/config/brand';

/**
 * The mark: a globe with a meridian, drawn in the current text colour so it
 * inherits whatever surface it sits on and never needs a colour of its own.
 */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-hidden="true"
      focusable="false"
      className="text-primary"
    >
      <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="3" />
      <ellipse cx="20" cy="20" rx="7.5" ry="17" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M4 14.5h32M4 25.5h32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <div>
        <p className="text-2xl font-extrabold text-ink-900">{brand.name}</p>
        <p className="text-base text-ink-500">{brand.tagline}</p>
      </div>
    </div>
  );
}
