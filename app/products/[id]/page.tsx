"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import VextioLoader from "@/components/VextioLoader";
import { useCart } from "@/components/CartContext";

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"];

type DbProduct = {
  id: string;
  name: string;
  detail: string;
  price: string;
  badge: string | null;
  image_url: string;
  back_image_url: string | null;
  extra_image_urls: string[] | null;
  description: string | null;
  sizes: Record<string, number> | null;
  size_chart_url: string | null;
  category_id: string | null;
  subcategory_id: string | null;
};

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { addItem, openCart } = useCart();

  const [product, setProduct] = useState<DbProduct | null>(null);
  const [globalSizeChartUrl, setGlobalSizeChartUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/content/global_size_chart_url")
        .then((r) => (r.ok ? r.json() : { value: "" }))
        .catch(() => ({ value: "" })),
    ]).then(([products, chartSetting]: [DbProduct[], { value?: string }]) => {
      const found = products.find((p) => p.id === id);
      if (!found) {
        setNotFound(true);
      } else {
        setProduct(found);
      }
      setGlobalSizeChartUrl(chartSetting?.value || "");
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <>
        <Nav />
        <main className="bg-off px-6 py-20 md:px-10">
          <VextioLoader />
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !product) {
    return (
      <>
        <Nav />
        <main className="mx-auto flex min-h-[50vh] max-w-[600px] flex-col items-center justify-center px-6 text-center">
          <p className="text-[14px] text-muted">This product couldn&apos;t be found.</p>
        </main>
        <Footer />
      </>
    );
  }

  const images = [
    product.image_url,
    ...(product.back_image_url ? [product.back_image_url] : []),
    ...(product.extra_image_urls || []),
  ].filter(Boolean);

  const sizes = product.sizes || { S: 5, M: 5, L: 5, XL: 5, XXL: 5 };
  const orderedSizes = SIZE_ORDER.filter((s) => s in sizes);

  const effectiveSizeChartUrl = product.size_chart_url || globalSizeChartUrl;

  function goToImage(index: number) {
    const total = images.length;
    setActiveImageIndex(((index % total) + total) % total);
  }

  function handleAddToCart() {
    if (orderedSizes.length > 0 && !selectedSize) return;
    if (!product) return;

    addItem({
      id: selectedSize ? `${product.id}-${selectedSize}` : product.id,
      name: selectedSize ? `${product.name} (${selectedSize})` : product.name,
      price: product.price,
      imageUrl: product.image_url,
    });
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 1200);
  }

  const needsSizeSelection = orderedSizes.length > 0 && !selectedSize;

  return (
    <>
      <Nav />

      <main className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-6 py-14 md:grid-cols-2 md:gap-14 md:px-10 md:py-20">
        {/* Image gallery */}
        <FadeIn>
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-tan">
            <Image
              src={images[activeImageIndex]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-opacity duration-500 ease-out"
              key={activeImageIndex}
              priority
            />

            {product.badge && (
              <span
                className={`absolute left-3 top-3 z-10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
                  product.badge === "Ltd." ? "bg-gold text-brown" : "bg-rust text-cream"
                }`}
              >
                {product.badge}
              </span>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goToImage(activeImageIndex - 1)}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-cream/80 text-brown transition-colors hover:bg-cream"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => goToImage(activeImageIndex + 1)}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-cream/80 text-brown transition-colors hover:bg-cream"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative h-16 w-14 flex-shrink-0 overflow-hidden bg-tan transition-opacity ${
                    activeImageIndex === i ? "opacity-100 ring-1 ring-brown" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </FadeIn>

        {/* Details */}
        <FadeIn delay={100}>
          <div className="flex flex-col">
            <p className="mb-1 text-[13px] font-light text-muted">{product.detail}</p>
            <h1 className="mb-3 font-display text-[2rem] font-bold text-brown md:text-[2.4rem]">
              {product.name}
            </h1>
            <p className="mb-6 font-legal text-xl font-bold text-brown">{product.price}</p>

            {product.description && (
              <p className="mb-8 whitespace-pre-line text-[14px] font-light leading-relaxed text-muted">
                {product.description}
              </p>
            )}

            {orderedSizes.length > 0 && (
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">
                    Size
                  </p>
                  {effectiveSizeChartUrl && (
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      className="text-[11px] uppercase tracking-[0.1em] text-rust underline underline-offset-2 hover:text-brown"
                    >
                      Size chart
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {orderedSizes.map((size) => {
                    const qty = sizes[size] ?? 0;
                    const inStock = qty > 0;
                    const isSelected = selectedSize === size;
                    return (
                      <div key={size} className="group/size relative">
                        <button
                          type="button"
                          disabled={!inStock}
                          onClick={() => inStock && setSelectedSize(size)}
                          className={`flex h-11 w-14 items-center justify-center border text-[13px] font-medium transition-colors ${
                            !inStock
                              ? "cursor-not-allowed border-brown/10 text-muted/40 line-through"
                              : isSelected
                              ? "border-brown bg-brown text-cream"
                              : "border-brown/25 text-brown hover:border-brown"
                          }`}
                        >
                          {size}
                        </button>
                        {!inStock && (
                          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap bg-brown px-2 py-1 text-[10px] uppercase tracking-wide text-cream opacity-0 transition-opacity group-hover/size:opacity-100">
                            Out of stock
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={needsSizeSelection}
              className="w-full bg-rust px-6 py-4 text-[13px] font-medium uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#7a3418] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {added ? "Added to cart" : needsSizeSelection ? "Select a size" : "Add to cart"}
            </button>
          </div>
        </FadeIn>
      </main>

      {showSizeChart && effectiveSizeChartUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-brown/60 px-6"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="relative max-h-[85vh] max-w-[500px] overflow-auto bg-cream p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSizeChart(false)}
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

      <Footer />
    </>
  );
}
