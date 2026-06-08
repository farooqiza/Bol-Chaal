import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed `middleware` -> `proxy` (runs on the Node.js runtime).
// This refreshes the Supabase session cookie and guards private routes.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all paths except static assets and files with an extension:
     * - _next/static, _next/image (build output)
     * - the PWA manifest + service worker
     * - anything ending in a common asset extension
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\\.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
