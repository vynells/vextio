"use client";

import { useState, FormEvent } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (!isValid) {
      setError("Enter a valid email");
      return;
    }

    setError("");
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 2000);
  }

  return (
    <section className="bg-brown px-6 py-20 text-center md:px-10">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
        Stay in the loop
      </p>
      <h2 className="mb-4 font-display text-[1.8rem] font-bold leading-tight text-cream md:text-[3rem]">
        New drops.
        <br />
        No noise.
      </h2>
      <p className="mx-auto mb-10 max-w-md text-[14px] font-light text-cream/55">
        Join the Vextio list. First access to new pieces, restocks, and
        stories from the studio.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-[420px] flex-col gap-2 sm:flex-row sm:gap-0"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          placeholder="your@email.com"
          aria-label="Email address"
          suppressHydrationWarning
          className={`flex-1 border bg-cream/[0.08] px-5 py-3.5 text-[14px] text-cream placeholder:text-cream/35 focus:outline-none ${
            error ? "border-red-500" : "border-cream/20"
          }`}
        />
        <button
          type="submit"
          className="whitespace-nowrap bg-rust px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#7a3418]"
        >
          {subscribed ? "Subscribed" : "Subscribe"}
        </button>
      </form>
      {error && (
        <p className="mt-3 text-[13px] text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
