import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Statement from "@/components/Statement";
import ShopTeaser from "@/components/ShopTeaser";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <Statement />
      <ShopTeaser />
      <Reveal>
        <Newsletter />
      </Reveal>
      <Footer />
    </>
  );
}
