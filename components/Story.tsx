const stats = [
  { value: "100%", label: "Natural fabrics" },
  { value: "Small", label: "Batch only" },
  { value: "Local", label: "Production" },
];

export default function Story() {
  return (
    <section id="story" className="grid grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center bg-tan p-10 md:p-16">
        <div className="flex aspect-[3/4] w-full max-w-[340px] items-end bg-brown p-6">
          <p className="font-display text-2xl italic leading-tight text-cream">
            Worn
            <br />
            with
            <br />
            intent.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-16 md:px-14">
        <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
          The story
        </p>
        <h2 className="mb-6 font-display text-[2rem] font-bold leading-tight text-brown md:text-[3rem]">
          Clothes that carry a memory.
        </h2>
        <p className="mb-4 max-w-[420px] text-[15px] font-light leading-[1.8] text-muted">
          Vextio started with one obsession: the way old garments feel. That
          worn-in weight, the faded colour, the stitching that&apos;s been
          through something. We design new pieces that feel like they&apos;ve
          already lived a life.
        </p>
        <p className="mb-6 max-w-[420px] text-[15px] font-light leading-[1.8] text-muted">
          Every silhouette is researched. Every fabric sourced with intent.
          Small batches only — so nothing gets wasted, nothing gets
          forgotten.
        </p>
        <div className="flex flex-wrap gap-10">
          {stats.map((s) => (
            <div key={s.label}>
              <strong className="block font-display text-[2rem] text-brown">
                {s.value}
              </strong>
              <span className="text-[11px] uppercase tracking-[0.15em] text-muted">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
