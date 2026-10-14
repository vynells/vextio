import type { Metadata } from "next";
import { PageHead, Row, Slip, Total } from "@/components/Heading";
import { nextSession, projection, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Join a session",
  description: "Apply to paint with Painted For Purpose. Selected artists earn certificates and approved community-service hours.",
  alternates: { canonical: "/join" },
};

// Plan §4: participant incentives.
const rewards = [
  { t: "Charity-approved certificate", b: "A certificate approved by a selected charity, recognising your contribution." },
  {
    t: "Signed certificate",
    b: "Signed by the administration of the funded charities and a prominent community-service government official, subject to obtaining approval.",
  },
  { t: "Approved service hours", b: "Formally approved community-service hours: documented evidence of your involvement." },
];

export default function Join() {
  return (
    <>
      <PageHead title="Paint with us">
        Selected artists spend a session turning a plain white T-shirt into something worth buying, and every sale
        funds flood relief.
      </PageHead>

      {/* Who can apply + how selection works, as a slip */}
      <section aria-labelledby="who-title" className="bg-sky py-24 text-green sm:py-36">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="who-title" data-reveal className="text-head">Who can apply</h2>
            <p data-reveal style={{ ["--d" as string]: 1 }} className="mt-6 max-w-[38ch]">
              Students and other suitable participants with previous artistic experience. The shirts are sold, so they
              need to be good. Applicants without artistic experience won’t be selected for now.
            </p>
            <p data-reveal style={{ ["--d" as string]: 2 }} className="mt-6 max-w-[38ch]">
              The selection keeps every shirt at a standard fit for sale, and keeps sessions a manageable size.
            </p>
          </div>
          <Slip className="w-full max-w-[500px] lg:col-span-6 lg:col-start-7">
            <div data-reveal>
              <h3 className="font-serif text-body font-semibold normal-case">How selection works</h3>
              <Row label="Fill in the Google Form" value="online" />
              <Row label="Tell us about your creative ability" value="in the form" />
              <Row label="Share your previous artistic experience" value="required" />
              <Row label="The strongest applicants are chosen" value={`~10–20 for ${nextSession.label}`} />
              <h3 className="mt-7 font-serif text-body font-semibold normal-case">On the day</h3>
              <Row label="An organised session at an open venue" value={nextSession.date} />
              <Row label="Fabric paints, brushes, supplies" value="provided" />
              <Row label="You customise one white T-shirt" value="yours to design" />
              <Total label={`Session 1 target`} value={`~${projection[0].shirts} shirts`} />
            </div>
          </Slip>
        </div>
      </section>

      {/* What participants get */}
      <section aria-labelledby="get-title" className="py-24 sm:py-36">
        <div className="wrap">
          <h2 id="get-title" data-reveal className="text-head max-w-[12ch]">What you take home</h2>
          <ul className="mt-14 grid gap-3 lg:grid-cols-3">
            {rewards.map((r, i) => (
              <li
                key={r.t}
                data-reveal
                style={{ ["--d" as string]: i }}
                className={`on-paper flex min-h-[300px] flex-col justify-between p-8 text-green ${["bg-gold", "bg-paper", "bg-rose"][i]}`}
              >
                <h3 className="text-[2.75rem] leading-[0.9]">{r.t}</h3>
                <p className="mt-8">{r.b}</p>
              </li>
            ))}
          </ul>
          <p data-reveal className="mt-12 max-w-[56ch] text-lead">
            Plus genuine community involvement that strengthens a university application, and the chance to put your
            art towards flood relief.
          </p>
        </div>
      </section>

      {/* The reply card */}
      <section aria-labelledby="apply-title" className="overflow-hidden bg-green-3 pt-24 sm:pt-36">
        <div className="wrap grid items-end gap-12 md:grid-cols-12">
          <p data-reveal className="max-w-[30ch] text-lead md:col-span-4 md:pb-24">
            {nextSession.applicationsOpen ? "Applications are open." : "Applications are closed for now."} It takes a
            few minutes, and you’ll hear back after selection.
          </p>
          <div className="mx-auto w-[92%] translate-y-16 -rotate-1 md:col-span-7 md:col-start-6 md:w-full md:rotate-2">
            <div data-reveal className="on-paper bg-paper px-6 pb-24 pt-10 text-center text-green sm:px-12">
              <h2 id="apply-title" className="text-[clamp(2.75rem,1.6rem+3vw,4.5rem)] leading-[0.9]">Apply to paint</h2>
              <p className="mx-auto mt-4 max-w-[38ch]">
                One Google Form: your details, your creative ability and your previous artistic experience.
              </p>
              <a href={site.applyForm} target="_blank" rel="noopener noreferrer" className="btn btn-green mt-8 w-full">
                Open the application form <span className="arrow" aria-hidden>↗</span>
              </a>
              <p className="mt-6 text-small">
                Questions? <a className="link" href={`mailto:${site.email}`}>{site.email}</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
