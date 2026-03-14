"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Banknote,
  Building2,
  BriefcaseBusiness,
  ChartColumn,
  FileText,
  Landmark,
  Package,
  Receipt,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: ChartColumn },
  { href: "/entities", label: "Entities", icon: Building2 },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/journal", label: "Journal", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/vendors", label: "Vendors", icon: Users },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/banking", label: "Banking", icon: Banknote },
  { href: "/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const activeItem =
    navigation.find((item) => pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`))) ??
    navigation[0];

  return (
    <div className="app-mesh min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[300px_1fr] xl:px-6">
        <aside className="flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.18),_transparent_26%),linear-gradient(180deg,_rgba(19,27,33,0.98),_rgba(24,35,43,0.96))] p-5 text-stone-100 shadow-luxe">
          <div className="mb-8 rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.36em] text-cyan-100/70">Accounting System</p>
            <h1 className="mt-3 font-display text-3xl font-semibold leading-none">CloudBooks Pro</h1>
            <p className="mt-3 text-sm leading-6 text-stone-300/85">
              Multi-entity ledger, subledgers, banking, and reporting in one tenant-scoped system.
            </p>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                    isActive
                      ? "bg-white text-slate-950 shadow-[0_14px_30px_rgba(255,255,255,0.14)]"
                      : "text-stone-300 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-2xl transition",
                      isActive ? "bg-slate-950 text-white" : "bg-white/6 text-stone-300 group-hover:bg-white/12",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  <ArrowUpRight
                    className={cn("h-4 w-4 transition", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-70")}
                  />
                </Link>
              );
            })}
          </nav>
          <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-stone-400">System rule</p>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Every operational document resolves to journal lines with tenant-scoped access and audit traceability.
            </p>
          </div>
        </aside>
        <main className="space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
