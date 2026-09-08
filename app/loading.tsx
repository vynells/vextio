export default function Loading() {
  const letters = ["V", "E", "X", "T", "I", "O"];

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-cream">
      <div className="flex font-display text-[1.6rem] font-black uppercase tracking-[0.15em] text-brown">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="vextio-loading-letter"
            style={{ animationDelay: `${i * 0.18}s` }}
          >
            {letter}
          </span>
        ))}
      </div>

      <style>{`
        .vextio-loading-letter {
          opacity: 0.15;
          animation: vextioLetterGlow 1.6s ease-in-out infinite;
        }

        @keyframes vextioLetterGlow {
          0%, 100% {
            opacity: 0.15;
            text-shadow: none;
          }
          20% {
            opacity: 1;
            text-shadow: 0 0 12px rgba(217,166,78,0.6), 0 0 24px rgba(217,166,78,0.3);
          }
          40% {
            opacity: 0.15;
            text-shadow: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .vextio-loading-letter {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
