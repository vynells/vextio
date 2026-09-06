export default function ReturnPolicy() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-20 md:px-10">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
        Legal
      </p>
      <h1 className="mb-10 font-display text-[2.4rem] font-bold text-brown">
        Return &amp; Refund Policy
      </h1>

      <div className="space-y-8 text-[14px] font-light leading-[1.8] text-muted">
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-brown">
            5-day return window
          </h2>
          <p>
            Returns are accepted <strong className="text-brown">only within 5 calendar days</strong> of
            the delivery date. Requests made after this window will not be
            accepted under any circumstances, regardless of reason.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-brown">
            Conditions for a valid return
          </h2>
          <p>To be eligible, the item must:</p>
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>Be unworn, unwashed, and unused</li>
            <li>Have all original tags attached</li>
            <li>Be returned in its original packaging</li>
            <li>Not be a final-sale or discounted item, unless faulty</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-brown">
            Non-returnable items
          </h2>
          <p>
            Items marked as final sale, undergarments, and accessories are
            not eligible for return under any circumstances.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-brown">
            How to request a return
          </h2>
          <p>
            Contact us at <span className="text-brown">03340927688</span>{" "}
            within the 5-day window with your order number and reason for
            return. Returns initiated after this period, or without prior
            contact, will be refused at the courier stage.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-brown">
            Refunds
          </h2>
          <p>
            Once a returned item is received and inspected, approved refunds
            are processed to the original payment method within 7–10
            business days. Cash on Delivery orders are refunded via bank
            transfer or Easypaisa.
          </p>
        </section>
      </div>
    </main>
  );
}
