/** Shown when Supabase env vars are missing so the app explains itself
 * instead of throwing. */
export function ConfigNotice() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-accent/30 bg-accent/10 p-6 text-sm text-ink">
      <h2 className="mb-2 text-base font-bold">Finish setup to continue</h2>
      <p className="text-muted">
        Bol Chaal needs your Supabase keys. Create a{" "}
        <code className="rounded bg-black/5 px-1">.env.local</code> file (copy{" "}
        <code className="rounded bg-black/5 px-1">.env.example</code>) and set:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-ink/90 p-3 text-xs text-white">
        {`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...`}
      </pre>
      <p className="mt-3 text-muted">
        Then restart the dev server. See{" "}
        <code className="rounded bg-black/5 px-1">README.md</code> for the full
        guide.
      </p>
    </div>
  );
}
