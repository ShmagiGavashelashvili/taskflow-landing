/** Loading state for app pages while their data streams in. */
export default function AppLoading() {
  return (
    <div className="mx-auto grid max-w-5xl gap-4" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-64 rounded-lg bg-tint" />
      <div className="h-40 rounded-2xl bg-tint/70" />
    </div>
  );
}
