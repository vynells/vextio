"use client";

import { useState } from "react";
import { useCart } from "./CartContext";

export type Product = {
  name: string;
  detail: string;
  price: string;
  badge?: string;
  swatchClass: string;
  swatchLabel?: string;
  imgClass?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem();
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="group cursor-pointer">
      <div
        className={`relative mb-4 flex aspect-[3/4] items-center justify-center overflow-hidden ${
          product.imgClass ?? "bg-tan"
        }`}
      >
        <div
          className={`flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.04] ${product.swatchClass}`}
        >
          {product.swatchLabel}
        </div>

        {product.badge && (
          <span
            className={`absolute left-3 top-3 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
              product.badge === "Ltd."
                ? "bg-gold text-brown"
                : "bg-rust text-cream"
            }`}
          >
            {product.badge}
          </span>
        )}

        <button
          type="button"
          onClick={handleAdd}
          className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap border border-cream bg-brown/80 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-cream opacity-100 transition-colors hover:bg-cream hover:text-brown md:bg-transparent md:opacity-0 md:group-hover:opacity-100"
        >
          {added ? "Added" : "Quick add"}
        </button>
      </div>

      <p className="mb-1 text-[14px] font-medium tracking-wide text-brown">
        {product.name}
      </p>
      <p className="mb-1 text-[13px] font-light text-muted">
        {product.detail}
      </p>
      <p className="font-display text-base font-bold text-brown">
        {product.price}
      </p>
    </div>
  );
}
