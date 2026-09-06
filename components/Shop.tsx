import ProductCard, { Product } from "./ProductCard";

const products: Product[] = [
  {
    id: "heritage-overshirt",
    name: "Heritage overshirt",
    detail: "Washed cotton · Mocha",
    price: "PKR 4,200",
    badge: "New",
    imageUrl: "https://www.trybloom.ai/img/3cf53fa7-a7fa-4514-a8af-b467629fcaaa",
  },
  {
    id: "archive-longsleeve",
    name: "Archive longsleeve",
    detail: "Slub jersey · Ecru",
    price: "PKR 2,800",
    imageUrl: "https://www.trybloom.ai/img/815ecf3f-9ff4-4fe1-954b-cbc2fbacbb9e",
  },
  {
    id: "wax-seal-cap",
    name: "Wax seal cap",
    detail: "Brushed wool · Black",
    price: "PKR 1,900",
    badge: "Ltd.",
    imageUrl: "https://www.trybloom.ai/img/2212a9d2-c387-4c1e-91be-ef4494edf391",
  },
  {
    id: "vintage-tote",
    name: "Vintage tote",
    detail: "Canvas · Natural",
    price: "PKR 1,400",
    imageUrl: "https://www.trybloom.ai/img/a57b8c1e-797b-4b2a-b159-8c50caee3fe3",
  },
  {
    id: "workwear-trousers",
    name: "Workwear trousers",
    detail: "Heavy twill · Olive",
    price: "PKR 3,600",
    imageUrl: "https://www.trybloom.ai/img/bca6ec4d-672b-48fd-ac7f-009dbbf7c8b2",
  },
  {
    id: "frayed-denim-jacket",
    name: "Frayed denim jacket",
    detail: "Rigid denim · Indigo",
    price: "PKR 5,400",
    badge: "New",
    imageUrl: "https://www.trybloom.ai/img/728d4dfd-fd92-43f3-ac6a-f3c9190fa854",
  },
  {
    id: "ribbed-knit-vest",
    name: "Ribbed knit vest",
    detail: "Merino blend · Charcoal",
    price: "PKR 2,300",
    imageUrl: "https://www.trybloom.ai/img/2c15c350-dcd5-456a-8782-c4788608f5a6",
  },
  {
    id: "leather-belt",
    name: "Leather belt",
    detail: "Full grain · Tan",
    price: "PKR 1,600",
    imageUrl: "https://www.trybloom.ai/img/f613a3c4-6120-4f54-9221-fea0e807fef8",
  },
];

export default function Shop() {
  return (
    <section id="shop" className="bg-off px-6 py-20 md:px-10">
      <div className="mb-12 flex items-baseline justify-between">
        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
            The collection
          </p>
          <h2 className="font-display text-[2.2rem] font-bold text-brown">
            New arrivals
          </h2>
        </div>
        <a
          href="#"
          className="border-b border-rust pb-0.5 text-[12px] font-medium uppercase tracking-[0.15em] text-rust"
        >
          View all pieces
        </a>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
