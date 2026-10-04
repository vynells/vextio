import Image from "next/image";
import Link from "next/link";

const tapeItems = [
  "Cash on delivery across Pakistan",
  "Flat Rs 300 shipping",
  "Small-batch drops",
  "Once it's gone, it's gone",
];

export default function Hero() {
  // Track holds two identical halves so the -50% marquee loop is seamless.
  const half = [...tapeItems, ...tapeItems];
  const track = [...half, ...half];

  return (
    <section className="relative flex min-h-[calc(100svh-73px)] flex-col items-center justify-center overflow-hidden bg-cream px-6 pb-36 pt-12">
      <div aria-hidden="true" className="vx-glow pointer-events-none absolute left-1/2 top-[42%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div aria-hidden="true" className="vx-halftone pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="vx-scan pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center">
        <h1 className="sr-only">Vextio</h1>

        <div className="vx-logo relative">
          <span aria-hidden="true" className="vx-split vx-split-red" />
          <span aria-hidden="true" className="vx-split vx-split-lime" />
          <Image
            src="/vextio-logo.png"
            alt="Vextio"
            width={1260}
            height={1400}
            priority
            draggable={false}
            sizes="(max-width: 640px) 80vw, 480px"
            className="vx-logo-img relative h-auto w-full select-none"
          />
        </div>

        <div className="vx-rise mt-2 flex flex-col items-center">
          <p className="vx-tag text-center text-[15px] leading-relaxed text-muted">
            Small-batch punk and Y2K pieces, shipped across Pakistan.
          </p>
          <Link href="/products" className="vx-cta mt-7">
            Shop the collection
          </Link>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="vx-tape absolute bottom-12 left-[-5%] w-[110%] -rotate-2 overflow-hidden whitespace-nowrap bg-rust py-3"
      >
        <div className="vx-tape-track inline-flex">
          {track.map((item, i) => (
            <span key={i} className="flex items-center font-display text-xl uppercase tracking-[0.03em] text-cream md:text-2xl">
              <span className="px-6">{item}</span>
              <span className="text-[0.8em] text-cream/60">✦</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .vx-glow {
          background: radial-gradient(circle, rgba(194,59,59,0.32) 0%, rgba(194,59,59,0.08) 45%, transparent 70%);
          filter: blur(40px);
        }
        .vx-halftone {
          background-image: radial-gradient(circle, rgba(237,235,230,0.16) 1.1px, transparent 1.7px);
          background-size: 9px 9px;
          -webkit-mask-image: radial-gradient(ellipse 62% 58% at 50% 44%, #000 0%, transparent 78%);
          mask-image: radial-gradient(ellipse 62% 58% at 50% 44%, #000 0%, transparent 78%);
        }
        .vx-scan {
          background: repeating-linear-gradient(to bottom, rgba(237,235,230,0.03) 0 1px, transparent 1px 3px);
        }

        .vx-logo { width: min(80vw, 46svh, 500px); animation: vx-slam 900ms cubic-bezier(0.2, 1.3, 0.3, 1) both; }
        .vx-logo-img { animation: vx-jitter 7s steps(1) 2.2s infinite; }

        .vx-split {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          mix-blend-mode: screen;
          -webkit-mask: url(/vextio-logo.png) center / contain no-repeat;
          mask: url(/vextio-logo.png) center / contain no-repeat;
        }
        .vx-split-red  { background: #ff3b3b; animation: vx-intro-r 750ms ease-out both, vx-glitch-r 7s steps(1) 2.2s infinite; }
        .vx-split-lime { background: #9CB832; animation: vx-intro-l 750ms ease-out both, vx-glitch-l 7s steps(1) 2.2s infinite; }

        .vx-tag { max-width: 44ch; text-wrap: balance; }
        .vx-rise { animation: vx-fade 600ms ease-out 650ms both; }

        .vx-cta {
          display: inline-block;
          background: #C23B3B;
          color: #EDEBE6;
          font-family: var(--font-anton), Impact, sans-serif;
          font-size: 1.25rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.85rem 2.1rem;
          box-shadow: 6px 6px 0 #9CB832;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }
        .vx-cta:hover { transform: translate(3px, 3px); box-shadow: 3px 3px 0 #9CB832; }
        .vx-cta:active { transform: translate(6px, 6px); box-shadow: 0 0 0 #9CB832; }
        .vx-cta:focus-visible { outline: 2px solid #EDEBE6; outline-offset: 5px; }

        .vx-tape { box-shadow: 0 8px 0 rgba(0,0,0,0.35); }
        .vx-tape-track { animation: vx-marquee 32s linear infinite; }

        @keyframes vx-slam {
          0%   { opacity: 0; transform: scale(1.4) rotate(-3deg); filter: blur(8px); }
          55%  { opacity: 1; transform: scale(0.96) rotate(1deg); filter: blur(0); }
          70%  { transform: scale(1.02) translateX(-7px); }
          84%  { transform: translateX(3px); }
          100% { opacity: 1; transform: none; }
        }
        @keyframes vx-intro-r { 0% { opacity: 0.9; transform: translate(-18px, 4px); } 100% { opacity: 0; transform: none; } }
        @keyframes vx-intro-l { 0% { opacity: 0.9; transform: translate(18px, -4px); } 100% { opacity: 0; transform: none; } }

        @keyframes vx-glitch-r {
          0%, 90%, 100% { opacity: 0; transform: none; clip-path: none; }
          91%   { opacity: 0.9; transform: translate(-16px, 3px); clip-path: inset(12% 0 55% 0); }
          92.5% { opacity: 0.9; transform: translate(13px, -4px); clip-path: inset(58% 0 10% 0); }
          94%   { opacity: 0.8; transform: translate(-9px, 0);  clip-path: inset(32% 0 30% 0); }
          95.5% { opacity: 0; transform: none; clip-path: none; }
        }
        @keyframes vx-glitch-l {
          0%, 90%, 100% { opacity: 0; transform: none; clip-path: none; }
          91%   { opacity: 0.85; transform: translate(16px, -3px); clip-path: inset(40% 0 25% 0); }
          92.5% { opacity: 0.85; transform: translate(-12px, 4px); clip-path: inset(5% 0 70% 0); }
          94%   { opacity: 0.7; transform: translate(9px, 1px);  clip-path: inset(65% 0 5% 0); }
          95.5% { opacity: 0; transform: none; clip-path: none; }
        }
        @keyframes vx-jitter {
          0%, 90%, 100% { transform: none; }
          91%   { transform: translateX(6px) skewX(-6deg); }
          92.5% { transform: translateX(-7px); }
          94%   { transform: translateX(4px) skewX(4deg); }
          95.5% { transform: none; }
        }
        @keyframes vx-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes vx-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        @media (prefers-reduced-motion: reduce) {
          .vx-logo, .vx-logo-img, .vx-split, .vx-rise, .vx-tape-track { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
