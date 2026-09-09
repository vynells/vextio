import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";

export default function PrivacyPolicy() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[720px] px-6 py-20 md:px-10">
        <FadeIn>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
            Legal
          </p>
          <h1 className="mb-10 font-legal text-[2.4rem] font-bold text-brown">
            Privacy Policy
          </h1>
        </FadeIn>

        <div className="space-y-8 text-[14px] font-light leading-[1.8] text-muted">
          <p>
            Vextio (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects
            your privacy. This policy explains what information we collect
            when you use our website and place an order, and how we use it.
          </p>

          <section>
            <h2 className="mb-2 font-legal text-lg font-bold text-brown">
              Information we collect
            </h2>
            <p>
              When you place an order we collect your name, email address or
              phone number, delivery address, and payment details necessary
              to process your order. Payment details entered on our checkout
              page are handled directly by our payment processor and are not
              stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-legal text-lg font-bold text-brown">
              How we use your information
            </h2>
            <p>
              We use your information solely to process and deliver your
              order, communicate with you about your order status, and
              respond to customer support requests. We do not sell your
              personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-legal text-lg font-bold text-brown">
              Data sharing
            </h2>
            <p>
              We share order information with our payment processor (to
              complete payment) and courier partners (to deliver your
              order). These parties only receive the information necessary
              to perform their service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-legal text-lg font-bold text-brown">
              Contact us
            </h2>
            <p>
              For any privacy-related questions, contact us at{" "}
              <span className="text-brown">03340927688</span> or visit us at
              our office in Islamabad, Pakistan.
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-16 inline-block border border-brown px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.1em] text-brown transition-colors hover:bg-brown hover:text-cream"
        >
          Return to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
