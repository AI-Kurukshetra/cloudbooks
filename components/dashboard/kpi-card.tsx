import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  return (
    <Card className="overflow-hidden border-white/60 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(255,251,245,0.88))]">
      <CardHeader className="pb-4">
        <CardTitle className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-display text-4xl font-semibold tracking-tight text-slate-900">{value}</div>
        <p className="mt-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-sm text-emerald-700">
          {change}
        </p>
      </CardContent>
    </Card>
  );
}
