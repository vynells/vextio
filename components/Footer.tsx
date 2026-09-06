"use client";

import Link from "next/link";
import EditableText from "./EditableText";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "New arrivals", href: "/#shop" },
      { label: "All products", href: "/products" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Return & Refund Policy", href: "/returns" },
      { label: "Shipping Policy", href: "/shipping" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-cream/10 bg-brown px-6 pb-8 pt-12 md:px-10">
      <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <EditableText
            contentKey="footer_brand_name"
            defaultValue="Vextio"
            as="p"
            className="mb-4 font-display text-xl font-black uppercase tracking-[0.12em] text-cream"
          />
          <EditableText
            contentKey="footer_tagline"
            defaultValue="Vintage-inspired clothing made in small batches. Designed to last, made to be worn."
            as="p"
            multiline
            className="max-w-[220px] text-[13px] font-light leading-relaxed text-cream/45"
          />
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-5 text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
              {col.title}
            </h4>
            {col.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="mb-2.5 block text-[13px] font-light text-cream/50 transition-colors hover:text-cream"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}

        <div>
          <h4 className="mb-5 text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
            Contact
          </h4>
          <EditableText
            contentKey="footer_address"
            defaultValue="Islamabad, Pakistan"
            as="p"
            className="mb-2.5 text-[13px] font-light text-cream/50"
          />
          <EditableText
            contentKey="footer_phone"
            defaultValue="03340927688"
            as="p"
            className="mb-2.5 text-[13px] font-light text-cream/50"
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-6 sm:flex-row">
        <EditableText
          contentKey="footer_copyright"
          defaultValue="© 2024 Vextio. All rights reserved."
          as="p"
          className="text-[12px] text-cream/30"
        />
        <div className="flex gap-6">
          {["Instagram", "TikTok", "Pinterest"].map((social) => (
            <a
              key={social}
              href="#"
              className="text-[11px] uppercase tracking-[0.15em] text-cream/40 transition-colors hover:text-cream"
            >
              {social}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
