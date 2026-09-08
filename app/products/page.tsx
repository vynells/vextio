"use client";

import { useState, useEffect } from "react";
import ProductCard, { Product } from "@/components/ProductCard";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import Reveal from "@/components/Reveal";
import VextioLoader from "@/components/VextioLoader";

type DbProduct = {
  id: string;
  name: string;
  detail: string;
  price: string;
  badge: string | null;
  image_url: string;
  category_id: string | null;
  subcategory_id: string | null;
};

type Category = { id: string; name: string; sort_order: number };
type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
};

function toProduct(p: DbProduct): Product {
  return {
    id: p.id,
    name: p.name,
    detail: p.detail,
    price: p.price,
    badge: p.badge || undefined,
    imageUrl: p.image_url,
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const closeTimer = useState<{ current: ReturnType<typeof setTimeout> | null }>({
    current: null,
  })[0];

  function openMenu(categoryId: string) {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setHoveredCategory(categoryId);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 1000);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/subcategories").then((r) => r.json()),
    ]).then(([p, c, s]) => {
      setProducts(p);
      setCategories(c);
      setSubcategories(s);
      // default to the first category that has NO subsections (directly viewable)
      const firstDirect = c.find(
        (cat: Category) => !s.some((sub: Subcategory) => sub.category_id === cat.id)
      );
      if (firstDirect) {
        setActiveCategory(firstDirect.id);
      } else if (c.length > 0) {
        // fall back: first category's first subsection
        const firstSub = s.find((sub: Subcategory) => sub.category_id === c[0].id);
        if (firstSub) {
          setActiveCategory(c[0].id);
          setActiveSubcategory(firstSub.id);
        }
      }
      setLoading(false);
    });
  }, []);

  function subsOf(categoryId: string) {
    return subcategories.filter((s) => s.category_id === categoryId);
  }

  function handleCategoryClick(cat: Category) {
    const subs = subsOf(cat.id);
    if (subs.length > 0) return; // can't click directly, must hover and pick a subsection
    setActiveCategory(cat.id);
    setActiveSubcategory("");
  }

  function handleSubcategoryClick(categoryId: string, sub: Subcategory) {
    setActiveCategory(categoryId);
    setActiveSubcategory(sub.id);
    setHoveredCategory(null);
  }

  const visibleProducts = activeSubcategory
    ? products.filter((p) => p.subcategory_id === activeSubcategory)
    : activeCategory
    ? products.filter((p) => p.category_id === activeCategory && !p.subcategory_id)
    : [];

  const activeLabel = (() => {
    if (activeSubcategory) {
      const sub = subcategories.find((s) => s.id === activeSubcategory);
      const cat = categories.find((c) => c.id === activeCategory);
      return sub && cat ? `${cat.name} — ${sub.name}` : "";
    }
    const cat = categories.find((c) => c.id === activeCategory);
    return cat?.name || "";
  })();

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

  return (
    <>
      <Nav />

      <main className="bg-off px-6 py-20 md:px-10">
        <FadeIn>
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
            The collection
          </p>
        </FadeIn>
        <FadeIn delay={100}>
          <h1 className="mb-10 text-center font-display text-[2.4rem] font-bold text-brown md:text-[3.2rem]">
            Browse pieces
          </h1>
        </FadeIn>

        {categories.length === 0 ? (
          <p className="text-center text-[14px] text-muted">
            No sections available yet.
          </p>
        ) : (
          <>
            {/* Category nav with hover-to-reveal subsections */}
            <div className="relative z-[70] mx-auto mb-4 flex max-w-[900px] flex-wrap justify-center gap-1 border-b border-brown/15 pb-4">
                {categories.map((cat) => {
                  const subs = subsOf(cat.id);
                  const hasSubs = subs.length > 0;
                  const isActive = activeCategory === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="relative"
                      onMouseEnter={() => hasSubs && openMenu(cat.id)}
                      onMouseLeave={() => hasSubs && scheduleClose()}
                    >
                      <button
                        type="button"
                        onClick={() => handleCategoryClick(cat)}
                        className={`px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.1em] transition-colors ${
                          isActive
                            ? "text-rust"
                            : "text-muted hover:text-brown"
                        } ${hasSubs ? "cursor-default" : "cursor-pointer"}`}
                      >
                        {cat.name}
                        {hasSubs && <span className="ml-1 text-[10px]">▾</span>}
                      </button>

                      {hasSubs && hoveredCategory === cat.id && (
                        <div className="absolute left-1/2 top-full z-[70] -translate-x-1/2 pt-2">
                          <div className="flex flex-col border border-brown/15 bg-cream py-1 shadow-lg">
                            {subs.map((sub) => (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => handleSubcategoryClick(cat.id, sub)}
                                className={`whitespace-nowrap px-6 py-2 text-left text-[13px] transition-colors ${
                                  activeSubcategory === sub.id
                                    ? "bg-tan text-rust"
                                    : "text-brown hover:bg-tan/50"
                                }`}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            {activeLabel && (
              <Reveal delay={200}>
                <p className="mb-8 text-center text-[12px] uppercase tracking-[0.15em] text-muted">
                  Showing: {activeLabel}
                </p>
              </Reveal>
            )}

            <div className="mx-auto max-w-[1200px]">
              {!activeCategory ? (
                <p className="text-center text-[14px] text-muted">
                  Hover a section above and choose a type to see pieces.
                </p>
              ) : visibleProducts.length === 0 ? (
                <p className="text-center text-[14px] text-muted">
                  No pieces here yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  {visibleProducts.map((product, i) => (
                    <Reveal key={product.id} delay={i * 80}>
                      <ProductCard product={toProduct(product)} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
