export default function PublicarLoading() {
  return (
    <div className="fixed inset-0 z-[2100] flex flex-col bg-[var(--bg-primary)]">
      <header className="flex shrink-0 items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <span className="h-11 w-11 rounded-full bg-[var(--bg-secondary)]" aria-hidden />
        <span className="text-sm font-bold text-[var(--text-primary)]">Publicar</span>
        <span className="w-11" aria-hidden />
      </header>
      <div className="flex min-h-0 flex-1 flex-col px-4 pt-3">
        <div className="mx-auto aspect-square w-full max-w-md animate-pulse rounded-[1.25rem] bg-[var(--bg-secondary)]" />
      </div>
    </div>
  );
}
