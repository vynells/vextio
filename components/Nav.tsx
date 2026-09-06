"use client";

import { useState } from "react";
import { useCart } from "./CartContext";

const links = [
  { label: "Shop", href: "#shop" },
  { label: "Collections", href: "#shop" },
  { label: "Lookbook", href: "#lookbook" },
];

export default function Nav() {
  const { count, isOpen, openCart, closeCart } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-brown/15 bg-cream px-6 py-4 md:px-10">
        <a
          href="#"
          className="font-display text-2xl font-black uppercase tracking-[0.12em] text-brown"
        >
          Vextio
        </a>

        <ul className="hidden gap-8 md:flex">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-[13px] font-medium uppercase tracking-[0.1em] text-muted transition-colors hover:text-brown"
              >
                {link.label}
              </a>
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
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium uppercase tracking-[0.1em] text-muted"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Cart drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeCart}
          />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-[380px] flex-col bg-cream px-6 py-6">
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

            {count === 0 ? (
              <p className="text-[14px] font-light text-muted">
                Your cart is empty.
              </p>
            ) : (
              <p className="text-[14px] font-light text-muted">
                {count} {count === 1 ? "item" : "items"} in your cart.
              </p>
            )}

            <div className="mt-auto">
              <button
                type="button"
                disabled={count === 0}
                className="w-full bg-rust px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#7a3418] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
