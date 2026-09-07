"use client";

import { useState, useEffect } from "react";
import ProductCard, { Product } from "@/components/ProductCard";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

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

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/subcategories").then((r) => r.json()),
    ]).then(([p, c, s]) => {
      setProducts(p);
      setCategories(c);
      setSubcategories(s);
      if (c.length > 0) setSelectedCategory(c[0].id);
      setLoading(false);
    });
  }, []);

  const subsOfSelected = subcategories.filter(
    (s) => s.category_id === selectedCategory
  );
  const categoryHasSubsections = subsOfSelected.length > 0;

  function handleCategoryChange(categoryId: string) {
    setSelectedCategory(categoryId);
    setSelectedSubcategory("");
  }

  const visibleProducts = (() => {
    if (!selectedCategory) return [];
    if (categoryHasSubsections) {
      if (!selectedSubcategory) return null; // must choose a subsection first
      return products.filter((p) => p.subcategory_id === selectedSubcategory);
    }
    return products.filter(
      (p) => p.category_id === selectedCategory && !p.subcategory_id
    );
  })();

  if (loading) {
    return (
      <>
        <Nav />
        <main className="bg-off px-6 py-20 text-center md:px-10">
          <p className="text-[14px] text-muted">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />

      <main className="bg-off px-6 py-20 md:px-10">
        <Reveal>
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
            The collection
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="mb-10 text-center font-display text-[2.4rem] font-bold text-brown md:text-[3.2rem]">
            Browse pieces
          </h1>
        </Reveal>

        {categories.length === 0 ? (
          <p className="text-center text-[14px] text-muted">
            No sections available yet.
          </p>
        ) : (
          <>
            <Reveal delay={150}>
              <div className="mx-auto mb-10 flex max-w-[500px] flex-col gap-3 sm:flex-row">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="flex-1 border border-brown/25 bg-cream px-4 py-3 text-[14px] text-brown focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {categoryHasSubsections && (
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="flex-1 border border-brown/25 bg-cream px-4 py-3 text-[14px] text-brown focus:outline-none"
                  >
                    <option value="">Choose a type...</option>
                    {subsOfSelected.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </Reveal>

            <div className="mx-auto max-w-[1200px]">
              {visibleProducts === null ? (
                <p className="text-center text-[14px] text-muted">
                  Choose a type above to see these pieces.
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
