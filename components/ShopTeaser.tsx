"use client";

import Reveal from "./Reveal";
import EditableText from "./EditableText";

export default function ShopTeaser() {
  return (
    <section id="shop" className="bg-off px-6 py-24 text-center md:px-10">
      <Reveal>
        <EditableText
          contentKey="shop_teaser_eyebrow"
          defaultValue="The collection"
          as="p"
          className="mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-rust"
        />
      </Reveal>
      <Reveal delay={100}>
        <EditableText
          contentKey="shop_teaser_heading"
          defaultValue="New arrivals, made to last."
          as="h2"
          className="mb-6 font-display text-[2.4rem] font-bold text-brown md:text-[3.2rem]"
        />
      </Reveal>
      <Reveal delay={200}>
        <EditableText
          contentKey="shop_teaser_body"
          defaultValue="Eight pieces. Small batch. Heritage fabrics sourced with intent — each one designed to be worn for years, not seasons."
          as="p"
          multiline
          className="mx-auto mb-10 max-w-md text-[14px] font-light leading-relaxed text-muted"
        />
      </Reveal>
      <Reveal delay={300}>
        <a
          href="/products"
          className="inline-block bg-rust px-10 py-4 text-[13px] font-medium uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#7a3418]"
        >
          <EditableText
            contentKey="shop_teaser_button"
            defaultValue="View all products"
            as="span"
          />
        </a>
      </Reveal>
    </section>
  );
}
