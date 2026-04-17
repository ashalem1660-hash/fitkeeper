// Flip AI on/off from a single env var.
// Set NEXT_PUBLIC_ENABLE_AI=true in Vercel env vars to enable.
// When off: AI buttons are hidden, motivation card uses static quotes.
export const AI_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_AI === "true";
