import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

// Our supported locales
export const locales = ['ar', 'en', 'fr'] as const
export type Locale = (typeof locales)[number]

// Default locale
export const defaultLocale: Locale = 'ar'

export default getRequestConfig(async () => {
  // Get locale from cookie or use default, with validation to prevent path traversal
  const cookieStore = await cookies()
  const rawLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale: Locale =
    rawLocale && (locales as readonly string[]).includes(rawLocale)
      ? (rawLocale as Locale)
      : defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
