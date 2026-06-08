// App-wide brand + product constants.

export const APP_NAME = "Bol Chaal";
export const APP_NAME_URDU = "بول چال";
export const APP_TAGLINE = "Learn everyday Urdu by actually talking.";
export const APP_DESCRIPTION =
  "Bol Chaal teaches conversational Urdu through live, voice-enabled dialogue with a warm AI tutor. Build a daily streak, earn XP, and level up from greetings to real conversations.";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Brand palette (kept in sync with the @theme tokens in app/globals.css).
export const BRAND = {
  green: "#16a34a",
  greenDark: "#15803d",
  greenLight: "#22c55e",
  amber: "#f59e0b",
  ink: "#142019",
  bgDark: "#0b1f17",
} as const;
