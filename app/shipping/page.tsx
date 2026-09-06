export default function ShippingPolicy() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-20 md:px-10">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
        Legal
      </p>
      <h1 className="mb-10 font-display text-[2.4rem] font-bold text-brown">
        Shipping Policy
      </h1>

      <div className="space-y-8 text-[14px] font-light leading-[1.8] text-muted">
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-brown">
            Delivery areas
          </h2>
          <p>
            We currently ship to all major cities across Pakistan. Delivery
            times may vary slightly for remote areas.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-brown">
            Processing time
          </h2>
          <p>
            Orders are processed within 1–2 business days of being placed.
            You will be notified once your order has shipped.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-brown">
            Delivery time
          </h2>
          <p>
            Standard delivery takes 3–5 business days within major cities,
            and 5–7 business days for other locations, from the date of
            dispatch.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-brown">
            Shipping charges
          </h2>
          <p>
            Shipping costs are calculated at checkout based on your delivery
            address.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-brown">
            Order tracking
          </h2>
          <p>
            Once dispatched, you will receive tracking details via your
            provided contact information.
          </p>
        </section>
      </div>
    </main>
  );
}
