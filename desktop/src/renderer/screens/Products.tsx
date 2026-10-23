import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bridge } from "../bridge";
import { Area, Button, ease, Empty, Fade, Field, Icon, Spinner, useKey, useToast } from "../ui/kit";

export type Product = {
  id: string; name: string; detail: string; price: string; badge: string | null; image_url: string; back_image_url: string | null;
  extra_image_urls: string[] | null; description: string | null; sizes: Record<string, number> | null; size_chart_url: string | null;
  category_id: string | null; subcategory_id: string | null;
};
type Category = { id: string; name: string };
type Subcategory = { id: string; category_id: string; name: string };
type Data = { products: Product[]; categories: Category[]; subcategories: Subcategory[] };

const DEFAULT_SIZES = { S: 5, M: 5, L: 5, XL: 5, XXL: 5 };
const PLACEHOLDER = "placehold.co";

export default function Products({ version }: { version: number }) {
  const [d, setD] = useState<Data | null>(null);
  const [term, setTerm] = useState("");
  const [section, setSection] = useState<string>("all");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [sections, setSections] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    const r = await bridge.api<Data>("GET", "products");
    if (r.ok) setD(r.data); else toast(r.data.error || "Couldn’t load products.", "error");
  }, [toast]);
  useEffect(() => { load(); }, [load, version]);

  const catName = (id: string | null) => d?.categories.find((c) => c.id === id)?.name;
  const list = useMemo(() => (d?.products ?? []).filter((p) =>
    (section === "all" || (section === "none" ? !p.category_id : p.category_id === section)) &&
    (!term || [p.name, p.price, p.detail, p.badge ?? ""].some((v) => v.toLowerCase().includes(term.toLowerCase())))
  ), [d, term, section]);
  const units = (p: Product) => Object.values(p.sizes ?? {}).reduce((a, n) => a + Number(n || 0), 0);

  return (
    <div className="relative flex h-full flex-col px-8 pb-6 pt-7">
      <Fade className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-tight">Products</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">{d ? `${d.products.length} products in the shop · ${d.categories.length} sections` : "Loading…"}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative block w-56">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search products…" type="search"
              className="h-10 w-full rounded-lg bg-white/[0.04] pl-9 pr-3 text-[13px] outline-none ring-1 ring-white/[0.08] focus:ring-2 focus:ring-pink" />
          </label>
          <button type="button" className="btn btn-ghost h-10" onClick={() => setSections(true)}>Sections</button>
          <button type="button" className="btn btn-accent h-10" onClick={() => setEditing("new")}><Icon name="plus" className="h-4 w-4" />Add product</button>
        </div>
      </Fade>

      {d && d.categories.length > 0 && (
        <Fade i={1} className="mt-5 flex flex-wrap gap-1.5">
          {[{ id: "all", name: "All" }, ...d.categories, { id: "none", name: "No section" }].map((c) => (
            <button key={c.id} type="button" onClick={() => setSection(c.id)}
              className={`h-8 rounded-lg px-3 text-[12.5px] font-semibold ring-1 transition active:scale-95 ${section === c.id ? "bg-paper text-night ring-paper" : "text-ink-muted ring-line hover:text-ink"}`}>{c.name}</button>
          ))}
        </Fade>
      )}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {!d ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card aspect-[4/5] animate-pulse" />)}</div>
        ) : list.length === 0 ? (
          <div className="card"><Empty icon="tag" title={term || section !== "all" ? "Nothing here" : "No products yet"} text={term || section !== "all" ? "Try another search or section." : "Click Add product to put your first piece in the shop."} /></div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 pb-2">
            {list.map((p, i) => (
              <motion.button key={p.id} type="button" onClick={() => setEditing(p)} whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 16) * 0.02 } }}
                className="card group overflow-hidden text-left transition hover:ring-pink/40">
                <div className="relative aspect-[4/5] bg-white/[0.03]">
                  {p.image_url && !p.image_url.includes(PLACEHOLDER)
                    ? <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                    : <span className="grid h-full place-items-center text-ink-muted"><Icon name="tag" className="h-8 w-8" /></span>}
                  {p.badge && <span className="absolute left-2 top-2 rounded bg-blue px-1.5 py-0.5 text-[11px] font-bold text-paper">{p.badge}</span>}
                  <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-black/60 text-paper opacity-0 transition group-hover:opacity-100"><Icon name="edit" className="h-3.5 w-3.5" /></span>
                </div>
                <div className="p-3">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="mt-0.5 flex justify-between gap-2 text-[12px] text-ink-muted">
                    <span className="truncate">{p.price}{catName(p.category_id) ? ` · ${catName(p.category_id)}` : ""}</span>
                    <span className={`shrink-0 tabular-nums ${Object.keys(p.sizes ?? {}).length && units(p) === 0 ? "text-coral" : ""}`}>{Object.keys(p.sizes ?? {}).length ? `${units(p)} left` : ""}</span>
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && d && <Editor key={editing === "new" ? "new" : editing.id} product={editing === "new" ? null : editing} data={d} onClose={() => setEditing(null)} onSaved={load} />}
      </AnimatePresence>
      <AnimatePresence>
        {sections && d && <Sections data={d} onClose={() => setSections(false)} onChanged={load} />}
      </AnimatePresence>
    </div>
  );
}

// ---------- Photo upload ----------

/** Shrinks a photo to at most 1600px and re-encodes it as JPEG, so it uploads fast and shows in every email app. */
async function prepare(file: File): Promise<{ data: string; type: string; name: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL("image/jpeg", 0.86);
  return { data: url.slice(url.indexOf(",") + 1), type: "image/jpeg", name: file.name };
}

function useUpload() {
  const toast = useToast();
  return useCallback(async (file: File): Promise<string | null> => {
    try {
      const r = await bridge.api<{ url: string }>("POST", "upload", await prepare(file));
      if (r.ok) return r.data.url;
      toast(r.data.error || "Couldn’t upload that photo.", "error");
    } catch {
      toast("That file isn’t a photo the app can read. Try a JPG or PNG.", "error");
    }
    return null;
  }, [toast]);
}

function PhotoSlot({ label, url, onChange, small }: { label: string; url: string; onChange: (url: string) => void; small?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = useUpload();
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    const u = await upload(file);
    setBusy(false);
    if (u) onChange(u);
  };
  const has = url && !url.includes(PLACEHOLDER);
  return (
    <div className={small ? "w-24" : "w-40"}>
      <p className="text-[12px] font-semibold text-ink-body">{label}</p>
      <div
        className={`group relative mt-1.5 aspect-[4/5] overflow-hidden rounded-lg bg-white/[0.03] ring-1 ring-dashed ring-white/[0.14] transition hover:ring-pink`}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}>
        <button type="button" onClick={() => input.current?.click()} className="absolute inset-0 grid place-items-center" aria-label={`Upload ${label}`}>
          {has ? <img src={url} alt="" className="h-full w-full object-cover" /> : (
            <span className="flex flex-col items-center gap-1 text-[11.5px] text-ink-muted"><Icon name="plus" className="h-5 w-5" />{small ? "" : "Upload or drop"}</span>
          )}
        </button>
        {busy && <span className="absolute inset-0 grid place-items-center bg-black/60"><Spinner className="h-5 w-5" /></span>}
        {has && !busy && (
          <button type="button" onClick={() => onChange("")} aria-label={`Remove ${label}`} title="Remove photo"
            className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-md bg-black/70 text-paper opacity-0 transition group-hover:opacity-100"><Icon name="close" className="h-3.5 w-3.5" /></button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

// ---------- Editor ----------

type Form = {
  name: string; detail: string; price: string; badge: string; image_url: string; back_image_url: string; extra_image_urls: string[];
  description: string; sizes: [string, string][]; size_chart_url: string; category_id: string; subcategory_id: string;
};
const toForm = (p: Product | null): Form => ({
  name: p?.name ?? "", detail: p?.detail === "—" ? "" : p?.detail ?? "", price: p?.price === "—" ? "" : p?.price ?? "", badge: p?.badge ?? "",
  image_url: p?.image_url?.includes(PLACEHOLDER) ? "" : p?.image_url ?? "", back_image_url: p?.back_image_url ?? "", extra_image_urls: p?.extra_image_urls ?? [],
  description: p?.description ?? "", sizes: Object.entries(p ? p.sizes ?? {} : DEFAULT_SIZES).map(([k, v]) => [k, String(v)]),
  size_chart_url: p?.size_chart_url ?? "", category_id: p?.category_id ?? "", subcategory_id: p?.subcategory_id ?? "",
});

function Editor({ product, data, onClose, onSaved }: { product: Product | null; data: Data; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState<Form>(() => toForm(product));
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();
  const dirty = JSON.stringify(v) !== JSON.stringify(toForm(product));
  const close = () => { if (!dirty || confirm("Discard your changes to this product?")) onClose(); };
  useKey("escape", () => close(), [dirty]);
  useKey("mod+s", (e) => { e.preventDefault(); save(); }, [v]);

  const subs = data.subcategories.filter((s) => s.category_id === v.category_id);
  const set = <K extends keyof Form>(k: K, val: Form[K]) => setV((f) => ({ ...f, [k]: val }));

  const save = async () => {
    setBusy("save"); setErrs({});
    const sizes = Object.fromEntries(v.sizes.filter(([k]) => k.trim()).map(([k, n]) => [k.trim().toUpperCase(), Math.max(0, Math.round(Number(n) || 0))]));
    const body = { ...v, sizes, extra_image_urls: v.extra_image_urls.filter(Boolean), subcategory_id: subs.some((s) => s.id === v.subcategory_id) ? v.subcategory_id : "" };
    const r = await bridge.api("POST", product ? `products/${encodeURIComponent(product.id)}` : "products", body);
    setBusy(null);
    if (r.ok) { toast(r.data.ok || "Saved."); onSaved(); onClose(); }
    else { setErrs(r.data.fields ?? {}); toast(r.data.error || "Couldn’t save.", "error"); }
  };
  const remove = async () => {
    if (!product) return;
    setBusy("delete");
    const r = await bridge.api("POST", `products/${encodeURIComponent(product.id)}/delete`, {});
    setBusy(null);
    if (r.ok) { toast(r.data.ok || "Deleted."); onSaved(); onClose(); } else toast(r.data.error || "Couldn’t delete.", "error");
  };

  return (
    <>
      <motion.div className="absolute inset-0 z-30 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
      <motion.aside role="dialog" aria-label={product ? `Edit ${product.name}` : "New product"}
        className="absolute bottom-0 right-0 top-0 z-40 flex w-[min(720px,94%)] flex-col border-l border-white/[0.08] bg-[#101010] shadow-pop"
        initial={{ x: 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 48, opacity: 0 }} transition={{ duration: 0.32, ease }}>
        <div className="flex shrink-0 items-center gap-3 border-b border-line px-6 py-4">
          <h2 className="min-w-0 flex-1 truncate text-[22px]">{product ? product.name : "New product"}</h2>
          {product && <button type="button" className="btn btn-quiet h-8 text-[12px]" onClick={() => bridge.getConfig().then((c) => bridge.open(`${c.server}/products/${product.id}`))}>View in shop<Icon name="external" className="h-3.5 w-3.5" /></button>}
          <button type="button" onClick={close} aria-label="Close (Esc)" className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition hover:bg-white/[0.07] hover:text-ink active:scale-90"><Icon name="close" className="h-4 w-4" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <section className="card p-5">
            <p className="label">Photos</p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <PhotoSlot label="Main photo" url={v.image_url} onChange={(u) => set("image_url", u)} />
              <PhotoSlot label="Back" url={v.back_image_url} onChange={(u) => set("back_image_url", u)} small />
              {v.extra_image_urls.map((u, i) => (
                <PhotoSlot key={i} label={`Extra ${i + 1}`} url={u} small
                  onChange={(nu) => set("extra_image_urls", nu ? v.extra_image_urls.map((x, j) => (j === i ? nu : x)) : v.extra_image_urls.filter((_, j) => j !== i))} />
              ))}
              {v.extra_image_urls.length < 12 && <PhotoSlot key={`add-${v.extra_image_urls.length}`} label="Add more" url="" small onChange={(u) => u && set("extra_image_urls", [...v.extra_image_urls, u])} />}
            </div>
            <p className="mt-3 text-[12px] text-ink-muted">Photos are resized and saved as JPG automatically, so they load fast and show in order emails.</p>
          </section>

          <section className="card grid grid-cols-2 gap-3 p-5">
            <p className="label col-span-2">Details</p>
            <Field className="col-span-2" label="Name" value={v.name} error={errs.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Frayed denim jacket" autoFocus={!product} />
            <Field label="Price" value={v.price} onChange={(e) => set("price", e.target.value)} placeholder="PKR 2,300" hint="Type it the way the shop should show it." />
            <Field label={<>Badge <span className="font-normal text-ink-muted">(optional)</span></>} value={v.badge} onChange={(e) => set("badge", e.target.value)} list="badges" placeholder="New, Ltd., Sale…" />
            <datalist id="badges">{["New", "Ltd.", "Sale", "Restocked", "Last few"].map((b) => <option key={b} value={b} />)}</datalist>
            <Field className="col-span-2" label={<>Short line <span className="font-normal text-ink-muted">(under the name)</span></>} value={v.detail} onChange={(e) => set("detail", e.target.value)} placeholder="e.g. Heavyweight cotton · oversized fit" />
            <Area className="col-span-2" rows={4} label="Description" value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="What it’s made of, how it fits, care instructions…" />
            {!product && <Field className="col-span-2" label={<>Web address <span className="font-normal text-ink-muted">(optional)</span></>} value={v.name ? `/products/${v.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}` : ""} readOnly hint="Made from the name. It can’t be changed later." error={errs.id} />}
          </section>

          <section className="card grid grid-cols-2 gap-3 p-5">
            <p className="label col-span-2">Section</p>
            <Select label="Section" value={v.category_id} onChange={(x) => setV((f) => ({ ...f, category_id: x, subcategory_id: "" }))}
              options={[["", "No section"], ...data.categories.map((c) => [c.id, c.name] as [string, string])]} />
            <Select label="Sub-section" value={v.subcategory_id} onChange={(x) => set("subcategory_id", x)} disabled={!subs.length}
              options={[["", subs.length ? "None" : "No sub-sections"], ...subs.map((s) => [s.id, s.name] as [string, string])]} />
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <p className="label">Sizes and stock</p>
              <div className="flex gap-1.5">
                {v.sizes.length === 0 && <button type="button" className="btn btn-quiet h-8 text-[12px]" onClick={() => set("sizes", Object.entries(DEFAULT_SIZES).map(([k, n]) => [k, String(n)]))}>Use S–XXL</button>}
                <button type="button" className="btn btn-ghost h-8 text-[12px]" onClick={() => set("sizes", [...v.sizes, ["", "0"]])}><Icon name="plus" className="h-3.5 w-3.5" />Add size</button>
              </div>
            </div>
            {v.sizes.length === 0
              ? <p className="mt-3 text-[13px] text-ink-muted">No sizes. Customers won’t pick a size and stock isn’t tracked (good for accessories).</p>
              : (
                <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
                  {v.sizes.map(([size, qty], i) => (
                    <div key={i} className="flex items-center gap-1 rounded-lg bg-white/[0.02] p-1.5 ring-1 ring-line">
                      <input value={size} aria-label="Size" placeholder="Size" onChange={(e) => set("sizes", v.sizes.map((row, j) => (j === i ? [e.target.value.toUpperCase(), row[1]] : row)))}
                        className="h-8 w-14 rounded-md bg-white/[0.04] px-2 text-center text-[13px] font-bold uppercase outline-none focus:ring-2 focus:ring-pink" />
                      <input value={qty} aria-label={`${size || "Size"} stock`} inputMode="numeric" onChange={(e) => set("sizes", v.sizes.map((row, j) => (j === i ? [row[0], e.target.value.replace(/[^\d]/g, "")] : row)))}
                        className="h-8 w-14 rounded-md bg-white/[0.04] px-2 text-center text-[13px] tabular-nums outline-none focus:ring-2 focus:ring-pink" />
                      <button type="button" aria-label={`Remove size ${size}`} onClick={() => set("sizes", v.sizes.filter((_, j) => j !== i))} className="grid h-8 w-7 place-items-center text-ink-muted transition hover:text-coral"><Icon name="close" className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            <div className="mt-4 flex items-end gap-4 border-t border-line pt-4">
              <PhotoSlot label="Size chart" url={v.size_chart_url} onChange={(u) => set("size_chart_url", u)} small />
              <p className="pb-1 text-[12px] text-ink-muted">Optional. Leave empty to use the shop’s general size chart.</p>
            </div>
          </section>

          {product && (
            <section className="card p-5">
              <p className="label">Remove</p>
              {!confirmDelete
                ? <button type="button" className="btn btn-ghost mt-3" onClick={() => setConfirmDelete(true)}>Delete this product…</button>
                : (
                  <div className="mt-3 flex items-center gap-3 rounded-lg bg-coral/10 p-3 ring-1 ring-coral/30">
                    <p className="flex-1 text-[13px] text-coral">It disappears from the shop straight away. Past orders keep their details.</p>
                    <button type="button" className="btn btn-quiet" onClick={() => setConfirmDelete(false)}>Keep it</button>
                    <Button busy={busy === "delete"} onClick={remove} className="btn-danger">Delete</Button>
                  </div>
                )}
            </section>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-line px-6 py-3">
          <span className="text-[12px] text-ink-muted">{dirty ? "Unsaved changes" : product ? "No changes" : ""}</span>
          <button type="button" className="btn btn-quiet ml-auto" onClick={close}>Cancel</button>
          <Button busy={busy === "save"} disabled={!v.name.trim() || (!!product && !dirty)} onClick={save} className="btn-primary">{product ? "Save changes" : "Add to shop"} <span className="kbd">Ctrl S</span></Button>
        </div>
      </motion.aside>
    </>
  );
}

function Select({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-ink-body">{label}</span>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="input appearance-none disabled:opacity-50">
        {options.map(([k, l]) => <option key={k} value={k} className="bg-raised">{l}</option>)}
      </select>
    </label>
  );
}

// ---------- Sections ----------

function Sections({ data, onClose, onChanged }: { data: Data; onClose: () => void; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [subName, setSubName] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useKey("escape", () => onClose());

  const run = async (route: string, body: object) => {
    setBusy(true);
    const r = await bridge.api("POST", route, body);
    setBusy(false);
    if (r.ok) { toast(r.data.ok || "Done."); onChanged(); return true; }
    toast(r.data.error || "That didn’t work.", "error");
    return false;
  };
  const count = (id: string) => data.products.filter((p) => p.category_id === id).length;

  return (
    <motion.div className="absolute inset-0 z-40 grid place-items-center bg-black/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div role="dialog" aria-label="Shop sections" onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[80%] w-[560px] flex-col overflow-hidden rounded-2xl bg-raised shadow-pop ring-1 ring-white/[0.1]"
        initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2, ease }}>
        <div className="flex items-center border-b border-line px-5 py-4">
          <div className="flex-1"><h2 className="text-[20px]">Shop sections</h2><p className="text-[12.5px] text-ink-muted">How products are grouped on the website. Removing a section keeps its products.</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-ink-muted hover:bg-white/[0.07] hover:text-ink"><Icon name="close" className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-5">
          {data.categories.length === 0 && <p className="text-[13px] text-ink-muted">No sections yet.</p>}
          {data.categories.map((c) => (
            <div key={c.id} className="rounded-lg bg-white/[0.02] p-3 ring-1 ring-line">
              <div className="flex items-center gap-2">
                <p className="flex-1 font-semibold">{c.name} <span className="ml-1 text-[12px] font-normal text-ink-muted">{count(c.id)} products</span></p>
                <button type="button" className="btn btn-quiet h-7 px-2 text-[12px]" disabled={busy}
                  onClick={() => confirm(`Remove the ${c.name} section? Its products stay in the shop without a section.`) && run(`categories/${encodeURIComponent(c.id)}/delete`, {})}>Remove</button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {data.subcategories.filter((s) => s.category_id === c.id).map((s) => (
                  <span key={s.id} className="flex items-center gap-1 rounded-md bg-white/[0.05] py-1 pl-2 pr-1 text-[12px]">
                    {s.name}
                    <button type="button" aria-label={`Remove ${s.name}`} disabled={busy} onClick={() => run(`subcategories/${encodeURIComponent(s.id)}/delete`, {})} className="grid h-5 w-5 place-items-center rounded text-ink-muted hover:text-coral"><Icon name="close" className="h-3 w-3" /></button>
                  </span>
                ))}
                <form className="flex items-center gap-1" onSubmit={async (e) => { e.preventDefault(); if (await run("subcategories", { name: subName[c.id], categoryId: c.id })) setSubName({ ...subName, [c.id]: "" }); }}>
                  <input value={subName[c.id] ?? ""} onChange={(e) => setSubName({ ...subName, [c.id]: e.target.value })} placeholder="+ sub-section"
                    className="h-7 w-32 rounded-md bg-transparent px-2 text-[12px] outline-none ring-1 ring-line focus:ring-pink" />
                </form>
              </div>
            </div>
          ))}
        </div>
        <form className="flex gap-2 border-t border-line p-4" onSubmit={async (e) => { e.preventDefault(); if (await run("categories", { name })) setName(""); }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New section, e.g. Jackets" className="input mt-0 flex-1" />
          <Button busy={busy} disabled={!name.trim()} type="submit" className="btn-primary h-[42px]">Add section</Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
