export default function PublicarLoading() {
  return (
    <div className="fixed inset-0 z-[2100] flex flex-col bg-[var(--bg-primary)] pt-[max(0.25rem,env(safe-area-inset-top))]">
      <div className="flex min-h-0 flex-1 flex-col px-3 pt-1">
        <div className="mx-auto aspect-square w-full max-w-md animate-pulse rounded-[1.25rem] bg-[var(--bg-secondary)]" />
      </div>
    </div>
  );
}
