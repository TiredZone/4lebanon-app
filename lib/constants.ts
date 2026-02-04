// Site configuration constants

export const SITE_CONFIG = {
  name: '4Lebanon',
  nameAr: '4Lebanon',
  description: 'موقع إخباري لبناني مستقل',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://4lebanon.com',
  locale: 'ar',
  direction: 'rtl' as const,
}

// Navigation items
export const NAV_ITEMS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/important', label: 'الأخبار المهمة' },
  { href: '/section/radar', label: 'رادار' },
  { href: '/section/investigation', label: 'بحث وتحرّي' },
  { href: '/section/local', label: 'المحليّة' },
  { href: '/section/security', label: 'أمن وقضاء' },
  { href: '/section/regional', label: 'إقليمي ودولي' },
  { href: '/writers', label: 'كتّابنا' },
  { href: '/section/economy', label: 'اقتصاد' },
  { href: '/section/special', label: 'خاص' },
] as const

// Footer navigation
export const FOOTER_NAV = {
  sections: [
    { href: '/important', label: 'أخبار عاجلة' },
    { href: '/section/local', label: 'المحليّة' },
    { href: '/section/security', label: 'أمن وقضاء' },
    { href: '/section/economy', label: 'اقتصاد' },
  ],
}

// Social media links
export const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/4lebanon',
  twitter: 'https://twitter.com/4lebanon',
  instagram: 'https://instagram.com/4lebanon',
  telegram: 'https://t.me/4lebanon',
  whatsapp: 'https://wa.me/9611234567',
  youtube: 'https://youtube.com/@4lebanon',
}

// Pagination defaults
export const PAGINATION = {
  defaultPageSize: 12,
  searchPageSize: 20,
  relatedArticlesCount: 4,
  mostReadCount: 5,
  tickerItemsCount: 10,
}

// Revalidation times (in seconds)
export const REVALIDATE = {
  homepage: 120, // 2 minutes
  section: 180, // 3 minutes
  article: 600, // 10 minutes
  author: 300, // 5 minutes
  rss: 300, // 5 minutes
  sitemap: 3600, // 1 hour
}

// Image sizes for next/image
export const IMAGE_SIZES = {
  thumbnail: {
    width: 150,
    height: 100,
  },
  card: {
    width: 400,
    height: 250,
  },
  featured: {
    width: 800,
    height: 450,
  },
  hero: {
    width: 1200,
    height: 630,
  },
  avatar: {
    width: 80,
    height: 80,
  },
}

// Article status options
export const ARTICLE_STATUSES = [
  { value: 'draft', label: 'مسودة' },
  { value: 'scheduled', label: 'مجدول' },
  { value: 'published', label: 'منشور' },
] as const

// Error messages in Arabic
export const ERROR_MESSAGES = {
  generic: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  notFound: 'الصفحة غير موجودة',
  unauthorized: 'يجب تسجيل الدخول للوصول إلى هذه الصفحة',
  forbidden: 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
  articleNotFound: 'المقال غير موجود',
  authorNotFound: 'الكاتب غير موجود',
  searchError: 'حدث خطأ أثناء البحث',
  saveError: 'حدث خطأ أثناء الحفظ',
  deleteError: 'حدث خطأ أثناء الحذف',
  uploadError: 'حدث خطأ أثناء رفع الصورة',
}

// Success messages in Arabic
export const SUCCESS_MESSAGES = {
  articleSaved: 'تم حفظ المقال بنجاح',
  articlePublished: 'تم نشر المقال بنجاح',
  articleDeleted: 'تم حذف المقال بنجاح',
  imageUploaded: 'تم رفع الصورة بنجاح',
  profileUpdated: 'تم تحديث الملف الشخصي بنجاح',
}

// Metadata defaults
export const DEFAULT_METADATA = {
  title: SITE_CONFIG.nameAr,
  description: SITE_CONFIG.description,
  openGraph: {
    type: 'website',
    locale: 'ar_LB',
    siteName: SITE_CONFIG.nameAr,
  },
  twitter: {
    card: 'summary_large_image',
  },
}
