import ProductCard, { Product } from "@/components/ProductCard";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

async function getProducts(): Promise<Product[]> {
  const { rows } = await sql`SELECT * FROM products ORDER BY created_at DESC`;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    detail: r.detail,
    price: r.price,
    badge: r.badge || undefined,
    imageUrl: r.image_url,
  }));
}

export default async function ProductsPage() {
  const products = await getProducts();

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

        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 md:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={i * 100}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
