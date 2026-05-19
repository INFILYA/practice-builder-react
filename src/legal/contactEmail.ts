/** Support / legal contact for Terms & Privacy (override with `VITE_LEGAL_CONTACT_EMAIL` in `.env`). */
const viteEnv = (import.meta as unknown as { env?: Record<string, string> }).env

export const LEGAL_CONTACT_EMAIL =
  viteEnv?.VITE_LEGAL_CONTACT_EMAIL?.trim() || 'infilya89@gmail.com'
