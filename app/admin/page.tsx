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
  back_image_url: string | null;
  extra_image_urls: string[] | null;
  description: string | null;
  sizes: Record<string, number> | null;
  size_chart_url: string | null;
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

  const [activeTab, setActiveTab] = useState<"products" | "sections">("products");
  const [showForm, setShowForm] = useState(false);

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
    backImageUrl: "",
    extraImageUrls: [] as string[],
    description: "",
    sizes: { S: 5, M: 5, L: 5, XL: 5, XXL: 5 } as Record<string, number>,
    sizeChartUrl: "",
    categoryId: "",
    subcategoryId: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [uploadingSizeChart, setUploadingSizeChart] = useState(false);
  const [formError, setFormError] = useState("");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryParent, setNewSubcategoryParent] = useState("");

  const [globalSizeChartUrl, setGlobalSizeChartUrl] = useState("");
  const [uploadingGlobalChart, setUploadingGlobalChart] = useState(false);

  useEffect(() => {
    if (token) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchAll() {
    setLoading(true);
    const [pRes, cRes, sRes, chartRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/categories"),
      fetch("/api/subcategories"),
      fetch("/api/content/global_size_chart_url").catch(() => null),
    ]);
    setProducts(await pRes.json());
    setCategories(await cRes.json());
    setSubcategories(await sRes.json());
    if (chartRes && chartRes.ok) {
      const data = await chartRes.json();
      setGlobalSizeChartUrl(data.value || "");
    }
    setLoading(false);
  }

  async function handleGlobalSizeChartUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingGlobalChart(true);
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (uploadRes.ok) {
      const { url } = await uploadRes.json();
      const saveRes = await fetch("/api/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key: "global_size_chart_url", value: url, section: "products" }),
      });
      if (saveRes.ok) {
        setGlobalSizeChartUrl(url);
      }
    }
    setUploadingGlobalChart(false);
  }

  async function removeGlobalSizeChart() {
    if (!token) return;
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key: "global_size_chart_url", value: "", section: "products" }),
    });
    if (res.ok) setGlobalSizeChartUrl("");
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
      backImageUrl: "",
      extraImageUrls: [],
      description: "",
      sizes: { S: 5, M: 5, L: 5, XL: 5, XXL: 5 },
      sizeChartUrl: "",
      categoryId: "",
      subcategoryId: "",
    });
    setEditingId(null);
    setFormError("");
    setShowForm(false);
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
      backImageUrl: p.back_image_url || "",
      extraImageUrls: p.extra_image_urls || [],
      description: p.description || "",
      sizes: p.sizes || { S: 5, M: 5, L: 5, XL: 5, XXL: 5 },
      sizeChartUrl: p.size_chart_url || "",
      categoryId: p.category_id || "",
      subcategoryId: p.subcategory_id || "",
    });
    setShowForm(true);
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

  async function handleBackImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingBack(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({ ...f, backImageUrl: data.url }));
    }
    setUploadingBack(false);
  }

  async function handleExtraImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingExtra(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({ ...f, extraImageUrls: [...f.extraImageUrls, data.url] }));
    }
    setUploadingExtra(false);
    e.target.value = "";
  }

  function removeExtraImage(url: string) {
    setForm((f) => ({
      ...f,
      extraImageUrls: f.extraImageUrls.filter((u) => u !== url),
    }));
  }

  async function handleSizeChartUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingSizeChart(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({ ...f, sizeChartUrl: data.url }));
    }
    setUploadingSizeChart(false);
  }

  function setSizeQty(size: string, qty: number) {
    setForm((f) => ({
      ...f,
      sizes: { ...f.sizes, [size]: Math.max(0, qty) },
    }));
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
      backImageUrl: form.backImageUrl.trim() || null,
      extraImageUrls: form.extraImageUrls,
      description: form.description.trim() || null,
      sizes: form.sizes,
      sizeChartUrl: form.sizeChartUrl.trim() || null,
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-brown">Store</h1>
        <button
          type="button"
          onClick={logoutFromEditMode}
          className="text-[12px] uppercase tracking-[0.1em] text-muted hover:text-brown"
        >
          Log out
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 border-b border-brown/15">
        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2.5 text-[13px] font-medium uppercase tracking-wide transition-colors ${
            activeTab === "products"
              ? "border-b-2 border-rust text-brown"
              : "text-muted hover:text-brown"
          }`}
        >
          Products ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sections")}
          className={`px-4 py-2.5 text-[13px] font-medium uppercase tracking-wide transition-colors ${
            activeTab === "sections"
              ? "border-b-2 border-rust text-brown"
              : "text-muted hover:text-brown"
          }`}
        >
          Sections ({categories.length})
        </button>
      </div>

      {activeTab === "products" && (
        <>
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mb-8 w-full border-2 border-dashed border-brown/25 py-4 text-[13px] font-medium uppercase tracking-wide text-muted hover:border-brown/50 hover:text-brown"
            >
              + Add a new product
            </button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mb-8 flex flex-col gap-3 border border-brown/15 p-6"
            >
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-brown">
                  {editingId ? "Edit product" : "New product"}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[12px] uppercase tracking-wide text-muted hover:text-brown"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-brown/20 bg-transparent px-4 py-2.5 text-[14px] text-brown focus:outline-none focus:border-brown"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                    Detail
                  </label>
                  <input
                    type="text"
                    placeholder="Washed cotton · Mocha"
                    value={form.detail}
                    onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
                    className="w-full border border-brown/20 bg-transparent px-4 py-2.5 text-[14px] text-brown focus:outline-none focus:border-brown"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                    Price
                  </label>
                  <input
                    type="text"
                    placeholder="PKR 2,500"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full border border-brown/20 bg-transparent px-4 py-2.5 text-[14px] text-brown focus:outline-none focus:border-brown"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                  Badge (optional)
                </label>
                <input
                  type="text"
                  placeholder="New or Ltd."
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  className="w-full border border-brown/20 bg-transparent px-4 py-2.5 text-[14px] text-brown focus:outline-none focus:border-brown"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                  Which section does this belong in?
                </label>
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
                {categories.length === 0 && (
                  <p className="mt-1.5 text-[12px] text-muted">
                    No sections yet — create one under the &quot;Sections&quot; tab first if you want to organize products.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                  Description (optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Full product description shown on the product page"
                  className="w-full border border-brown/20 bg-transparent px-4 py-2.5 text-[14px] text-brown placeholder:text-muted focus:outline-none focus:border-brown"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-muted">
                  Stock per size
                </label>
                <div className="flex flex-wrap gap-3">
                  {["S", "M", "L", "XL", "XXL"].map((size) => {
                    const qty = form.sizes[size] ?? 0;
                    return (
                      <div key={size} className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-medium text-muted">{size}</span>
                        <input
                          type="number"
                          min={0}
                          value={qty}
                          onChange={(e) => setSizeQty(size, parseInt(e.target.value, 10) || 0)}
                          className={`h-10 w-16 border text-center text-[13px] font-medium focus:outline-none ${
                            qty > 0
                              ? "border-brown/25 text-brown focus:border-brown"
                              : "border-red-300 text-red-500"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[12px] text-muted">
                  Set the quantity in stock for each size. 0 means out of stock.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                  Front photo (shown by default)
                </label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {uploading && (
                  <span className="ml-2 text-[12px] text-muted">Uploading...</span>
                )}
              </div>

              {form.imageUrl && (
                <div className="relative h-32 w-24 overflow-hidden bg-tan">
                  <Image
                    src={form.imageUrl}
                    alt="Front preview"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                  Back photo (optional — shows on hover)
                </label>
                <input type="file" accept="image/*" onChange={handleBackImageUpload} />
                {uploadingBack && (
                  <span className="ml-2 text-[12px] text-muted">Uploading...</span>
                )}
              </div>

              {form.backImageUrl && (
                <div className="relative h-32 w-24 overflow-hidden bg-tan">
                  <Image
                    src={form.backImageUrl}
                    alt="Back preview"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, backImageUrl: "" }))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-brown/80 text-[11px] text-cream"
                  >
                    ×
                  </button>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                  More photos (optional)
                </label>
                <input type="file" accept="image/*" onChange={handleExtraImageUpload} />
                {uploadingExtra && (
                  <span className="ml-2 text-[12px] text-muted">Uploading...</span>
                )}
              </div>

              {form.extraImageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.extraImageUrls.map((url) => (
                    <div key={url} className="relative h-24 w-20 overflow-hidden bg-tan">
                      <Image
                        src={url}
                        alt="Extra preview"
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExtraImage(url)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-brown/80 text-[11px] text-cream"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
                  Size chart for this product (optional — overrides the global one)
                </label>
                <input type="file" accept="image/*" onChange={handleSizeChartUpload} />
                {uploadingSizeChart && (
                  <span className="ml-2 text-[12px] text-muted">Uploading...</span>
                )}
              </div>

              {form.sizeChartUrl && (
                <div className="relative h-32 w-24 overflow-hidden bg-tan">
                  <Image
                    src={form.sizeChartUrl}
                    alt="Size chart preview"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, sizeChartUrl: "" }))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-brown/80 text-[11px] text-cream"
                  >
                    ×
                  </button>
                </div>
              )}

              {formError && <p className="text-[13px] text-red-500">{formError}</p>}

              <button
                type="submit"
                className="mt-2 bg-rust px-6 py-2.5 text-[13px] font-medium uppercase tracking-[0.1em] text-cream hover:bg-[#7a3418]"
              >
                {editingId ? "Save changes" : "Add product"}
              </button>
            </form>
          )}

          {loading ? (
            <p className="text-[14px] text-muted">Loading...</p>
          ) : products.length === 0 ? (
            <p className="text-[14px] text-muted">
              No products yet — add your first one above.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
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
        </>
      )}

      {activeTab === "sections" && (
        <>
          <div className="mb-8 border border-brown/15 p-6">
            <h2 className="mb-1 font-display text-lg font-bold text-brown">
              Global size chart
            </h2>
            <p className="mb-4 text-[13px] font-light text-muted">
              Shown on every product page, unless a product has its own size chart set.
            </p>
            <input type="file" accept="image/*" onChange={handleGlobalSizeChartUpload} />
            {uploadingGlobalChart && (
              <span className="ml-2 text-[12px] text-muted">Uploading...</span>
            )}
            {globalSizeChartUrl && (
              <div className="relative mt-3 h-32 w-24 overflow-hidden bg-tan">
                <Image
                  src={globalSizeChartUrl}
                  alt="Global size chart preview"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={removeGlobalSizeChart}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-brown/80 text-[11px] text-cream"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <p className="mb-6 text-[13px] font-light text-muted">
            Sections group your products on the shop page (e.g. &quot;Tops&quot;). Subsections are optional finer categories inside a section (e.g. &quot;Cargo&quot; inside &quot;Bottoms&quot;).
          </p>

          {categories.length === 0 ? (
            <p className="mb-6 text-[14px] text-muted">
              No sections yet — add your first one below.
            </p>
          ) : (
            <div className="mb-8 flex flex-col gap-4">
              {categories.map((cat) => (
                <div key={cat.id}>
                  <div className="flex items-center justify-between border border-brown/15 bg-tan/20 px-4 py-3">
                    <span className="text-[14px] font-medium text-brown">
                      {cat.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-[11px] uppercase tracking-wide text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="ml-4 mt-2 flex flex-col gap-1.5">
                    {subcategories
                      .filter((s) => s.category_id === cat.id)
                      .map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between border-l-2 border-brown/15 px-3 py-1.5 text-[13px]"
                        >
                          <span className="text-muted">↳ {sub.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubcategory(sub.id)}
                            className="text-[10px] uppercase tracking-wide text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    {subcategories.filter((s) => s.category_id === cat.id).length === 0 && (
                      <p className="px-3 text-[12px] text-muted">No subsections</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 border-t border-brown/15 pt-6 sm:grid-cols-2">
            <form onSubmit={handleAddCategory} className="flex flex-col gap-2">
              <label className="text-[11px] font-medium uppercase tracking-wide text-muted">
                Add a section
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Tops"
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
                Add a subsection
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
                  placeholder="e.g. Cargo"
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
        </>
      )}
    </main>
  );
}
