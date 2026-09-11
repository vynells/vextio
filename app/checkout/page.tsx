"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import { useCart } from "@/components/CartContext";
import { parsePrice, formatPKR } from "@/lib/price";

type PaymentMethod = "cod" | "card" | "bank" | "easypaisa";

export default function CheckoutPage() {
  const { items, removeItem, clearCart } = useCart();

  const subtotal = items.reduce(
    (sum, item) => sum + parsePrice(item.price) * item.qty,
    0
  );
  const shipping = items.length > 0 ? 300 : 0;

  const [contact, setContact] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);
  const [payment] = useState<PaymentMethod>("cod");
  const [placed, setPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (payment !== "cod" || items.length === 0) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/send-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact,
          firstName,
          lastName,
          address,
          apartment,
          city,
          postalCode,
          phone,
          paymentMethod: "Cash on Delivery",
          items,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send order");
      }

      setPlaced(true);
      clearCart();
    } catch {
      setError(
        "Something went wrong placing your order. Please try again or contact us directly."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (placed) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-[520px] flex-col items-center justify-center px-6 py-20 text-center">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
          Order confirmed
        </p>
        <h1 className="mb-4 font-legal text-[2rem] font-bold text-brown">
          Thanks, {firstName}.
        </h1>
        <p className="text-[14px] font-light leading-relaxed text-muted">
          Your order will be delivered to {address}, {city}. Pay in cash when
          it arrives. We&apos;ll contact you at {contact} with updates.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 px-6 py-16 md:grid-cols-[1.3fr_1fr] md:px-10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        {/* Contact */}
        <section>
          <h2 className="mb-4 font-legal text-lg font-bold text-brown">
            Contact
          </h2>
          <input
            type="text"
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email or phone number"
            className="w-full border border-brown/20 bg-transparent px-4 py-3 text-[14px] text-brown placeholder:text-muted focus:outline-none focus:border-brown"
          />
        </section>

        {/* Delivery */}
        <section>
          <h2 className="mb-4 font-legal text-lg font-bold text-brown">
            Delivery
          </h2>
          <div className="flex flex-col gap-3">
            <div className="border border-brown/20 bg-tan/30 px-4 py-3 text-[14px] text-muted">
              Pakistan
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="border border-brown/20 bg-transparent px-4 py-3 text-[14px] text-brown placeholder:text-muted focus:outline-none focus:border-brown"
              />
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="border border-brown/20 bg-transparent px-4 py-3 text-[14px] text-brown placeholder:text-muted focus:outline-none focus:border-brown"
              />
            </div>

            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
              className="border border-brown/20 bg-transparent px-4 py-3 text-[14px] text-brown placeholder:text-muted focus:outline-none focus:border-brown"
            />

            <input
              type="text"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              placeholder="Apartment, suite, etc. (optional)"
              className="border border-brown/20 bg-transparent px-4 py-3 text-[14px] text-brown placeholder:text-muted focus:outline-none focus:border-brown"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="border border-brown/20 bg-transparent px-4 py-3 text-[14px] text-brown placeholder:text-muted focus:outline-none focus:border-brown"
              />
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Postal code (optional)"
                className="border border-brown/20 bg-transparent px-4 py-3 text-[14px] text-brown placeholder:text-muted focus:outline-none focus:border-brown"
              />
            </div>

            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="border border-brown/20 bg-transparent px-4 py-3 text-[14px] text-brown placeholder:text-muted focus:outline-none focus:border-brown"
            />

            <label className="mt-1 flex items-center gap-2 text-[13px] font-light text-muted">
              <input
                type="checkbox"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
                className="h-4 w-4"
              />
              Save this information for next time
            </label>
          </div>
        </section>

        {/* Payment */}
        <section>
          <h2 className="mb-4 font-legal text-lg font-bold text-brown">
            Payment
          </h2>
          <p className="mb-4 text-[12px] font-light text-muted">
            All transactions are secure and encrypted.
          </p>

          <div className="flex flex-col border border-brown/20">
            <PaymentOption
              id="card"
              label="Card (Debit & Credit)"
              selected={false}
              disabled
            />
            <PaymentOption
              id="bank"
              label="All Pakistani banks"
              selected={false}
              disabled
            />
            <PaymentOption
              id="easypaisa"
              label="Easypaisa"
              selected={false}
              disabled
            />
            <PaymentOption
              id="cod"
              label="Cash on Delivery (COD)"
              selected={payment === "cod"}
              disabled={false}
              isLast
            />
          </div>
        </section>

        {error && (
          <p className="text-[13px] text-red-500" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={items.length === 0 || submitting}
          className="w-full bg-rust px-6 py-4 text-[13px] font-medium uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#7a3418] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Placing order..." : "Place order — Cash on Delivery"}
        </button>
      </form>

      {/* Order summary */}
      <aside className="h-fit border border-brown/15 bg-tan/20 p-6">
        <h3 className="mb-5 font-legal text-base font-bold text-brown">
          Order summary
        </h3>

        {items.length === 0 ? (
          <p className="text-[13px] font-light text-muted">
            Your cart is empty.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div key={`${item.id}-${item.size ?? ""}`} className="flex items-center gap-3">
                <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden bg-tan">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="text-[13px] font-medium text-brown">
                    {item.name}
                    {item.size && (
                      <span className="ml-1 font-normal text-muted">— {item.size}</span>
                    )}
                  </p>
                  <p className="text-[12px] font-light text-muted">
                    Qty {item.qty}
                  </p>
                </div>
                <p className="text-[13px] font-bold text-brown">
                  {formatPKR(parsePrice(item.price) * item.qty)}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.id, item.size)}
                  aria-label={`Remove ${item.name}`}
                  className="text-lg leading-none text-muted hover:text-brown"
                >
                  ×
                </button>
              </div>
            ))}

            <div className="flex flex-col gap-2 border-t border-brown/15 pt-4 text-[13px]">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatPKR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPKR(shipping)}</span>
              </div>
              <div className="flex justify-between border-t border-brown/15 pt-2 text-[15px] font-bold text-brown">
                <span>Total</span>
                <span>{formatPKR(subtotal + shipping)}</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </main>
  );
}

function PaymentOption({
  id,
  label,
  selected,
  disabled,
  isLast,
}: {
  id: string;
  label: string;
  selected: boolean;
  disabled: boolean;
  isLast?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center justify-between gap-3 px-4 py-4 text-[14px] ${
        isLast ? "" : "border-b border-brown/20"
      } ${disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
    >
      <span className="flex items-center gap-3">
        <input
          type="radio"
          id={id}
          name="payment"
          checked={selected}
          disabled={disabled}
          readOnly
          className="h-4 w-4"
        />
        <span className="text-brown">{label}</span>
      </span>
      {disabled && (
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
          Unavailable
        </span>
      )}
    </label>
  );
}
