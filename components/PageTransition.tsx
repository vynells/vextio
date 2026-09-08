"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(false);
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setVisible(true);
    }, 150);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 300ms ease",
      }}
    >
      {displayChildren}
    </div>
  );
}
