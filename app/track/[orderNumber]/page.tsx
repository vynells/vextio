"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";

type TrackedOrder = {
  orderNumber: string;
  status: string;
  firstName: string;
  city: string;
  items: { name: string; qty: number; size?: string; price: string }[];
  total: string;
  createdAt: string;
  updatedAt: string;
};

const FLOW = ["pending", "processing", "shipped", "delivered"];

const FLOW_LABELS: Record<string, string> = {
  pending: "Order placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function TrackOrderPage() {
  const params = useParams();
  const orderNumber = params?.orderNumber as string;

  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/orders/track/${orderNumber}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [orderNumber]);

  if (loading) {
    return (
      <>
        <Nav />
        <main className="mx-auto flex min-h-[50vh] max-w-[600px] items-center justify-center px-6">
          <p className="text-[14px] text-muted">Loading order status...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !order) {
    return (
      <>
        <Nav />
        <main className="mx-auto flex min-h-[50vh] max-w-[600px] flex-col items-center justify-center px-6 text-center">
          <p className="mb-2 text-[14px] text-brown">We couldn&apos;t find that order.</p>
          <p className="text-[13px] text-muted">
            Double-check the order number from your confirmation email.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const isException = order.status === "cancelled" || order.status === "returned";
  const currentStepIndex = FLOW.indexOf(order.status);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[600px] px-6 py-16 md:py-20">
        <FadeIn>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.25em] text-rust">
            Order tracking
          </p>
          <h1 className="mb-2 font-display text-[1.8rem] font-bold text-brown">
            #{order.orderNumber}
          </h1>
          <p className="mb-10 text-[14px] text-muted">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>

          {isException ? (
            <div className="mb-10 border border-brown/15 bg-tan/30 p-6 text-center">
              <p className="text-[15px] font-medium capitalize text-brown">
                This order has been {order.status}
              </p>
              <p className="mt-1 text-[13px] text-muted">
                Last updated {new Date(order.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="mb-10">
              <div className="relative flex justify-between">
                {FLOW.map((step, i) => {
                  const isDone = i <= currentStepIndex;
                  return (
                    <div key={step} className="relative z-10 flex flex-1 flex-col items-center">
                      <div
                        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 text-[12px] font-medium transition-colors ${
                          isDone
                            ? "border-rust bg-rust text-cream"
                            : "border-brown/20 bg-cream text-muted"
                        }`}
                      >
                        {isDone ? "✓" : i + 1}
                      </div>
                      <p
                        className={`text-center text-[11px] font-medium uppercase tracking-wide ${
                          isDone ? "text-brown" : "text-muted"
                        }`}
                      >
                        {FLOW_LABELS[step]}
                      </p>
                    </div>
                  );
                })}
                <div className="absolute left-0 right-0 top-4 -z-0 h-[2px] bg-brown/10">
                  <div
                    className="h-full bg-rust transition-all duration-500"
                    style={{
                      width: `${(currentStepIndex / (FLOW.length - 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-brown/10 pt-6">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted">
              Order summary
            </p>
            <div className="flex flex-col gap-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[13px]">
                  <span className="text-brown">
                    {item.name}
                    {item.size && <span className="text-muted"> — {item.size}</span>}
                    <span className="text-muted"> × {item.qty}</span>
                  </span>
                  <span className="text-brown">{item.price}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-brown/10 pt-3 font-legal text-[15px] font-bold text-brown">
              <span>Total</span>
              <span>PKR {Number(order.total).toLocaleString("en-PK")}</span>
            </div>
          </div>
        </FadeIn>
      </main>
      <Footer />
    </>
  );
}
