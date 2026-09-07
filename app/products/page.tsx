import ProductCard, { Product } from "@/components/ProductCard";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

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

async function getData() {
  const [productsRes, categoriesRes, subcategoriesRes] = await Promise.all([
    sql`SELECT * FROM products ORDER BY created_at DESC`,
    sql`SELECT * FROM categories ORDER BY sort_order, name`,
    sql`SELECT * FROM subcategories ORDER BY sort_order, name`,
  ]);

  return {
    products: productsRes.rows as DbProduct[],
    categories: categoriesRes.rows as Category[],
    subcategories: subcategoriesRes.rows as Subcategory[],
  };
}

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

export default async function ProductsPage() {
  const { products, categories, subcategories } = await getData();

  const uncategorized = products.filter((p) => !p.category_id);

  return (
    <>
      <Nav />

      <main className="bg-off px-6 py-20 md:px-10">
        <Reveal>
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
            The full collection
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="mb-16 text-center font-display text-[2.4rem] font-bold text-brown md:text-[3.2rem]">
            All pieces
          </h1>
        </Reveal>

        <div className="mx-auto max-w-[1200px]">
          {categories.map((cat) => {
            const subsOfCat = subcategories.filter(
              (s) => s.category_id === cat.id
            );
            const directProducts = products.filter(
              (p) => p.category_id === cat.id && !p.subcategory_id
            );

            const hasAnything =
              directProducts.length > 0 ||
              subsOfCat.some(
                (s) => products.filter((p) => p.subcategory_id === s.id).length > 0
              );

            if (!hasAnything) return null;

            return (
              <div key={cat.id} className="mb-16">
                <Reveal>
                  <h2 className="mb-8 font-display text-[1.8rem] font-bold text-brown">
                    {cat.name}
                  </h2>
                </Reveal>

                {directProducts.length > 0 && (
                  <div className="mb-10 grid grid-cols-2 gap-6 md:grid-cols-4">
                    {directProducts.map((product, i) => (
                      <Reveal key={product.id} delay={i * 80}>
                        <ProductCard product={toProduct(product)} />
                      </Reveal>
                    ))}
                  </div>
                )}

                {subsOfCat.map((sub) => {
                  const subProducts = products.filter(
                    (p) => p.subcategory_id === sub.id
                  );
                  if (subProducts.length === 0) return null;

                  return (
                    <div key={sub.id} className="mb-10">
                      <Reveal>
                        <h3 className="mb-5 text-[13px] font-medium uppercase tracking-[0.15em] text-rust">
                          {sub.name}
                        </h3>
                      </Reveal>
                      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        {subProducts.map((product, i) => (
                          <Reveal key={product.id} delay={i * 80}>
                            <ProductCard product={toProduct(product)} />
                          </Reveal>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {uncategorized.length > 0 && (
            <div className="mb-16">
              <Reveal>
                <h2 className="mb-8 font-display text-[1.8rem] font-bold text-brown">
                  More pieces
                </h2>
              </Reveal>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {uncategorized.map((product, i) => (
                  <Reveal key={product.id} delay={i * 80}>
                    <ProductCard product={toProduct(product)} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
