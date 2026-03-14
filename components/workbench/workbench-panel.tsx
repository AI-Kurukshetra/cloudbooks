import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WorkbenchPanel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-white/60 bg-white/72">
      <CardHeader className="border-b border-stone-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(254,243,199,0.52)_52%,_rgba(240,253,250,0.5))]">
        <p className="text-[11px] uppercase tracking-[0.34em] text-muted-foreground">{eyebrow}</p>
        <CardTitle className="mt-3 text-3xl">{title}</CardTitle>
        <CardDescription className="mt-3 max-w-2xl text-sm leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}
