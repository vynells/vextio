import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";

export default function HelpPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[600px] px-6 py-16 md:py-24">
        <FadeIn>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
            We&apos;re here to help
          </p>
          <h1 className="mb-4 font-display text-[2.2rem] font-bold text-brown">
            Need a hand with something?
          </h1>
          <p className="mb-10 text-[14px] leading-relaxed text-muted">
            Whether it&apos;s a question about your order, sizing, returns, or anything
            else — reach out and we&apos;ll get back to you as soon as we can.
          </p>

          <div className="flex flex-col gap-4">
            <a
              href="https://wa.me/923340927688"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between border border-brown/15 px-6 py-5 transition-colors hover:border-brown/40"
            >
              <div>
                <p className="mb-1 text-[15px] font-medium text-brown">
                  Message us on WhatsApp
                </p>
                <p className="text-[13px] text-muted">+92 334 0927688</p>
              </div>
              <span className="text-brown">→</span>
            </a>

            <a
              href="mailto:help@blackoutmc.xyz"
              className="flex items-center justify-between border border-brown/15 px-6 py-5 transition-colors hover:border-brown/40"
            >
              <div>
                <p className="mb-1 text-[15px] font-medium text-brown">
                  Email our support team
                </p>
                <p className="text-[13px] text-muted">help@blackoutmc.xyz</p>
              </div>
              <span className="text-brown">→</span>
            </a>
          </div>

          <p className="mt-10 text-[13px] text-muted">
            Placed an order already? You can also{" "}
            <Link href="/products" className="underline underline-offset-2 hover:text-brown">
              track it from your confirmation email
            </Link>
            .
          </p>
        </FadeIn>
      </main>
      <Footer />
    </>
  );
}
