"use client";

import { useEffect, useState, ReactNode } from "react";

export default function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 20 + delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 500ms ease, transform 500ms ease",
      }}
    >
      {children}
    </div>
  );
}
