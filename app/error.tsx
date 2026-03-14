"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/85 p-8 shadow-soft">
        <p className="text-[11px] uppercase tracking-[0.34em] text-muted-foreground">Application Error</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-slate-900">Unable to load this page</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          An unexpected error occurred while loading the current view. Retry the request or return to the dashboard.
        </p>
        <div className="mt-6 flex gap-3">
          <Button type="button" onClick={reset}>
            Retry
          </Button>
          <Button asChild variant="outline">
            <a href="/dashboard">Go to dashboard</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
