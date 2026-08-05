/**
 * Whether the custom ad system is enabled. Reads the NEXT_PUBLIC_ flag, which
 * Next.js inlines at build time (works in server and client components).
 * Default off — production stays clean until this is set to 'true'.
 */
export function adsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'
}
