// Decorative paint blob. Purely visual.
export default function Splash({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={`pointer-events-none absolute ${className}`} aria-hidden>
      <path
        fill={color}
        d="M100 18c18 0 22 20 38 24s34-6 40 10-12 26-8 42 24 26 12 40-30 2-42 12-10 36-30 36-20-24-36-30-34 6-42-10 10-28 6-44S12 74 22 60s30-2 42-12 18-30 36-30z"
      />
      <circle cx="182" cy="20" r="7" fill={color} />
      <circle cx="16" cy="170" r="5" fill={color} />
    </svg>
  );
}
