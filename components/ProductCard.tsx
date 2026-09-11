"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "./CartContext";

export type Product = {
  id: string;
  name: string;
  detail: string;
  price: string;
  badge?: string;
  imageUrl: string;
  backImageUrl?: string;
  extraImageUrls?: string[];
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const hasBack = Boolean(product.backImageUrl);

  function handleAdd() {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative mb-4 flex aspect-[3/4] items-center justify-center overflow-hidden bg-tan">
        {/* Front image */}
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.04]"
          style={{ opacity: hasBack && hovered ? 0 : 1 }}
        />

        {/* Back image — crossfades in smoothly on hover */}
        {hasBack && (
          <Image
            src={product.backImageUrl as string}
            alt={`${product.name} — back`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-[opacity,transform] duration-700 ease-out scale-[1.04]"
            style={{ opacity: hovered ? 1 : 0 }}
          />
        )}

        {product.badge && (
          <span
            className={`absolute left-3 top-3 z-10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
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
      <p className="font-legal text-base font-bold text-brown">
        {product.price}
      </p>
    </div>
  );
}
