import Link from "next/link";
import { Row, Slip, Total } from "@/components/Heading";
import SwingTag from "@/components/SwingTag";
import Tee from "@/components/Tee";
import { cycle, pkr, projection, shirts, site } from "@/lib/site";

// Five folders, back to front. Each one opens a section below and lends it its colour.
const folders = [
  { href: "#how", tab: "How it works", line: "Nine steps from a blank tee to a donation", bg: "bg-sky", pos: "md:ml-[6%]" },
  { href: "#split", tab: "The 50/50 split", line: "Half to flood relief, half to the next session", bg: "bg-rose", pos: "ml-[30%] md:ml-[28%]" },
  { href: "#shirts", tab: "The shirts", line: "One artist, one shirt, never repeated", bg: "bg-gold", pos: "ml-auto md:ml-[52%]" },
  { href: "#benefits", tab: "Who benefits", line: "Flood victims, participants and founders", bg: "bg-green-3 text-gold", pos: "ml-[12%] md:ml-auto md:mr-[6%]" },
];

const benefits = [
  {
    who: "Flood victims",
    body: "Flood relief charities receive a fixed proportion of the funds generated from each session, so every batch of shirts contributes towards relief efforts in Pakistan.",
  },
  {
    who: "Participants",
    body: "Artists gain community-service experience, receive recognised certificates and service hours, and put their creative ability towards a charitable initiative.",
  },
  {
    who: "Founders",
    body: "The founders gain experience establishing and managing an NGO. Once P4P is sufficiently established, the model allows surplus revenue to provide salaries.",
  },
];

const heights = ["h-[34svh]", "h-[44svh]", "h-[38svh]", "h-[46svh]", "h-[36svh]", "h-[42svh]"];
const tilts = ["-1.5deg", "0deg", "1.25deg", "0deg", "-1deg", "0deg"];

export default function Home() {
  const s1 = projection[0];
  return (
    <>
      {/* HERO — a stack of tabbed folders */}
      <section aria-labelledby="hero-title" className="overflow-hidden pt-10 sm:pt-16">
        <div className="wrap text-center">
          <h1 id="hero-title" data-reveal className="mx-auto max-w-[11ch] text-[clamp(4.25rem,1rem+12vw,11rem)] leading-[0.84] tracking-[-0.01em] md:max-w-none">
            Paint a shirt.<br /> Fund flood relief.
          </h1>
          <p data-reveal style={{ ["--d" as string]: 1 }} className="mx-auto mt-6 max-w-[46ch] text-lead">
            Student artists in Pakistan hand-paint plain white T-shirts. Half of every sale goes to flood relief
            charities; the other half pays for the next session.
          </p>
        </div>

        <nav aria-label="On this page" className="mx-auto mt-14 w-full max-w-[1320px] text-green sm:mt-20 md:w-[86%]">
          {folders.map((f, i) => (
            <a
              key={f.href}
              href={f.href}
              data-reveal
              style={{ ["--d" as string]: i + 2 }}
              className={`group relative block ${i ? "-mt-10" : ""}`}
            >
              <span className={`tab ${f.bg} ${f.pos} relative block w-fit px-8 pt-2.5 font-display text-[1.25rem] uppercase leading-[1.5rem] sm:text-[1.375rem]`}>
                {f.tab}
              </span>
              <span className={`${f.bg} flex h-[104px] items-start justify-between gap-4 px-6 pt-3 transition-transform duration-500 ease-out group-hover:-translate-y-2 sm:px-10`}>
                <span className="text-small sm:text-body">{f.line}</span>
                <span aria-hidden className="font-display text-[1.5rem] leading-none transition-transform duration-500 ease-out group-hover:translate-x-1">↓</span>
              </span>
            </a>
          ))}

          {/* The open front folder runs off the bottom of the screen and holds the action. */}
          <div data-reveal style={{ ["--d" as string]: 6 }} className="on-paper relative -mt-10">
            <span className="tab relative ml-[44%] block w-fit bg-paper px-8 pt-2.5 font-display text-[1.25rem] uppercase leading-[1.5rem] sm:ml-[40%] sm:text-[1.375rem]">
              Start here
            </span>
            <div className="grid gap-10 bg-paper px-6 pb-0 pt-8 sm:px-10 md:grid-cols-[1fr_1.3fr] md:pt-10">
              <div className="pb-6 md:pb-14">
                <p className="max-w-[34ch]">
                  {site.short} is a student-led NGO. Every shirt is one of a kind, and every sale splits evenly between
                  two flood relief charities and the next painting session.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link href="/shop" className="btn btn-green w-full sm:w-auto">
                    Shop the shirts <span className="arrow" aria-hidden>→</span>
                  </Link>
                  <Link href="/join" className="btn w-full bg-gold text-green hover:bg-paper-2 sm:w-auto">
                    Apply to paint
                  </Link>
                </div>
              </div>
              <div className="relative -mb-6 flex items-end justify-center gap-2 sm:gap-4" aria-hidden>
                <Tee shirt={shirts[1]} label="" className="w-[34%] -rotate-6 translate-y-6" />
                <Tee shirt={shirts[0]} label="" className="w-[38%]" />
                <Tee shirt={shirts[2]} label="" className="w-[34%] rotate-6 translate-y-8" />
              </div>
            </div>
          </div>
        </nav>
      </section>

      {/* HOW IT WORKS — the cycle as an itinerary slip */}
      <section id="how" aria-labelledby="how-title" className="scroll-mt-4 bg-sky py-24 text-green sm:py-36">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="how-title" data-reveal className="text-head">How it works</h2>
            <p data-reveal style={{ ["--d" as string]: 1 }} className="mt-6 max-w-[34ch]">
              Every session follows the same cycle. Each one funds charitable work and the session after it, so P4P
              keeps going without relying on repeated outside funding.
            </p>
            <Link data-reveal style={{ ["--d" as string]: 2 }} href="/about" className="link mt-8 inline-block text-lead">
              Read the full story
            </Link>
          </div>
          <Slip className="w-full max-w-[520px] lg:col-span-6 lg:col-start-7">
            <div data-reveal>
              {cycle.map((g) => (
                <div key={g.group} className="mt-7 first:mt-0">
                  <h3 className="font-serif text-body font-semibold normal-case">{g.group}</h3>
                  <div className="mt-1">
                    {g.rows.map((r) => (
                      <Row key={r.what} label={r.what} value={r.value} />
                    ))}
                  </div>
                </div>
              ))}
              <Total label="One-of-a-kind shirts, sold" value="Relief + next session" />
            </div>
          </Slip>
        </div>
      </section>

      {/* THE SPLIT — the giant figure, and the swing tag that proves it */}
      <section id="split" aria-labelledby="split-title" className="scroll-mt-4 bg-rose py-24 text-green sm:py-36">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="flex flex-col lg:col-span-6">
            <h2 id="split-title" data-reveal className="text-head">Half of every sale</h2>
            <p data-reveal style={{ ["--d" as string]: 1 }} className="mt-6 max-w-[38ch]">
              Once a session’s shirts are sold, the money is divided down the middle. It is the same rule for every
              session, set out in P4P’s financial plan.
            </p>
            <div className="mt-14 lg:mt-auto">
              <p data-reveal className="font-display text-giant" aria-label="50 / 50">50/50</p>
              <p data-reveal style={{ ["--d" as string]: 1 }} className="mt-4 max-w-[40ch] text-lead">
                50% to two flood relief charities. 50% reinvested in tees and paint for the next session.
              </p>
              <Link href="/impact" className="link mt-6 inline-block">See the full financial model</Link>
            </div>
          </div>
          <div data-reveal style={{ ["--d" as string]: 2 }} className="w-full max-w-[480px] lg:col-span-5 lg:col-start-8">
            <SwingTag />
          </div>
        </div>
      </section>

      {/* THE SHIRTS — swing tags standing along the bottom edge */}
      <section id="shirts" aria-labelledby="shirts-title" className="scroll-mt-4 overflow-hidden bg-gold pt-24 text-green sm:pt-36">
        <div className="wrap grid gap-8 md:grid-cols-12">
          <h2 id="shirts-title" data-reveal className="text-head md:col-span-6">Never painted twice</h2>
          <div className="md:col-span-5 md:col-start-8">
            <p data-reveal style={{ ["--d" as string]: 1 }} className="text-lead">
              Each artist customises one shirt with fabric paint. No two are the same, and when one sells, it’s gone.
            </p>
            <Link data-reveal style={{ ["--d" as string]: 2 }} href="/shop" className="btn btn-green mt-8">
              Browse the shop <span className="arrow" aria-hidden>→</span>
            </Link>
          </div>
        </div>
        <ul data-reveal className="mt-12 sm:mt-20 flex snap-x snap-mandatory items-end gap-3 overflow-x-auto px-4 pb-0 sm:px-8 [scrollbar-width:none]">
          {shirts.map((s, i) => (
            <li key={s.id} className={`shrink-0 snap-start ${heights[i]} w-[62vw] sm:w-[34vw] lg:w-auto lg:flex-1`}>
              <Link
                href="/shop"
                style={{ rotate: tilts[i] }}
                className="sway on-paper relative flex h-full flex-col bg-paper px-5 pt-10"
              >
                <span className="tag-hole !bg-gold" aria-hidden />
                <Tee shirt={s} label="" className="mx-auto w-full max-w-[220px]" />
                <span className="mt-3 flex items-baseline justify-between gap-3">
                  <span className="font-medium">{s.title}</span>
                  <span className="tnum text-small">{s.sold ? "Sold" : `Size ${s.size}`}</span>
                </span>
                <span className="text-small">
                  {s.sold ? "Funded relief" : `${pkr(s.price)} · placeholder`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* WHO BENEFITS — three groups, set as a list */}
      <section id="benefits" aria-labelledby="benefits-title" className="scroll-mt-4 bg-green-3 py-24 sm:py-36">
        <div className="wrap">
          <h2 id="benefits-title" data-reveal className="text-head">Who benefits</h2>
          <ul className="mt-14 space-y-14 sm:mt-20 sm:space-y-20">
            {benefits.map((b, i) => (
              <li key={b.who} data-reveal style={{ ["--d" as string]: i }} className="grid gap-4 md:grid-cols-12 md:items-baseline">
                <h3 className="font-display text-[clamp(3rem,1.5rem+5vw,6rem)] leading-[0.9] text-paper md:col-span-6">{b.who}</h3>
                <p className="max-w-[46ch] md:col-span-5 md:col-start-8">{b.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA — a reply card lying on the page, cropped by the section edge */}
      <section aria-labelledby="cta-title" className="overflow-hidden bg-green pt-24 sm:pt-36">
        <div className="wrap grid items-end gap-12 md:grid-cols-12">
          <p data-reveal className="max-w-[30ch] text-lead md:col-span-4 md:pb-24">
            Session 1 aims for about {s1.shirts} shirts from 10–20 selected artists, and around {pkr(s1.revenue)} for
            relief and the next batch.
          </p>
          <div className="mx-auto w-[92%] translate-y-16 rotate-[-1deg] md:col-span-7 md:col-start-6 md:w-full md:rotate-2">
          <div
            data-reveal
            style={{ ["--d" as string]: 1 }}
            className="on-paper bg-paper px-6 pb-24 pt-10 text-center text-green sm:px-12"
          >
            <h2 id="cta-title" className="text-[clamp(2.75rem,1.6rem+3vw,4.5rem)] leading-[0.9]">Pick up a brush</h2>
            <p className="mx-auto mt-4 max-w-[38ch]">
              Have artistic experience? Apply for a place at the next session and earn certificates and approved
              community-service hours.
            </p>
            <Link href="/join" className="btn btn-green mt-8 w-full">
              Apply to paint <span className="arrow" aria-hidden>→</span>
            </Link>
            <p className="mt-6 text-small">Or <Link href="/shop" className="link">pick up a shirt</Link> instead.</p>
          </div>
          </div>
        </div>
      </section>
    </>
  );
}
