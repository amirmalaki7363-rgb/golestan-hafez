"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Fade-up on scroll entrance wrapper */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  dir,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "span" | "h2" | "p";
  dir?: "ltr" | "rtl";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      style={{ animationDelay: `${delay}ms` }}
      dir={dir}
      className={cn("gh-reveal", visible && "gh-visible", className)}
    >
      {children}
    </Tag>
  );
}
