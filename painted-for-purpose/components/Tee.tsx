import type { Shirt } from "@/lib/site";

const TEE =
  "M70 20 L100 8 Q120 26 140 8 L170 20 L220 55 L200 95 L178 84 L178 230 L62 230 L62 84 L40 95 L20 55 Z";

function Art({ pattern, c }: { pattern: Shirt["pattern"]; c: Shirt["colors"] }) {
  switch (pattern) {
    case "waves":
      return (
        <g fill="none" strokeWidth="9" strokeLinecap="round">
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M50 ${110 + i * 26} q22 -18 44 0 t44 0 t44 0 t44 0`} stroke={c[i % 3]} />
          ))}
          <circle cx="150" cy="78" r="14" fill={c[2]} />
        </g>
      );
    case "bloom":
      return (
        <g>
          {[0, 60, 120, 180, 240, 300].map((r) => (
            <ellipse key={r} cx="120" cy="140" rx="14" ry="38" fill={c[0]} transform={`rotate(${r} 120 140) translate(0 -30)`} opacity="0.9" />
          ))}
          <circle cx="120" cy="140" r="18" fill={c[1]} />
          <path d="M120 175 Q115 205 120 225" stroke={c[2]} strokeWidth="7" fill="none" />
        </g>
      );
    case "sun":
      return (
        <g>
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x="117" y="70" width="6" height="34" rx="3" fill={c[1]} transform={`rotate(${i * 30} 120 140)`} />
          ))}
          <circle cx="120" cy="140" r="32" fill={c[0]} />
          <path d="M60 210 q30 -16 60 0 t60 0" stroke={c[2]} strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>
      );
    case "drops":
      return (
        <g>
          {[[85, 100], [140, 92], [112, 140], [160, 150], [80, 170], [128, 196]].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y} q12 18 0 26 q-12 -8 0 -26z`} fill={c[i % 3]} transform={`scale(1.25) translate(${-x * 0.2} ${-y * 0.2})`} />
          ))}
        </g>
      );
    case "stripes":
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="62" y={95 + i * 26} width="116" height="13" fill={c[i % 3]} />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={72 + i * 19.5} cy="228" r="6" fill={c[i % 3]} />
          ))}
        </g>
      );
    case "hand":
      return (
        <g>
          <path d="M95 190 L95 120 q0 -10 9 -10 q9 0 9 10 L113 100 q0 -10 9 -10 q9 0 9 10 L131 108 q0 -9 9 -9 q9 0 9 9 L149 175 q0 22 -27 22 q-20 0 -27 -7z" fill={c[0]} />
          <path d="M95 160 L80 140 q-6 -8 2 -13 q8 -5 14 4 L95 140" fill={c[0]} />
          <circle cx="122" cy="150" r="10" fill={c[1]} />
          <circle cx="70" cy="100" r="6" fill={c[2]} />
          <circle cx="170" cy="200" r="8" fill={c[2]} />
        </g>
      );
  }
}

export default function Tee({ shirt, className = "" }: { shirt: Shirt; className?: string }) {
  const clip = `tee-${shirt.id}`;
  return (
    <svg viewBox="0 0 240 240" className={className} role="img" aria-label={`${shirt.title} hand-painted T-shirt`}>
      <defs>
        <clipPath id={clip}>
          <path d={TEE} />
        </clipPath>
      </defs>
      <path d={TEE} fill="#fff" stroke="#1B1A17" strokeWidth="3" strokeLinejoin="round" />
      <g clipPath={`url(#${clip})`}>
        <Art pattern={shirt.pattern} c={shirt.colors} />
      </g>
      <path d="M100 8 Q120 26 140 8" fill="none" stroke="#1B1A17" strokeWidth="3" />
    </svg>
  );
}
