const items = [
  {
    title: "The heritage edit",
    sub: "Overshirt + trousers",
    bg: "bg-brown",
    className: "row-span-2 min-h-[420px]",
  },
  {
    title: "Raw texture",
    sub: "Archive series",
    bg: "bg-[#5C4A36]",
    className: "min-h-[200px]",
  },
  {
    title: "Earth tones",
    sub: "Autumn palette",
    bg: "bg-rust",
    className: "min-h-[200px]",
  },
  {
    title: "Worn in",
    sub: "Everyday pieces",
    bg: "bg-[#8A7055]",
    className: "min-h-[200px]",
  },
  {
    title: "The silhouette",
    sub: "AW24 campaign",
    bg: "bg-[#3D2E20]",
    className: "min-h-[200px]",
  },
];

export default function Lookbook() {
  return (
    <section id="lookbook" className="bg-cream px-6 py-20 md:px-10">
      <div className="mb-12 text-center">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
          Lookbook
        </p>
        <h2 className="mb-2 font-display text-[2.2rem] font-bold text-brown">
          Autumn / winter 2024
        </h2>
        <p className="text-[14px] font-light text-muted">
          Shot on location — real clothes, real light.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2">
        {items.map((item) => (
          <div
            key={item.title}
            className={`relative flex items-end overflow-hidden p-6 ${item.bg} ${item.className}`}
            style={{
              backgroundImage:
                "linear-gradient(to top, rgba(58,45,30,0.78) 0%, transparent 58%)",
            }}
          >
            <div className="relative z-10">
              <strong className="block font-display text-[15px] font-bold text-cream">
                {item.title}
              </strong>
              <span className="text-[11px] uppercase tracking-[0.12em] text-cream/65">
                {item.sub}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
