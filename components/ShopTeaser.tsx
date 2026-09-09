"use client";

import Reveal from "./Reveal";
import EditableText from "./EditableText";

export default function ShopTeaser() {
  return (
    <section id="shop" className="bg-cream px-6 py-24 md:px-10">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-10 md:grid-cols-2">
        <Reveal>
          <div>
            <EditableText
              contentKey="shop_teaser_eyebrow"
              defaultValue="The collection"
              as="p"
              className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-rust"
            />
            <EditableText
              contentKey="shop_teaser_heading"
              defaultValue="New arrivals, made to last."
              as="h2"
              className="font-display text-[2.6rem] uppercase leading-[1.05] text-brown md:text-[3.6rem]"
            />
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="border-l-2 border-gold/40 pl-6 md:pl-10">
            <EditableText
              contentKey="shop_teaser_body"
              defaultValue="Eight pieces. Small batch. Heritage fabrics sourced with intent — each one designed to be worn for years, not seasons."
              as="p"
              multiline
              className="mb-8 text-[15px] font-light leading-relaxed text-muted"
            />
            <a
              href="/products"
              className="inline-block border-2 border-brown px-10 py-4 text-[13px] font-medium uppercase tracking-[0.15em] text-brown transition-colors hover:bg-brown hover:text-cream"
            >
              <EditableText
                contentKey="shop_teaser_button"
                defaultValue="View all products"
                as="span"
              />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
