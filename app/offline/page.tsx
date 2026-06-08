import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="bg-brand-radial flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <BrandMark />
      <h1 className="mt-8 text-2xl font-extrabold text-ink">
        You&apos;re offline
      </h1>
      <p className="mt-2 max-w-sm text-muted">
        Bol Chaal needs a connection to talk with your tutor. Reconnect and try
        again — your streak is safe.
      </p>
    </div>
  );
}
