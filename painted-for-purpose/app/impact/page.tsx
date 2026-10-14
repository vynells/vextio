import type { Metadata } from "next";
import { PageHead, Row, Slip, Total } from "@/components/Heading";
import ProjectionChart from "@/components/ProjectionChart";
import SwingTag from "@/components/SwingTag";
import { charities, donationShare, num, pkr, projection, totalDonations } from "@/lib/site";

export const metadata: Metadata = {
  title: "Impact",
  description: "P4P's financial model: half of every session's revenue to flood relief, half reinvested, with projections for the first four sessions.",
  alternates: { canonical: "/impact" },
};

export default function Impact() {
  return (
    <>
      <PageHead title="Where the money goes">
        Every rupee from every shirt follows one published rule. Here is the model, the plan’s projections, and how
        the reinvestment share is meant to shrink as P4P grows.
      </PageHead>

      {/* The total and its receipt */}
      <section aria-labelledby="total-title" className="bg-gold py-24 text-green sm:py-36">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="flex flex-col lg:col-span-6">
            <h2 id="total-title" data-reveal className="text-head">Projected for relief</h2>
            <p data-reveal style={{ ["--d" as string]: 1 }} className="mt-6 max-w-[40ch]">
              Across the first four sessions, if the plan’s revenue projections hold. These are targets, not results.
            </p>
            <div className="mt-14 lg:mt-auto">
              <p data-reveal className="tnum font-display text-giant">{num(totalDonations / 1000)}k</p>
              <p data-reveal style={{ ["--d" as string]: 1 }} className="mt-4 text-lead">
                {pkr(totalDonations)} to two flood relief charities, sessions 1 to 4
              </p>
            </div>
          </div>
          <Slip className="w-full max-w-[460px] lg:col-span-5 lg:col-start-8">
            <div data-reveal>
              {projection.map((p) => (
                <div key={p.session} className="mt-6 first:mt-0">
                  <h3 className="font-serif text-body font-semibold normal-case">{p.name}</h3>
                  <Row label="Projected revenue" value={num(p.revenue)} />
                  <Row label="Expenses" value="To be determined" />
                  <Row label="Donated (50%)" value={num(p.revenue * donationShare)} strong />
                </div>
              ))}
              <Total label="Projected donations, PKR" value={num(totalDonations)} />
            </div>
          </Slip>
        </div>
      </section>

      {/* Projection chart */}
      <section aria-labelledby="chart-title" className="py-24 sm:py-36">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="chart-title" data-reveal className="text-head">Four sessions</h2>
            <p data-reveal style={{ ["--d" as string]: 1 }} className="mt-6">
              The plan starts from about {pkr(projection[0].revenue)} in Session 1 (a range of PKR 30,000–34,000) and
              grows the batch by roughly ten shirts each time. Actual figures will depend on shirts produced, material
              costs, prices, participation and demand.
            </p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6"><ProjectionChart /></div>
        </div>
      </section>

      {/* Reinvestment roadmap as folders */}
      <section aria-labelledby="roadmap-title" className="bg-green-3 py-24 sm:py-36">
        <div className="wrap">
          <div className="grid gap-8 md:grid-cols-12">
            <h2 id="roadmap-title" data-reveal className="text-head md:col-span-6">Less reinvested, over time</h2>
            <p data-reveal style={{ ["--d" as string]: 1 }} className="md:col-span-5 md:col-start-8">
              The founders fund the launch. After that, the share of funds needed to run the next session is meant to
              fall as P4P becomes established, until it runs on its own revenue while its charitable contribution
              continues.
            </p>
          </div>
          <ol className="mt-16 text-green">
            {[{ session: "Launch", name: "Launch", reinvest: "Initial founder investment" }, ...projection].map((p, i) => (
              <li key={p.session} data-reveal style={{ ["--d" as string]: i }} className={i ? "-mt-2" : ""}>
                <span className={`tab relative block w-fit px-7 pt-2 font-display text-[1.375rem] uppercase leading-[1.5rem] ${["bg-paper", "bg-sky", "bg-rose", "bg-gold", "bg-paper-2"][i]}`} style={{ marginLeft: `${i * 9}%` }}>
                  {p.name}
                </span>
                <span className={`flex min-h-[76px] items-center justify-between gap-4 px-6 py-3 sm:px-10 ${["bg-paper", "bg-sky", "bg-rose", "bg-gold", "bg-paper-2"][i]}`}>
                  <span className="text-lead">{p.reinvest}</span>
                  {"revenue" in p && <span className="tnum hidden text-small sm:inline">~{p.shirts} shirts</span>}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-[60ch] text-small text-gold-soft">
            The plan keeps donations at 50% in every session. Exactly how the reinvestment percentages apply alongside
            that split is still being finalised by the team.
          </p>
        </div>
      </section>

      {/* One shirt */}
      <section aria-labelledby="one-title" className="bg-rose py-24 text-green sm:py-36">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 id="one-title" data-reveal className="text-head">Follow one shirt</h2>
            <p data-reveal style={{ ["--d" as string]: 1 }} className="mt-6 max-w-[42ch]">
              Move the sliders to see how a session’s sales divide. The relief half is shared between two selected
              charities:
            </p>
            <ul className="mt-6 space-y-3">
              {charities.map((c) => (
                <li key={c.name} data-reveal className="text-lead">
                  {c.url ? <a className="link" href={c.url}>{c.name}</a> : c.name}
                  <span className="block text-small">{c.note}</span>
                </li>
              ))}
            </ul>
            <p data-reveal className="mt-8 max-w-[42ch]">
              The other half buys the next batch of plain white tees, fabric paint, brushes and supplies, and covers
              session costs.
            </p>
          </div>
          <div data-reveal className="w-full max-w-[480px] lg:col-span-5 lg:col-start-8"><SwingTag /></div>
        </div>
      </section>
    </>
  );
}
