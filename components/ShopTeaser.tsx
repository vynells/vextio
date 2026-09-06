import Reveal from "./Reveal";
import { getSiteContent } from "@/lib/getSiteContent";

export default async function ShopTeaser() {
  const content = await getSiteContent();

  return (
    <section id="shop" className="bg-off px-6 py-24 text-center md:px-10">
      <Reveal>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
          {content.shop_teaser_eyebrow || "The collection"}
        </p>
      </Reveal>
      <Reveal delay={100}>
        <h2 className="mb-6 font-display text-[2.4rem] font-bold text-brown md:text-[3.2rem]">
          {content.shop_teaser_heading || "New arrivals, made to last."}
        </h2>
      </Reveal>
      <Reveal delay={200}>
        <p className="mx-auto mb-10 max-w-md text-[14px] font-light leading-relaxed text-muted">
          {content.shop_teaser_body ||
            "Eight pieces. Small batch. Heritage fabrics sourced with intent — each one designed to be worn for years, not seasons."}
        </p>
      </Reveal>
      <Reveal delay={300}>
        <a
          href="/products"
          className="inline-block bg-rust px-10 py-4 text-[13px] font-medium uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#7a3418]"
        >
          {content.shop_teaser_button || "View all products"}
        </a>
      </Reveal>
    </section>
  );
}
