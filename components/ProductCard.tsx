"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartContext";

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"];

export type Product = {
  id: string;
  name: string;
  detail: string;
  price: string;
  badge?: string;
  imageUrl: string;
  backImageUrl?: string;
  extraImageUrls?: string[];
  sizes?: Record<string, number>;
  sizeChartUrl?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [globalSizeChartUrl, setGlobalSizeChartUrl] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  const hasBack = Boolean(product.backImageUrl);
  const sizes = product.sizes || {};
  const orderedSizes = SIZE_ORDER.filter((s) => s in sizes);
  const effectiveSizeChartUrl = product.sizeChartUrl || globalSizeChartUrl;

  useEffect(() => {
    if (!showSizePicker || product.sizeChartUrl || globalSizeChartUrl) return;
    fetch("/api/content/global_size_chart_url")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.value) setGlobalSizeChartUrl(data.value);
      })
      .catch(() => {});
  }, [showSizePicker, product.sizeChartUrl, globalSizeChartUrl]);

  useEffect(() => {
    if (!showSizePicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowSizePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSizePicker]);

  function handleQuickAddClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (orderedSizes.length === 0) {
      // No sizes configured for this product — add directly
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
      return;
    }
    setShowSizePicker((prev) => !prev);
  }

  function handleSelectSize(size: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if ((sizes[size] ?? 0) <= 0) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      size,
    });
    setShowSizePicker(false);
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block cursor-pointer"
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
          onClick={handleQuickAddClick}
          className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap border border-cream bg-brown/80 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-cream opacity-100 transition-colors hover:bg-cream hover:text-brown md:bg-transparent md:opacity-0 md:group-hover:opacity-100"
        >
          {added ? "Added" : "Quick add"}
        </button>

        {showSizePicker && (
          <div
            ref={popoverRef}
            onClick={(e) => e.preventDefault()}
            className="absolute bottom-14 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-[240px] -translate-x-1/2 border border-brown/15 bg-cream p-4 shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted">
                Select size
              </p>
              {effectiveSizeChartUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSizeChart(true);
                  }}
                  className="text-[10px] uppercase tracking-[0.1em] text-rust underline underline-offset-2 hover:text-brown"
                >
                  Size chart
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {orderedSizes.map((size) => {
                const inStock = (sizes[size] ?? 0) > 0;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!inStock}
                    onClick={(e) => handleSelectSize(size, e)}
                    className={`flex h-9 w-11 items-center justify-center border text-[12px] font-medium transition-colors ${
                      !inStock
                        ? "cursor-not-allowed border-brown/10 text-muted/40 line-through"
                        : "border-brown/25 text-brown hover:border-brown hover:bg-brown hover:text-cream"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}
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

      {showSizeChart && effectiveSizeChartUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-brown/60 px-6"
          onClick={(e) => {
            e.preventDefault();
            setShowSizeChart(false);
          }}
        >
          <div
            className="relative max-h-[85vh] max-w-[500px] overflow-auto bg-cream p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowSizeChart(false);
              }}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center bg-brown/80 text-cream"
              aria-label="Close size chart"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={effectiveSizeChartUrl} alt="Size chart" className="w-full" />
          </div>
        </div>
      )}
    </Link>
  );
}
