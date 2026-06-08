/**
 * Logs the user out via a server route so auth cookies are cleared correctly.
 * Works without client JS (plain form POST).
 */
export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={
          className ||
          "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-zinc-50"
        }
      >
        Log out
      </button>
    </form>
  );
}
