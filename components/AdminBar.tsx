"use client";

import { useState, FormEvent } from "react";
import { useEditMode } from "./EditModeContext";

export default function AdminBar() {
  const { isAdmin, editMode, toggleEditMode, login, logout } = useEditMode();
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      setError("Invalid credentials");
      return;
    }
    const data = await res.json();
    login(data.token);
    setShowLogin(false);
    setUsername("");
    setPassword("");
  }

  if (!isAdmin) {
    return (
      <div className="fixed bottom-4 right-4 z-[100]">
        {showLogin ? (
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-2 border border-brown/20 bg-white p-4 shadow-lg"
          >
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border border-brown/20 px-3 py-1.5 text-[13px] text-black focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-brown/20 px-3 py-1.5 text-[13px] text-black focus:outline-none"
            />
            {error && <p className="text-[11px] text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-rust px-3 py-1.5 text-[11px] uppercase tracking-wide text-cream"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="h-3 w-3 rounded-full bg-brown/10 hover:bg-brown/30"
            aria-label="Admin login"
            title="Admin"
          />
        )}
      </div>
    );
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
