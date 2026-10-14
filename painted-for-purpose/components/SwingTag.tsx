"use client";

import { useId, useState } from "react";
import { donationShare, impliedShirtPrice, num, projection } from "@/lib/site";

// The one live thing on the site: set a price and a number of shirts, read the split.
// Defaults reproduce the plan's Session 1 projection (≈20 shirts, ≈PKR 32,000).
export default function SwingTag({ className = "" }: { className?: string }) {
  const id = useId();
  const [price, setPrice] = useState(impliedShirtPrice);
  const [count, setCount] = useState(projection[0].shirts);
  const total = price * count;
  const relief = total * donationShare;
  const next = total - relief;

  return (
    <div className={`on-paper relative bg-paper px-6 pb-8 pt-14 text-green sm:px-10 [clip-path:polygon(18%_0,82%_0,100%_9%,100%_100%,0_100%,0_9%)] ${className}`}>
      <span className="tag-hole" aria-hidden />
      <p className="text-center font-display text-[2.25rem] uppercase leading-none">Where your rupees go</p>

      <div className="mt-8 space-y-6">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={`${id}-p`}>Price of one shirt</label>
            <output htmlFor={`${id}-p`} className="tnum font-medium">PKR {num(price)}</output>
          </div>
          <input id={`${id}-p`} type="range" min={800} max={4000} step={100} value={price}
            onChange={(e) => setPrice(Number(e.target.value))} className="range mt-2 w-full" />
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor={`${id}-c`}>Shirts sold</label>
            <output htmlFor={`${id}-c`} className="tnum font-medium">{count}</output>
          </div>
          <input id={`${id}-c`} type="range" min={1} max={60} step={1} value={count}
            onChange={(e) => setCount(Number(e.target.value))} className="range mt-2 w-full" />
        </div>
      </div>

      <div className="perf mt-8 text-green/40" aria-hidden />

      <div className="tnum mt-6 grid grid-cols-2 gap-px bg-green/15" aria-live="polite">
        <div className="bg-gold p-4">
          <p className="font-display text-[2.5rem] leading-none sm:text-[3rem]">{num(relief)}</p>
          <p className="text-small">PKR to flood relief charities</p>
        </div>
        <div className="bg-paper-2 p-4">
          <p className="font-display text-[2.5rem] leading-none sm:text-[3rem]">{num(next)}</p>
          <p className="text-small">PKR to the next session</p>
        </div>
      </div>
      <p className="mt-4 text-small">
        Total raised: PKR {num(total)}. The plan projects about PKR {num(projection[0].revenue)} from Session 1’s
        ~{projection[0].shirts} shirts. Real prices are set per shirt.
      </p>
    </div>
  );
}
