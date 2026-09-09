"use client";

import EditableText from "./EditableText";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-6">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.14] blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(156,184,50,0.5) 0%, rgba(194,59,59,0.3) 45%, transparent 70%)",
        }}
      />

      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute h-[480px] w-[480px] md:h-[680px] md:w-[680px]"
        style={{ filter: "drop-shadow(0 0 16px rgba(156,184,50,0.15))" }}
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
          strokeWidth="1.2"
          opacity="0.4"
        />
        <defs>
          <linearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9CB832" />
            <stop offset="100%" stopColor="#C23B3B" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-10 flex flex-col items-center">
        <h1
          className="select-none text-center font-logo text-[5.5rem] uppercase leading-none tracking-[0.01em] text-brown sm:text-[7.5rem] md:text-[10rem] lg:text-[12rem]"
          style={{
            textShadow: "0 0 20px rgba(156,184,50,0.18)",
          }}
        >
          <EditableText contentKey="hero_heading" defaultValue="Vextio" as="span" />
        </h1>
      </div>
    </section>
  );
}
