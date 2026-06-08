import { APP_NAME, APP_NAME_URDU } from "@/lib/constants";

/** The Bol Chaal speech-bubble logo mark. */
export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label={`${APP_NAME} logo`}
    >
      <defs>
        <linearGradient id="bc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22c55e" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#bc-grad)" />
      <path
        d="M12 16.5A4.5 4.5 0 0 1 16.5 12h15a4.5 4.5 0 0 1 4.5 4.5v9a4.5 4.5 0 0 1-4.5 4.5H22l-6.5 5.2A1 1 0 0 1 14 34.4V30h-.5A1.5 1.5 0 0 1 12 28.5z"
        fill="#ffffff"
      />
      <circle cx="19" cy="21" r="2.1" fill="#15803d" />
      <circle cx="24" cy="21" r="2.1" fill="#15803d" />
      <circle cx="29" cy="21" r="2.1" fill="#15803d" />
    </svg>
  );
}

/** Logo + wordmark lockup used in headers and the landing hero. */
export function BrandMark({
  className = "",
  showUrdu = true,
}: {
  className?: string;
  showUrdu?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Logo className="h-9 w-9" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-ink">
          {APP_NAME}
        </span>
        {showUrdu && (
          <span className="font-urdu text-sm text-brand-dark" dir="rtl">
            {APP_NAME_URDU}
          </span>
        )}
      </span>
    </span>
  );
}
