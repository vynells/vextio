"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, ReactNode, MouseEvent as ReactMouseEvent } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Intercept clicks on internal links so we can fade out BEFORE navigating,
  // instead of reacting after the new page has already rendered.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (anchor.target === "_blank") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (href === pathname) return;

      e.preventDefault();
      setVisible(false);
      setPendingHref(href);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Once faded out, actually navigate
  useEffect(() => {
    if (!pendingHref) return;
    const timeout = setTimeout(() => {
      router.push(pendingHref);
    }, 220);
    return () => clearTimeout(timeout);
  }, [pendingHref, router]);

  // Once the new page has arrived (pathname changed), fade back in
  useEffect(() => {
    setPendingHref(null);
    const timeout = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 250ms ease",
      }}
    >
      {children}
    </div>
  );
}
