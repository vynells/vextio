"use client";

import { useEditMode } from "./EditModeContext";

export default function AdminBar() {
  const { isAdmin, editMode, toggleEditMode, logout } = useEditMode();

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 border border-brown/20 bg-white px-4 py-2.5 shadow-lg">
      <span className="text-[12px] font-medium text-black">
        {editMode ? "Edit mode ON" : "Edit mode off"}
      </span>
      <button
        type="button"
        onClick={toggleEditMode}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          editMode ? "bg-rust" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            editMode ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <a
        href="/admin"
        className="ml-2 text-[11px] uppercase tracking-wide text-muted hover:text-black"
      >
        Products
      </a>
      <button
        type="button"
        onClick={logout}
        className="text-[11px] uppercase tracking-wide text-muted hover:text-black"
      >
        Log out
      </button>
    </div>
  );
}
