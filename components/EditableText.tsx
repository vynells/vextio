"use client";

import { useState, useEffect, useRef } from "react";
import { useEditMode } from "./EditModeContext";

type EditableTextProps = {
  contentKey: string;
  defaultValue: string;
  as?: "span" | "p" | "h1" | "h2" | "h3";
  className?: string;
  multiline?: boolean;
};

export default function EditableText({
  contentKey,
  defaultValue,
  as = "span",
  className = "",
  multiline = false,
}: EditableTextProps) {
  const { editMode, token } = useEditMode();
  const [value, setValue] = useState(defaultValue);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(defaultValue);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/content/${contentKey}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.value) {
          setValue(data.value);
          setDraft(data.value);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  async function handleSave() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key: contentKey, value: draft }),
    });
    if (res.ok) {
      setValue(draft);
    } else {
      setDraft(value);
    }
    setSaving(false);
    setEditing(false);
  }

  const Tag = as;

  if (!editMode) {
    return <Tag className={className}>{value}</Tag>;
  }

  if (editing) {
    return multiline ? (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        disabled={saving}
        rows={3}
        className={`${className} w-full resize-y border-2 border-dashed border-rust bg-white/90 text-black outline-none`}
      />
    ) : (
      <input
        ref={ref}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        disabled={saving}
        className={`${className} w-full border-2 border-dashed border-rust bg-white/90 text-black outline-none`}
      />
    );
  }

  return (
    <Tag
      onClick={() => setEditing(true)}
      className={`${className} cursor-pointer outline-dashed outline-2 outline-offset-2 outline-rust/50 transition-colors hover:bg-rust/10`}
      title="Click to edit"
    >
      {value}
    </Tag>
  );
}
