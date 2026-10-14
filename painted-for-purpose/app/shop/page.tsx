import type { Metadata } from "next";
import { PageHead } from "@/components/Heading";
import ShopGrid from "@/components/ShopGrid";
import { instagramUrl, orderFlow, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop",
  description: "One-of-a-kind T-shirts hand-painted by student artists. Half of every sale goes to flood relief in Pakistan.",
  alternates: { canonical: "/shop" },
};

const steps = [
  { t: "Pick your shirt", b: "Each design exists once. Note its name and size." },
  { t: "Send us a message", b: `Tap “Buy” to DM @${site.instagramHandle} on Instagram, or email us.` },
  { t: "Confirm and pay", b: orderFlow.payment },
  { t: "Wear it", b: orderFlow.delivery },
];

export default function Shop() {
  return (
    <>
      <PageHead title="The shirts">
        Every shirt is painted once, by one student artist. Buying one sends half its price to flood relief and puts
        the other half into the next session.
      </PageHead>

      <section aria-label="Shirts for sale" className="wrap pb-24 sm:pb-36">
        <p className="mb-10 max-w-[60ch] bg-green-3 p-5 text-small">
          Preview: these are drawn stand-ins. Real shirts, photos and prices go up after Session 1. Follow{" "}
          <a className="link" href={instagramUrl} target="_blank" rel="noopener noreferrer">@{site.instagramHandle}</a> to see them first.
        </p>
        <ShopGrid />
      </section>

      <section aria-labelledby="order-title" className="bg-paper py-24 text-green sm:py-36">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <h2 id="order-title" data-reveal className="text-head lg:col-span-5">How ordering works</h2>
          <ol className="grid gap-10 sm:grid-cols-2 lg:col-span-7">
            {steps.map((s, i) => (
              <li key={s.t} data-reveal style={{ ["--d" as string]: i }}>
                <h3 className="text-[2.25rem] leading-none">{s.t}</h3>
                <p className="mt-3 max-w-[34ch]">{s.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
