"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [visible, setVisible] = useState(true);
  const isFirstRender = useRef(true);
  const prevPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPathname.current = pathname;
      return;
    }

    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    setVisible(false);

    const swapTimeout = setTimeout(() => {
      setDisplayChildren(children);
      // wait one more frame so the browser paints the invisible state
      // before we flip it back to visible - this is what removes the flash
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    }, 200);

    return () => clearTimeout(swapTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 250ms ease",
      }}
    >
      {displayChildren}
    </div>
  );
}
