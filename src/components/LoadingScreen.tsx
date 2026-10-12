export default function LoadingScreen() {
  return (
    <div className="min-h-screen market-bg flex items-center justify-center">
      <div className="flex items-center gap-2.5 text-mkt-500 text-sm font-mono">
        <span className="relative flex h-2 w-2">
          <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-lemon-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-lemon-500" />
        </span>
        Lade…
      </div>
    </div>
  )
}
