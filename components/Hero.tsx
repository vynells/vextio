"use client";

import Image from "next/image";
import FadeIn from "./FadeIn";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-6">
      <FadeIn delay={0} className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2">
        <div
          className="h-full w-full rounded-full opacity-[0.14] blur-[130px]"
          style={{
            background:
              "radial-gradient(circle, rgba(156,184,50,0.5) 0%, rgba(194,59,59,0.3) 45%, transparent 70%)",
          }}
        />
      </FadeIn>

      <div className="relative z-10 flex flex-col items-center">
        <h1 className="sr-only">Vextio</h1>
        <Image
          src="/vextio-logo.png"
          alt="Vextio"
          width={1260}
          height={1400}
          priority
          sizes="(max-width: 768px) 80vw, 560px"
          className="h-auto w-[78vw] max-w-[340px] select-none sm:max-w-[440px] md:max-w-[520px] lg:max-w-[580px]"
          style={{
            filter: "drop-shadow(0 0 24px rgba(194,59,59,0.18))",
            animation: "vextio-hero-in 900ms cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
          draggable={false}
        />
      </div>

      <style>{`
        @keyframes vextio-hero-in {
          0% {
            opacity: 0;
            transform: translateY(28px) scale(0.94);
            filter: blur(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        @keyframes vextio-spin-in {
          0% {
            opacity: 0;
            transform: rotate(-8deg) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }
        }
      `}</style>
    </section>
  );
}
