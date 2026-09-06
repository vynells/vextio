import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ShopTeaser from "@/components/ShopTeaser";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { getSiteContent } from "@/lib/getSiteContent";

export default async function Home() {
  const content = await getSiteContent();

  return (
    <>
      <Nav />
      <Hero />
      <ShopTeaser />
      <Reveal>
        <Newsletter
          content={{
            eyebrow: content.newsletter_eyebrow || "Stay in the loop",
            headingLine1: content.newsletter_heading_line1 || "New drops.",
            headingLine2: content.newsletter_heading_line2 || "No noise.",
            body:
              content.newsletter_body ||
              "Join the Vextio list. First access to new pieces, restocks, and stories from the studio.",
            placeholder: content.newsletter_placeholder || "your@email.com",
            button: content.newsletter_button || "Subscribe",
            buttonSuccess: content.newsletter_button_success || "Subscribed",
          }}
        />
      </Reveal>
      <Footer />
    </>
  );
}
