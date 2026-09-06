const items = [
  "Heritage fabrics",
  "Handcrafted pieces",
  "Timeless design",
  "Vextio studio",
  "Autumn collection 2024",
  "Small batch production",
];

export default function Marquee() {
  const doubled = [...items, ...items];

  return (
    <div
      className="overflow-hidden whitespace-nowrap bg-rust py-3"
      aria-hidden="true"
    >
      <div className="inline-flex animate-marquee">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center px-10">
            <span className="text-[12px] font-medium uppercase tracking-[0.22em] text-cream">
              {item}
            </span>
            <span className="pl-10 text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
