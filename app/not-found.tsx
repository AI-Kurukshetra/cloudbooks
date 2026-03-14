import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/85 p-8 shadow-soft">
        <p className="text-[11px] uppercase tracking-[0.34em] text-muted-foreground">Not Found</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The requested route does not exist or is no longer available in this environment.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
