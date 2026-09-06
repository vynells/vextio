"use client";

import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  detail: string;
  price: string;
  badge: string | null;
  image_url: string;
};

const STORAGE_KEY = "vextio-admin-token";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    name: "",
    detail: "",
    price: "",
    badge: "",
    imageUrl: "",
  });
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setToken(stored);
  }, []);

  useEffect(() => {
    if (token) fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchProducts() {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      setLoginError("Invalid username or password");
      return;
    }
    const data = await res.json();
    window.localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
  }

  function handleLogout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }

  function resetForm() {
    setForm({ id: "", name: "", detail: "", price: "", badge: "", imageUrl: "" });
    setEditingId(null);
    setFormError("");
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      id: p.id,
      name: p.name,
      detail: p.detail,
      price: p.price,
      badge: p.badge || "",
      imageUrl: p.image_url,
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({ ...f, imageUrl: data.url }));
    }
    setUploading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Please at least give the product a name.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      detail: form.detail.trim() || "—",
      price: form.price.trim() || "—",
      imageUrl:
        form.imageUrl.trim() ||
        "https://placehold.co/400x500/1C1917/9B9188?text=No+image",
    };

    if (editingId) {
      const res = await fetch(`/api/products/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setFormError("Failed to update product.");
        return;
      }
    } else {
      const id =
        form.id.trim() ||
        form.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...payload, id }),
      });
      if (!res.ok) {
        setFormError("Failed to add product. The ID might already exist.");
        return;
      }
    }

    resetForm();
    fetchProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchProducts();
  }

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[380px] flex-col justify-center px-6">
        <h1 className="mb-8 font-display text-2xl font-bold text-brown">
          Admin login
        </h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-brown/20 bg-transparent px-4 py-3 text-[14px] text-brown focus:outline-none focus:border-brown"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-brown/20 bg-transparent px-4 py-3 text-[14px] text-brown focus:outline-none focus:border-brown"
          />
          {loginError && (
            <p className="text-[13px] text-red-500">{loginError}</p>
          )}
          <button
            type="submit"
            className="mt-2 bg-rust px-6 py-3 text-[13px] font-medium uppercase tracking-[0.1em] text-cream hover:bg-[#7a3418]"
          >
            Log in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[900px] px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-brown">
          Manage products
        </h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-[12px] uppercase tracking-[0.1em] text-muted hover:text-brown"
        >
          Log out
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-12 flex flex-col gap-3 border border-brown/15 p-6"
      >
        <h2 className="mb-2 font-display text-lg font-bold text-brown">
          {editingId ? "Edit product" : "Add new product"}
        </h2>

        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="border border-brown/20 bg-transparent px-4 py-2.5 text-[14px] text-brown focus:outline-none focus:border-brown"
        />
        <input
          type="text"
          placeholder="Detail (e.g. Washed cotton · Mocha)"
          value={form.detail}
          onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
          className="border border-brown/20 bg-transparent px-4 py-2.5 text-[14px] text-brown focus:outline-none focus:border-brown"
        />
        <input
          type="text"
          placeholder="Price (e.g. PKR 2,500)"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          className="border border-brown/20 bg-transparent px-4 py-2.5 text-[14px] text-brown focus:outline-none focus:border-brown"
        />
        <input
          type="text"
          placeholder="Badge (optional, e.g. New or Ltd.)"
          value={form.badge}
          onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
          className="border border-brown/20 bg-transparent px-4 py-2.5 text-[14px] text-brown focus:outline-none focus:border-brown"
        />

        <div className="flex items-center gap-4">
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {uploading && (
            <span className="text-[12px] text-muted">Uploading...</span>
          )}
        </div>

        {form.imageUrl && (
          <div className="relative h-32 w-24 overflow-hidden bg-tan">
            <Image
              src={form.imageUrl}
              alt="Preview"
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
        )}

        {formError && (
          <p className="text-[13px] text-red-500">{formError}</p>
        )}

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            className="bg-rust px-6 py-2.5 text-[13px] font-medium uppercase tracking-[0.1em] text-cream hover:bg-[#7a3418]"
          >
            {editingId ? "Save changes" : "Add product"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2.5 text-[13px] font-medium uppercase tracking-[0.1em] text-muted hover:text-brown"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="mb-4 font-display text-lg font-bold text-brown">
        Current products ({products.length})
      </h2>

      {loading ? (
        <p className="text-[14px] text-muted">Loading...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 border border-brown/15 p-3"
            >
              <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden bg-tan">
                <Image
                  src={p.image_url}
                  alt={p.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-brown">{p.name}</p>
                <p className="text-[12px] text-muted">
                  {p.detail} · {p.price}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(p)}
                className="text-[12px] uppercase tracking-[0.1em] text-muted hover:text-brown"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(p.id)}
                className="text-[12px] uppercase tracking-[0.1em] text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
