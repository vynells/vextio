"use client";

import { useState, useEffect } from "react";

type ContentRow = {
  key: string;
  value: string;
  type: string;
  section: string;
};

const STORAGE_KEY = "vextio-admin-token";

export default function ContentEditorPage() {
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setToken(stored);
  }, []);

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    setLoading(true);
    const res = await fetch("/api/content");
    const data = await res.json();
    setRows(data);
    setLoading(false);
  }

  function handleChange(key: string, value: string) {
    setEdited((e) => ({ ...e, [key]: value }));
  }

  async function handleSave(key: string) {
    if (!token || edited[key] === undefined) return;
    setSaving(key);

    const res = await fetch("/api/content", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key, value: edited[key] }),
    });

    if (res.ok) {
      setRows((prev) =>
        prev.map((r) => (r.key === key ? { ...r, value: edited[key] } : r))
      );
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 1500);
    }
    setSaving(null);
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-[600px] px-6 py-20 text-center">
        <p className="text-[14px] text-muted">
          Please log in from the{" "}
          <a href="/admin" className="text-brown underline">
            admin panel
          </a>{" "}
          first.
        </p>
      </main>
    );
  }

  const sections = Array.from(new Set(rows.map((r) => r.section)));

  return (
    <main className="mx-auto max-w-[800px] px-6 py-12">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-brown">
          Edit site content
        </h1>
        <a
          href="/admin"
          className="text-[12px] uppercase tracking-[0.1em] text-muted hover:text-brown"
        >
          ← Back to products
        </a>
      </div>
      <p className="mb-10 text-[13px] font-light text-muted">
        Changes save instantly and appear live on the site right away.
      </p>

      {loading ? (
        <p className="text-[14px] text-muted">Loading...</p>
      ) : (
        sections.map((section) => (
          <div key={section} className="mb-10">
            <h2 className="mb-4 border-b border-brown/15 pb-2 font-display text-lg font-bold text-brown">
              {section}
            </h2>
            <div className="flex flex-col gap-4">
              {rows
                .filter((r) => r.section === section)
                .map((row) => {
                  const currentValue =
                    edited[row.key] !== undefined
                      ? edited[row.key]
                      : row.value;
                  const isLong = currentValue.length > 60;
                  const hasChanged = edited[row.key] !== undefined && edited[row.key] !== row.value;

                  return (
                    <div key={row.key} className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                        {row.key.replace(/_/g, " ")}
                      </label>
                      <div className="flex items-start gap-2">
                        {isLong ? (
                          <textarea
                            value={currentValue}
                            onChange={(e) =>
                              handleChange(row.key, e.target.value)
                            }
                            rows={3}
                            className="flex-1 border border-brown/20 bg-transparent px-3 py-2 text-[14px] text-brown focus:outline-none focus:border-brown"
                          />
                        ) : (
                          <input
                            type="text"
                            value={currentValue}
                            onChange={(e) =>
                              handleChange(row.key, e.target.value)
                            }
                            className="flex-1 border border-brown/20 bg-transparent px-3 py-2 text-[14px] text-brown focus:outline-none focus:border-brown"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleSave(row.key)}
                          disabled={!hasChanged || saving === row.key}
                          className="whitespace-nowrap bg-rust px-4 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-cream hover:bg-[#7a3418] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          {saving === row.key
                            ? "Saving..."
                            : savedKey === row.key
                            ? "Saved ✓"
                            : "Save"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))
      )}
    </main>
  );
}
