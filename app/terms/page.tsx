import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[720px] px-6 py-20 md:px-10">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
          Legal
        </p>
        <h1 className="mb-10 font-display text-[2.4rem] font-bold text-brown">
          Terms &amp; Conditions
        </h1>

        <div className="space-y-8 text-[14px] font-light leading-[1.8] text-muted">
          <section>
            <h2 className="mb-2 font-display text-lg font-bold text-brown">
              General
            </h2>
            <p>
              By accessing and using the Vextio website, you agree to be
              bound by these terms and conditions. If you do not agree,
              please do not use this website.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-bold text-brown">
              Orders and payment
            </h2>
            <p>
              All orders are subject to acceptance and availability. Prices
              listed are in Pakistani Rupees (PKR) and are subject to change
              without notice. Payment must be completed through one of our
              supported payment methods at checkout, or via Cash on Delivery
              where available.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-bold text-brown">
              Product information
            </h2>
            <p>
              We make every effort to display our products accurately.
              However, we do not guarantee that colours and details will be
              perfectly accurate due to display and photography variations.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-bold text-brown">
              Returns
            </h2>
            <p>
              All returns are governed by our{" "}
              <Link href="/returns" className="text-brown underline">
                Return &amp; Refund Policy
              </Link>
              , including the strict 5-day return window.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-bold text-brown">
              Limitation of liability
            </h2>
            <p>
              Vextio is not liable for any indirect or consequential loss
              arising from the use of this website or products purchased
              through it.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-bold text-brown">
              Contact
            </h2>
            <p>
              Vextio, Islamabad, Pakistan
              <br />
              Phone: 03340927688
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
