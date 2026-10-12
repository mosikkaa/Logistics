export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-9 w-48 rounded-lg bg-line" />
      <div className="flex gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[54px] flex-1 rounded-xl bg-white" />
        ))}
      </div>
      <div className="h-[480px] rounded-2xl bg-white" />
    </div>
  );
}
