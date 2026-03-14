"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export function NavigationFeedback() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "pending" | "finishing">("idle");
  const mountedRef = useRef(false);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      const targetAttr = anchor.getAttribute("target");
      if (!href || targetAttr === "_blank" || anchor.hasAttribute("download") || href.startsWith("#")) {
        return;
      }

      const url = new URL(href, window.location.href);
      const sameLocation =
        url.origin === window.location.origin &&
        url.pathname === window.location.pathname &&
        url.search === window.location.search;

      if (url.origin !== window.location.origin || sameLocation) {
        return;
      }

      setState("pending");
    };

    const handlePopState = () => {
      setState("pending");
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    if (state === "pending") {
      setState("finishing");
      const timeout = window.setTimeout(() => setState("idle"), 260);
      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [pathname, state]);

  const visible = state !== "idle";

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 origin-left bg-gradient-to-r from-cyan-600 via-teal-500 to-orange-400 shadow-[0_0_24px_rgba(14,116,144,0.45)] transition-all duration-300",
          !visible && "scale-x-0 opacity-0",
          state === "pending" && "scale-x-[0.72] opacity-100",
          state === "finishing" && "scale-x-100 opacity-100",
        )}
      />
    </>
  );
}
