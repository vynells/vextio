export default function Hero() {
  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden bg-cream">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(217,166,78,0.55) 0%, rgba(193,85,58,0.25) 45%, transparent 70%)",
        }}
      />

      {/* star, cut off behind the wordmark */}
      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute h-[420px] w-[420px] md:h-[560px] md:w-[560px]"
        style={{ filter: "drop-shadow(0 0 30px rgba(217,166,78,0.35))" }}
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
          opacity="0.55"
        />
        <defs>
          <linearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D9A64E" />
            <stop offset="100%" stopColor="#C1553A" />
          </linearGradient>
        </defs>
      </svg>

      <h1 className="relative z-10 select-none text-center font-display text-[4rem] font-black uppercase tracking-[0.08em] text-brown md:text-[7.5rem]">
        <span
          style={{
            textShadow:
              "0 0 24px rgba(217,166,78,0.45), 0 0 60px rgba(217,166,78,0.22)",
          }}
        >
          Vextio
        </span>
      </h1>
    </section>
  );
}
