"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartContext";
import { parsePrice, formatPKR } from "@/lib/price";

const links = [
  { label: "Shop", href: "/products" },
  { label: "Collections", href: "/products" },
  { label: "Terms", href: "/terms" },
];

export default function Nav() {
  const { items, count, isOpen, openCart, closeCart, removeItem, updateQty } = useCart();
  const [open, setOpen] = useState(false);
  const [logoText, setLogoText] = useState("Vextio");

  useEffect(() => {
    fetch("/api/content")
      .then((res) => res.json())
      .then((rows: { key: string; value: string }[]) => {
        const logo = rows.find((r) => r.key === "nav_logo_text");
        if (logo) setLogoText(logo.value);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-brown/15 bg-cream px-6 py-4 md:px-10">
        <Link
          href="/"
          className="font-display text-2xl font-black uppercase tracking-[0.12em] text-brown"
        >
          {logoText}
        </Link>

        <ul className="hidden gap-8 md:flex">
          {links.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="text-[13px] font-medium uppercase tracking-[0.1em] text-muted transition-colors hover:text-brown"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCart}
            className="border border-brown px-5 py-2 text-[13px] font-medium uppercase tracking-[0.1em] text-brown transition-colors hover:bg-brown hover:text-cream"
          >
            Cart ({count})
          </button>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="flex flex-col gap-1.5 md:hidden"
          >
            <span className="h-[1.5px] w-6 bg-brown" />
            <span className="h-[1.5px] w-6 bg-brown" />
          </button>
        </div>

        {open && (
          <ul className="absolute left-0 right-0 top-full flex flex-col gap-4 border-b border-brown/15 bg-cream px-6 py-6 md:hidden">
            {links.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium uppercase tracking-[0.1em] text-muted"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Cart drawer */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-black/60" onClick={closeCart} />
        <div
          className={`absolute right-0 top-0 flex h-full w-full max-w-[380px] flex-col bg-cream px-6 py-6 transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-brown">
              Your cart
            </h3>
            <button
              type="button"
              onClick={closeCart}
              aria-label="Close cart"
              className="text-2xl leading-none text-brown"
            >
              ×
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-[14px] font-light text-muted">
              Your cart is empty.
            </p>
          ) : (
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.id}-${item.size ?? ""}`} className="flex gap-3">
                  <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden bg-tan">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-[13px] font-medium text-brown">
                      {item.name}
                      {item.size && (
                        <span className="ml-1 font-normal text-muted">— {item.size}</span>
                      )}
                    </p>
                    <div className="my-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty - 1, item.size)}
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="flex h-6 w-6 items-center justify-center border border-brown/25 text-[13px] leading-none text-brown hover:bg-brown/10"
                      >
                        −
                      </button>
                      <span className="min-w-[16px] text-center text-[12px] text-brown">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty + 1, item.size)}
                        aria-label={`Increase quantity of ${item.name}`}
                        className="flex h-6 w-6 items-center justify-center border border-brown/25 text-[13px] leading-none text-brown hover:bg-brown/10"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-[13px] font-bold text-brown">
                      {formatPKR(parsePrice(item.price) * item.qty)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id, item.size)}
                    aria-label={`Remove ${item.name}`}
                    className="self-start text-lg leading-none text-muted hover:text-brown"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-brown/15 pt-4 text-[14px]">
              <span className="font-medium text-brown">Total</span>
              <span className="font-bold text-brown">
                {formatPKR(
                  items.reduce(
                    (sum, item) => sum + parsePrice(item.price) * item.qty,
                    0
                  )
                )}
              </span>
            </div>
          )}

          <div className="mt-auto pt-6">
            <Link
              href="/checkout"
              className={`block w-full bg-rust px-6 py-3.5 text-center text-[12px] font-medium uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#7a3418] ${
                count === 0 ? "pointer-events-none opacity-40" : ""
              }`}
            >
              Checkout
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
