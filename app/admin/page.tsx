"use client";

import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import { useEditMode } from "@/components/EditModeContext";

type Product = {
  id: string;
  name: string;
  detail: string;
  price: string;
  badge: string | null;
  image_url: string;
  category_id: string | null;
  subcategory_id: string | null;
};

type Category = { id: string; name: string; sort_order: number };
type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
};

export default function AdminPage() {
  const {
    isAdmin,
    token,
    login: loginToEditMode,
    logout: logoutFromEditMode,
  } = useEditMode();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    name: "",
    detail: "",
    price: "",
    badge: "",
    imageUrl: "",
    categoryId: "",
    subcategoryId: "",
  });
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryParent, setNewSubcategoryParent] = useState("");

  useEffect(() => {
    if (token) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchAll() {
    setLoading(true);
    const [pRes, cRes, sRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/categories"),
      fetch("/api/subcategories"),
    ]);
    setProducts(await pRes.json());
    setCategories(await cRes.json());
    setSubcategories(await sRes.json());
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
    loginToEditMode(data.token);
  }

  function slugify(text: string) {
    return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim() || !token) return;
    const id = slugify(newCategoryName);
    await fetch("/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, name: newCategoryName.trim(), sortOrder: categories.length }),
    });
    setNewCategoryName("");
    fetchAll();
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Delete this section? Products inside will become uncategorized.")) return;
    await fetch(`/api/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAll();
  }

  async function handleAddSubcategory(e: FormEvent) {
    e.preventDefault();
    if (!newSubcategoryName.trim() || !newSubcategoryParent || !token) return;
    const id = `${newSubcategoryParent}-${slugify(newSubcategoryName)}`;
    await fetch("/api/subcategories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id,
        categoryId: newSubcategoryParent,
        name: newSubcategoryName.trim(),
        sortOrder: subcategories.filter((s) => s.category_id === newSubcategoryParent).length,
      }),
    });
    setNewSubcategoryName("");
    fetchAll();
  }

  async function handleDeleteSubcategory(id: string) {
    if (!confirm("Delete this subsection? Products inside will move to the parent section.")) return;
    await fetch(`/api/subcategories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAll();
  }

  function resetForm() {
    setForm({
      id: "",
      name: "",
      detail: "",
      price: "",
      badge: "",
      imageUrl: "",
      categoryId: "",
      subcategoryId: "",
    });
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
      categoryId: p.category_id || "",
      subcategoryId: p.subcategory_id || "",
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
      categoryId: form.categoryId || null,
      subcategoryId: form.subcategoryId || null,
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
      const id = form.id.trim() || slugify(form.name);

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
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAll();
  }

  function categoryName(id: string | null) {
    if (!id) return "Uncategorized";
    return categories.find((c) => c.id === id)?.name || id;
  }

  function subcategoryName(id: string | null) {
    if (!id) return null;
    return subcategories.find((s) => s.id === id)?.name || id;
  }

  const relevantSubcategories = subcategories.filter(
    (s) => s.category_id === form.categoryId
  );

  if (!isAdmin) {
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
          Manage store
        </h1>
        <button
          type="button"
          onClick={logoutFromEditMode}
          className="text-[12px] uppercase tracking-[0.1em] text-muted hover:text-brown"
        >
          Log out
        </button>
      </div>

      {/* Sections management */}
      <section className="mb-12 border border-brown/15 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-brown">
          Sections
        </h2>

        <div className="mb-6 flex flex-col gap-3">
          {categories.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center justify-between border border-brown/10 bg-tan/20 px-4 py-2.5">
                <span className="text-[14px] font-medium text-brown">
                  {cat.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-[11px] uppercase tracking-wide text-red-500 hover:text-red-700"
                >
                  Delete section
                </button>
              </div>
              <div className="ml-4 mt-1.5 flex flex-col gap-1.5">
                {subcategories
                  .filter((s) => s.category_id === cat.id)
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between border-l-2 border-brown/15 px-3 py-1.5 text-[13px]"
                    >
                      <span className="text-muted">{sub.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubcategory(sub.id)}
                        className="text-[10px] uppercase tracking-wide text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <form onSubmit={handleAddCategory} className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted">
              New section (e.g. Tops)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Section name"
                className="flex-1 border border-brown/20 bg-transparent px-3 py-2 text-[13px] text-brown focus:outline-none"
              />
              <button
                type="submit"
                className="bg-brown px-4 py-2 text-[11px] uppercase tracking-wide text-cream"
              >
                Add
              </button>
            </div>
          </form>

          <form onSubmit={handleAddSubcategory} className="flex flex-col gap-2">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted">
              New subsection (e.g. Cargo under Bottoms)
            </label>
            <div className="flex gap-2">
              <select
                value={newSubcategoryParent}
                onChange={(e) => setNewSubcategoryParent(e.target.value)}
                className="border border-brown/20 bg-transparent px-2 py-2 text-[13px] text-brown focus:outline-none"
              >
                <option value="">Section...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="Subsection name"
                className="flex-1 border border-brown/20 bg-transparent px-3 py-2 text-[13px] text-brown focus:outline-none"
              />
              <button
                type="submit"
                className="bg-brown px-4 py-2 text-[11px] uppercase tracking-wide text-cream"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Product form */}
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

        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.categoryId}
            onChange={(e) =>
              setForm((f) => ({ ...f, categoryId: e.target.value, subcategoryId: "" }))
            }
            className="border border-brown/20 bg-transparent px-3 py-2.5 text-[13px] text-brown focus:outline-none"
          >
            <option value="">No section</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={form.subcategoryId}
            onChange={(e) => setForm((f) => ({ ...f, subcategoryId: e.target.value }))}
            disabled={!form.categoryId}
            className="border border-brown/20 bg-transparent px-3 py-2.5 text-[13px] text-brown focus:outline-none disabled:opacity-40"
          >
            <option value="">No subsection</option>
            {relevantSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

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

        {formError && <p className="text-[13px] text-red-500">{formError}</p>}

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
                <p className="text-[11px] uppercase tracking-wide text-rust">
                  {categoryName(p.category_id)}
                  {subcategoryName(p.subcategory_id) &&
                    ` / ${subcategoryName(p.subcategory_id)}`}
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
