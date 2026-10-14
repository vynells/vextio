"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/site";
import Mark from "./Mark";

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="relative z-30">
      <a href="#main" className="btn btn-gold absolute left-4 top-3 -translate-y-24 focus:translate-y-0">
        Skip to content
      </a>
      <nav aria-label="Main" className="wrap flex h-20 items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3" aria-label={`${site.name}, home`}>
          <Mark className="h-11 w-auto transition-transform duration-500 ease-out group-hover:-rotate-6" />
          <span className="font-display text-[1.625rem] uppercase leading-none tracking-wide">{site.name}</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {nav.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={path === l.href ? "page" : undefined}
                className="link text-lead decoration-transparent aria-[current=page]:decoration-gold hover:decoration-gold"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/shop" className="btn btn-gold">Shop shirts</Link>
          </li>
        </ul>

        <button
          type="button"
          className="btn btn-gold md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </nav>

      <div
        id="mobile-menu"
        hidden={!open}
        className="absolute inset-x-0 top-20 bg-gold pb-10 pt-4 text-green md:hidden"
      >
        <ul className="wrap">
          {[{ href: "/", label: "Home" }, ...nav].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={path === l.href ? "page" : undefined}
                className="on-paper block py-2 font-display text-[3.25rem] uppercase leading-none aria-[current=page]:underline"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
