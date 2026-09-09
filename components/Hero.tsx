"use client";

import EditableText from "./EditableText";

export default function Hero() {
  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden bg-cream">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, rgba(196,255,0,0.4) 0%, rgba(255,61,61,0.25) 45%, transparent 70%)",
        }}
      />

      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute h-[420px] w-[420px] md:h-[560px] md:w-[560px]"
        style={{ filter: "drop-shadow(0 0 26px rgba(196,255,0,0.3))" }}
      >
        <path
          d="M100 4
             L118 78
             L194 82
             L128 118
             L152 190
             L100 144
             L48 190
             L72 118
             L6 82
             L82 78
             Z"
          fill="none"
          stroke="url(#starGrad)"
          strokeWidth="1.4"
          opacity="0.6"
        />
        <defs>
          <linearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C4FF00" />
            <stop offset="100%" stopColor="#FF3D3D" />
          </linearGradient>
        </defs>
      </svg>

      <h1
        className="relative z-10 select-none text-center font-display text-[4rem] font-black uppercase tracking-[0.08em] text-brown md:text-[7.5rem]"
        style={{
          textShadow:
            "0 0 20px rgba(196,255,0,0.35), 0 0 50px rgba(255,61,61,0.2)",
        }}
      >
        <EditableText contentKey="hero_heading" defaultValue="Vextio" as="span" />
      </h1>
    </section>
  );
}
