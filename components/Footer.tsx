import Link from "next/link";
import { getSiteContent } from "@/lib/getSiteContent";

export default async function Footer() {
  const content = await getSiteContent();

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
    {
      title: "Contact",
      links: [
        { label: content.footer_address || "Islamabad, Pakistan", href: "#" },
        {
          label: content.footer_phone || "03340927688",
          href: `tel:${content.footer_phone || "03340927688"}`,
        },
      ],
    },
  ];

  return (
    <footer className="border-t border-cream/10 bg-brown px-6 pb-8 pt-12 md:px-10">
      <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <p className="mb-4 font-display text-xl font-black uppercase tracking-[0.12em] text-cream">
            {content.footer_brand_name || "Vextio"}
          </p>
          <p className="max-w-[220px] text-[13px] font-light leading-relaxed text-cream/45">
            {content.footer_tagline ||
              "Vintage-inspired clothing made in small batches. Designed to last, made to be worn."}
          </p>
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
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-6 sm:flex-row">
        <p className="text-[12px] text-cream/30">
          {content.footer_copyright || "© 2024 Vextio. All rights reserved."}
        </p>
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
