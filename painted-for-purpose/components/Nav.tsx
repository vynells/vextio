"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { site } from "@/lib/site";

const links = [
  { href: "/about", label: "About" },
  { href: "/impact", label: "Impact" },
  { href: "/shop", label: "Shop" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-canvas/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-marigold font-display text-lg font-bold">
            P4P
          </span>
          <span className="hidden font-display text-xl font-bold sm:inline">{site.name}</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`font-semibold underline-offset-8 hover:underline ${path === l.href ? "underline decoration-coral decoration-4" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/join" className="btn btn-primary">
            Join a session
          </Link>
        </div>

        <button
          className="rounded-lg border-2 border-ink px-3 py-1 font-semibold md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t-2 border-ink px-4 pb-6 pt-2 md:hidden">
          {[...links, { href: "/join", label: "Join a session" }].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 font-display text-2xl font-bold"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
