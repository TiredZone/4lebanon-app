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
  { href: '/section/local', label: 'أخبار محلية' },
  { href: '/section/regional', label: 'إقليمي' },
  { href: '/section/international', label: 'دولي' },
  { href: '/section/said-and-said', label: 'قيل و قال' },
  { href: '/section/economy', label: 'إقتصاد' },
  { href: '/section/opinions', label: 'أراء و مقالات' },
] as const

// Footer navigation
export const FOOTER_NAV = {
  sections: [
    { href: '/section/local', label: 'أخبار محلية' },
    { href: '/section/regional', label: 'إقليمي' },
    { href: '/section/international', label: 'دولي' },
    { href: '/section/economy', label: 'إقتصاد' },
  ],
  about: [
    { href: '/about', label: 'من نحن' },
    { href: '/contact', label: 'اتصل بنا' },
    { href: '/privacy', label: 'سياسة الخصوصية' },
    { href: '/terms', label: 'الشروط والأحكام' },
  ],
}

// Social media links
export const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/4lebanon',
  twitter: 'https://twitter.com/4lebanon',
  instagram: 'https://instagram.com/4lebanon',
  whatsapp: 'https://wa.me/9611234567',
}

// Contact email
export const CONTACT_EMAIL = 'anisabisaad@4lebanon.com'

// Pagination defaults
export const PAGINATION = {
  defaultPageSize: 12,
  searchPageSize: 20,
  relatedArticlesCount: 3,
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
  { value: 'published', label: 'منشور' },
] as const

// Article priority levels (1=highest, 5=lowest)
export const ARTICLE_PRIORITIES = [
  { value: 1, label: 'تثبيت في الأعلى', color: '#dc2626' },
  { value: 2, label: 'عاجل', color: '#ea580c' },
  { value: 3, label: 'مميز', color: '#7c3aed' },
  { value: 4, label: 'عادي', color: '#6b7280' },
  { value: 5, label: 'منخفض', color: '#94a3b8' },
] as const

// Maximum number of pinned articles (priority 1) allowed at any time
export const MAX_PINNED_ARTICLES = 3

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
  sectionCreated: 'تم إنشاء القسم بنجاح',
  sectionDeleted: 'تم حذف القسم بنجاح',
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
