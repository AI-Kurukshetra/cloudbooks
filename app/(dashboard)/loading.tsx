function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[1.5rem] bg-stone-200/80 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2.4rem] border border-white/60 bg-white/70 p-8 shadow-soft">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="mt-5 h-14 w-2/3" />
        <SkeletonBlock className="mt-4 h-5 w-full max-w-3xl" />
        <SkeletonBlock className="mt-2 h-5 w-full max-w-2xl" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <SkeletonBlock className="h-[26rem]" />
        <SkeletonBlock className="h-[26rem]" />
      </div>
    </div>
  );
}
