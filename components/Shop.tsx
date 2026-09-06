import ProductCard, { Product } from "./ProductCard";

const products: Product[] = [
  {
    name: "Heritage overshirt",
    detail: "Washed cotton · Mocha",
    price: "PKR 4,200",
    badge: "New",
    swatchClass:
      "h-[150px] w-[110px] bg-gradient-to-br from-brown from-60% to-tan to-60% relative font-display text-[11px] tracking-[0.2em] text-gold font-bold items-end justify-center pb-4",
    swatchLabel: "VXTIO",
  },
  {
    name: "Archive longsleeve",
    detail: "Slub jersey · Ecru",
    price: "PKR 2,800",
    swatchClass:
      "h-[140px] w-[90px] bg-cream border border-brown/20 relative before:absolute before:top-2.5 before:left-2.5 before:right-2.5 before:h-0.5 before:bg-rust",
    swatchLabel: "",
  },
  {
    name: "Wax seal cap",
    detail: "Brushed wool · Black",
    price: "PKR 1,900",
    badge: "Ltd.",
    imgClass: "bg-[#2A2420]",
    swatchClass:
      "h-20 w-20 rounded-full bg-[#2A2420] font-display text-3xl font-black text-gold",
    swatchLabel: "V",
  },
  {
    name: "Vintage tote",
    detail: "Canvas · Natural",
    price: "PKR 1,400",
    swatchClass:
      "h-20 w-[120px] -rotate-2 bg-tan font-display text-[10px] tracking-[0.3em] text-muted font-bold",
    swatchLabel: "VEXTIO",
  },
  {
    name: "Workwear trousers",
    detail: "Heavy twill · Olive",
    price: "PKR 3,600",
    swatchClass:
      "h-[150px] w-[100px] bg-[#4A5A3C] font-display text-[10px] tracking-[0.2em] text-cream font-bold items-end justify-center pb-4",
    swatchLabel: "VXTIO",
  },
  {
    name: "Frayed denim jacket",
    detail: "Rigid denim · Indigo",
    price: "PKR 5,400",
    badge: "New",
    swatchClass:
      "h-[150px] w-[110px] bg-[#2E3A52] font-display text-[10px] tracking-[0.2em] text-cream font-bold items-end justify-center pb-4",
    swatchLabel: "VXTIO",
  },
  {
    name: "Ribbed knit vest",
    detail: "Merino blend · Charcoal",
    price: "PKR 2,300",
    swatchClass:
      "h-[130px] w-[95px] bg-[#3A3A3A] relative before:absolute before:top-3 before:left-3 before:right-3 before:h-0.5 before:bg-gold",
    swatchLabel: "",
  },
  {
    name: "Leather belt",
    detail: "Full grain · Tan",
    price: "PKR 1,600",
    swatchClass:
      "h-10 w-[130px] bg-[#8A5A2B] font-display text-[9px] tracking-[0.25em] text-cream font-bold",
    swatchLabel: "VEXTIO",
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
          <ProductCard key={product.name} product={product} />
        ))}
      </div>
    </section>
  );
}
