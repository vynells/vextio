import Image from "next/image";

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

      <div className="relative z-10 h-[280px] w-[280px] md:h-[420px] md:w-[420px]">
        <Image
          src="https://www.trybloom.ai/img/1bc30ab0-6f99-4a14-a549-92d1796975fa"
          alt="Vextio"
          fill
          sizes="(max-width: 768px) 280px, 420px"
          className="object-contain"
          priority
        />
      </div>
    </section>
  );
}
