import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Row, Slip, Total } from "@/components/Heading";
import { founders, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Why Painted For Purpose exists, how a session works, and where the student-led NGO is heading.",
  alternates: { canonical: "/about" },
};

// Plan §13: the cycle P4P ultimately seeks to establish.
const loop = [
  "Creative participation",
  "Product creation",
  "Product sales",
  "Donation + reinvestment",
  "Larger sessions",
  "Greater impact and revenue",
];

// Plan §8: growth strategy.
const growth = [
  {
    title: "Instagram and this website",
    body: "Display finished designs, promote upcoming sessions, sell the shirts, show the charitable impact, and attract future artists and customers.",
  },
  {
    title: "Campus marketing",
    body: "Promote P4P in schools, colleges and universities to raise awareness and find suitable participants.",
  },
  {
    title: "Influencer collaboration",
    body: "Local influencers may be invited to attend sessions and share the work on their own platforms.",
  },
];

// Plan §14: expected outcomes.
const outcomes = [
  "Recurring contributions to selected flood relief charities",
  "A sustainable fundraising model",
  "Meaningful community-service opportunities",
  "Recognised certificates and service hours for participants",
  "A strong public and social-media presence",
  "More T-shirts produced and sold over time",
  "Partnerships with external organisations",
  "Entrepreneurial experience for the founders",
  "A genuine addition to university applications",
];

export default function About() {
  return (
    <>
      <PageHead title="Creativity that keeps paying">
        {site.name} is a student-led NGO that supports Pakistani flood relief charities through a self-sustaining,
        creative fundraising model.
      </PageHead>

      {/* The founders' letter, on a sheet with a tear-off strip */}
      <section aria-label="A letter from the founders" className="bg-green-3 py-24 sm:py-40">
        <div className="mx-auto w-full max-w-[680px] px-0 sm:px-8">
          <article data-reveal className="on-paper bg-paper px-6 pb-12 pt-12 text-lead text-green sm:px-[60px] sm:pt-16">
            <div className="space-y-5">
              <p>To everyone who picks up a brush or a shirt,</p>
              <p>
                We started Painted For Purpose to help people affected by flooding in Pakistan, by giving money to
                established flood relief charities who already do that work well.
              </p>
              <p>
                The idea is simple. We buy plain white T-shirts and fabric paint, invite selected artists to an
                organised session, and each artist turns one shirt into something no one else owns. Then we sell
                them, on Instagram and here.
              </p>
              <p>
                <mark className="bg-gold px-1 text-green">Half of what we raise goes to two flood relief charities.
                The other half pays for the next session</mark>, so P4P can keep going without asking for new
                funding every time.
              </p>
              <p>
                Our founders are paying for the first session themselves. After that, the shirts pay for the shirts. We
                hope every artist leaves with a certificate, real service hours and something they’re proud of.
              </p>
            </div>
            <p className="mt-10 text-lead italic">{founders.names}</p>
            <p className="text-small">{founders.role}</p>
          </article>
          <div className="on-paper edge-scallop-bottom bg-paper px-6 pb-8 text-green sm:px-[60px]">
            <div className="perf text-green/40" aria-hidden />
            <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <a href={`mailto:${site.email}`} className="link">{site.email}</a>
              <Link href="/join" className="btn btn-green w-full sm:w-auto">Join a session</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Long-term vision: the cycle as a ring of tags */}
      <section aria-labelledby="vision-title" className="py-24 sm:py-40">
        <div className="wrap">
          <div className="grid gap-8 md:grid-cols-12">
            <h2 id="vision-title" data-reveal className="text-head md:col-span-6">A cycle that grows</h2>
            <p data-reveal style={{ ["--d" as string]: 1 }} className="md:col-span-5 md:col-start-8">
              The long-term vision is a charity that keeps generating funding for flood relief without depending
              entirely on outside donations. Each turn of the cycle is meant to be bigger than the last, with the
              batch growing by about ten shirts per session.
            </p>
          </div>
          <ol className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loop.map((step, i) => (
              <li
                key={step}
                data-reveal
                style={{ ["--d" as string]: i }}
                className={`flex min-h-[140px] items-end justify-between gap-4 p-6 text-green ${["bg-sky", "bg-rose", "bg-gold", "bg-paper", "bg-sky", "bg-rose"][i]}`}
              >
                <span className="font-display text-[2.5rem] uppercase leading-[0.9]">{step}</span>
                <span aria-hidden className="font-display text-[2rem] leading-none">{i < loop.length - 1 ? "→" : "↺"}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Growth strategy and outcomes */}
      <section aria-labelledby="growth-title" className="bg-paper py-24 text-green sm:py-40">
        <div className="wrap grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 id="growth-title" data-reveal className="text-head">How we’ll grow</h2>
            <ul className="mt-12 space-y-10">
              {growth.map((g, i) => (
                <li key={g.title} data-reveal style={{ ["--d" as string]: i }}>
                  <h3 className="font-display text-[2.25rem] leading-none">{g.title}</h3>
                  <p className="mt-3 max-w-[46ch]">{g.body}</p>
                </li>
              ))}
            </ul>
            <p data-reveal className="mt-12 max-w-[46ch]">
              As P4P develops, it plans to produce more shirts per session, reach more people, collaborate with
              external organisations and create further opportunities for charitable funding.
            </p>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <Slip className="bg-paper-2">
              <div data-reveal>
                <h3 className="font-serif text-body font-semibold normal-case">What we expect to achieve</h3>
                <div className="mt-2">
                  {outcomes.map((o) => <Row key={o} label={o} value="✓" />)}
                </div>
                <Total label="Creativity + community service" value="Lasting impact" />
              </div>
            </Slip>
          </div>
        </div>
      </section>
    </>
  );
}
