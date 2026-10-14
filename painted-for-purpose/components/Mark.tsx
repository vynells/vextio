// The P4P mark: a swing tag split down the middle — half gold for flood relief,
// half paper for the next session. The monogram sits across both halves.
export default function Mark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 80" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <clipPath id="p4p-tag">
          <path d="M14 0H50L64 14V80H0V14Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#p4p-tag)">
        <rect width="32" height="80" fill="#f4d96c" />
        <rect x="32" width="32" height="80" fill="#f6eedb" />
      </g>
      <circle cx="32" cy="13" r="5" fill="#133621" />
      <text x="32" y="62" textAnchor="middle" fontFamily="var(--font-display), Impact, sans-serif" fontSize="34" fill="#133621" letterSpacing="-0.5">P4P</text>
    </svg>
  );
}
