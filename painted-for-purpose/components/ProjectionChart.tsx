import { donationShare, num, projection } from "@/lib/site";

// Projected revenue per session (plan §11), each bar split into its donated half and its other half.
export default function ProjectionChart() {
  const max = Math.max(...projection.map((p) => p.revenue));
  return (
    <figure className="w-full">
      <div className="flex h-[360px] items-end gap-3 sm:h-[440px] sm:gap-6" role="img"
        aria-label={`Projected revenue: ${projection.map((p) => `${p.name} PKR ${num(p.revenue)}`).join(", ")}. Half of each goes to flood relief.`}>
        {projection.map((p, i) => {
          const h = (p.revenue / max) * 100;
          return (
            <div key={p.session} className="flex h-full flex-1 flex-col justify-end">
              <p className="tnum mb-2 font-display text-[1.75rem] leading-none sm:text-[2.5rem]">{num(p.revenue / 1000)}k</p>
              <div data-reveal style={{ ["--d" as string]: i, height: `${h}%` }} className="flex flex-col">
                <div className="flex-1 bg-paper-2" />
                <div className="bg-gold" style={{ height: `${donationShare * 100}%` }} />
              </div>
              <p className="mt-3 font-display text-[1.5rem] leading-none">{p.session}</p>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-small">
        <span className="flex items-center gap-2"><span aria-hidden className="h-4 w-4 bg-gold" /> Flood relief (50%)</span>
        <span className="flex items-center gap-2"><span aria-hidden className="h-4 w-4 bg-paper-2" /> Reinvestment and running costs (50%)</span>
        <span>Projected revenue in PKR thousands, from the P4P plan.</span>
      </figcaption>
    </figure>
  );
}
