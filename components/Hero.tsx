"use client";

import EditableText from "./EditableText";

export default function Hero() {
  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden bg-cream">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(217,166,78,0.55) 0%, rgba(193,85,58,0.25) 45%, transparent 70%)",
        }}
      />

      <svg
        viewBox="0 0 400 400"
        className="pointer-events-none absolute h-[420px] w-[420px] md:h-[600px] md:w-[600px]"
      >
        <defs>
          <linearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D9A64E" />
            <stop offset="100%" stopColor="#C1553A" />
          </linearGradient>
          <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer thin star outline - draws itself in */}
        <polygon
          points="200,20 231,148 362,148 256,226 288,354 200,276 112,354 144,226 38,148 169,148"
          fill="none"
          stroke="url(#starGrad)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="vextio-star-draw"
          style={{ filter: "url(#starGlow)" }}
        />

        {/* Inner filled star - fades and pulses in after the outline draws */}
        <polygon
          points="200,70 222,162 316,162 240,218 264,310 200,254 136,310 160,218 84,162 178,162"
          fill="url(#starGrad)"
          opacity="0"
          className="vextio-star-fill"
        />

        {/* Four small accent sparkles rotating slowly around the star */}
        <g className="vextio-sparkles" style={{ transformOrigin: "200px 200px" }}>
          {[0, 90, 180, 270].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 200 200)`}>
              <path
                d="M200 8 L204 18 L214 22 L204 26 L200 36 L196 26 L186 22 L196 18 Z"
                fill="#D9A64E"
                opacity="0.7"
              />
            </g>
          ))}
        </g>
      </svg>

      <h1
        className="relative z-10 select-none text-center font-display text-[4rem] font-black uppercase tracking-[0.08em] text-brown md:text-[7.5rem] vextio-heading-in"
        style={{
          textShadow:
            "0 0 24px rgba(217,166,78,0.45), 0 0 60px rgba(217,166,78,0.22)",
        }}
      >
        <EditableText contentKey="hero_heading" defaultValue="Vextio" as="span" />
      </h1>

      <style>{`
        .vextio-star-draw {
          stroke-dasharray: 900;
          stroke-dashoffset: 900;
          animation: starDraw 1.8s ease-out forwards;
        }
        .vextio-star-fill {
          animation: starFill 1s ease-out 1.6s forwards, starPulse 3.5s ease-in-out 2.6s infinite;
        }
        .vextio-sparkles {
          animation: sparkleRotate 24s linear infinite;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .vextio-sparkles {
          animation: sparkleFadeIn 1s ease-out 2.2s forwards, sparkleRotate 30s linear 2.2s infinite;
        }
        .vextio-heading-in {
          opacity: 0;
          transform: scale(0.96);
          animation: headingIn 1s ease-out 0.3s forwards;
        }

        @keyframes starDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes starFill {
          to { opacity: 0.16; }
        }
        @keyframes starPulse {
          0%, 100% { opacity: 0.16; }
          50% { opacity: 0.3; }
        }
        @keyframes sparkleFadeIn {
          to { opacity: 1; }
        }
        @keyframes sparkleRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes headingIn {
          to { opacity: 1; transform: scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .vextio-star-draw, .vextio-star-fill, .vextio-sparkles, .vextio-heading-in {
            animation: none !important;
            opacity: 1 !important;
            stroke-dashoffset: 0 !important;
            transform: none !important;
          }
          .vextio-star-fill { opacity: 0.18 !important; }
        }
      `}</style>
    </section>
  );
}
