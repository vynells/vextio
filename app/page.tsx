import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Shop from "@/components/Shop";
import Lookbook from "@/components/Lookbook";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/CartContext";

export default function Home() {
  return (
    <CartProvider>
      <Nav />
      <Hero />
      <Marquee />
      <Shop />
      <Lookbook />
      <Newsletter />
      <Footer />
    </CartProvider>
  );
}
