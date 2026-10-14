"use client";

import { useState } from "react";
import Tee from "./Tee";
import { instagramDm, pkr, shirts, site, type Shirt } from "@/lib/site";

const sizes = ["All", "S", "M", "L", "XL"] as const;

function orderMail(s: Shirt) {
  const subject = `Order: ${s.title} (size ${s.size})`;
  const body = `Hi P4P,\n\nI'd like to buy "${s.title}" in size ${s.size} for ${pkr(s.price)}.\n\nName:\nCity:\nPhone:\n`;
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function ShopGrid() {
  const [size, setSize] = useState<(typeof sizes)[number]>("All");
  const list = shirts.filter((s) => size === "All" || s.size === size);
  const available = shirts.filter((s) => !s.sold).length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <p id="size-label">{available} of {shirts.length} available · Filter by size</p>
        <div role="group" aria-labelledby="size-label" className="flex gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              onClick={() => setSize(s)}
              className="btn min-w-[48px] bg-green-3 px-4 text-gold aria-pressed:bg-gold aria-pressed:text-green hover:bg-green-2"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {list.map((s, i) => (
          <li key={s.id} className="flex">
            <article
              style={{ rotate: ["-0.8deg", "0.6deg", "0deg", "0.8deg", "-0.5deg", "0deg"][i % 6] }}
              className="on-paper sway relative flex w-full flex-col bg-paper px-6 pb-6 pt-12 text-green [clip-path:polygon(16%_0,84%_0,100%_7%,100%_100%,0_100%,0_7%)]"
            >
              <span className="tag-hole" aria-hidden />
              <div className={`bg-paper-2 p-6 ${s.sold ? "opacity-60" : ""}`}>
                <Tee shirt={s} className="mx-auto w-full max-w-[260px]" />
              </div>
              <h2 className="mt-5 text-[2.25rem] leading-none">{s.title}</h2>
              <p className="text-small">by {s.artist}</p>
              <div className="mt-4">
                <div className="tnum flex items-end py-1"><span>Size</span><span className="leader" aria-hidden /><span>{s.size}</span></div>
                <div className="tnum flex items-end py-1"><span>Price</span><span className="leader" aria-hidden /><span>{pkr(s.price)}</span></div>
                <div className="tnum flex items-end py-1"><span>To flood relief</span><span className="leader" aria-hidden /><span>{pkr(s.price / 2)}</span></div>
              </div>
              <div className="mt-auto pt-6">
                {s.sold ? (
                  <p className="flex min-h-[48px] items-center justify-center bg-green/10 font-display text-[1.375rem] uppercase">
                    Sold · thank you
                  </p>
                ) : (
                  <>
                    <a href={instagramDm} target="_blank" rel="noopener noreferrer" className="btn btn-green w-full"
                      aria-label={`Buy ${s.title}, size ${s.size}, by Instagram message (opens Instagram)`}>
                      Buy via Instagram DM <span className="arrow" aria-hidden>↗</span>
                    </a>
                    <a href={orderMail(s)} className="link mt-3 block text-center text-small">or order by email</a>
                  </>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <p className="mt-12 text-lead">No shirts in size {size} right now. New sizes arrive with every session.</p>
      )}
    </>
  );
}
