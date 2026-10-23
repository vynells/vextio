export const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled", "returned"] as const;
export type Status = (typeof STATUSES)[number];

export const statusInfo: Record<Status, { label: string; customer: string; tone: string; dot: string; hex: string }> = {
  pending: { label: "Verify payment", customer: "Order placed", tone: "bg-ochre/10 text-ochre ring-ochre/25", dot: "bg-ochre", hex: "#e8b94a" },
  processing: { label: "To ship", customer: "Processing", tone: "bg-pink/10 text-pink ring-pink/25", dot: "bg-pink", hex: "#9cb832" },
  shipped: { label: "Shipped", customer: "On its way", tone: "bg-sky/10 text-sky ring-sky/25", dot: "bg-sky", hex: "#8fc4e8" },
  delivered: { label: "Delivered", customer: "Delivered", tone: "bg-paper/10 text-paper ring-paper/25", dot: "bg-paper", hex: "#edebe6" },
  cancelled: { label: "Cancelled", customer: "Cancelled", tone: "bg-coral/10 text-coral ring-coral/25", dot: "bg-coral", hex: "#ff5a4f" },
  returned: { label: "Returned", customer: "Returned", tone: "bg-lavender/10 text-lavender ring-lavender/25", dot: "bg-lavender", hex: "#c9a7e8" },
};

export type Item = { id: string; name: string; price: string; qty: number; size?: string; imageUrl?: string };

export type Order = {
  number: string; name: string; first_name: string; last_name: string; email: string; contact: string; phone: string;
  city: string; address: string; apartment: string; postal_code: string; payment: string;
  items: Item[]; summary: string; subtotal: number; shipping: number; total: number; status: Status;
  courier: string; tracking_number: string; tracking_url: string; created_at: string; updated_at: string;
};
export type OrderEvent = { id: number; kind: "status" | "note" | "email"; status: Status | null; message: string; actor: string; created_at: string };

export const needsAction = (s: Status) => s === "pending" || s === "processing";
export const isCod = (o: Pick<Order, "payment">) => o.payment === "Cash on Delivery";
