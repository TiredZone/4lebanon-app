import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'الشروط والأحكام',
  description: `الشروط والأحكام لاستخدام موقع ${SITE_CONFIG.nameAr}`,
}

export default function TermsPage() {
  return (
    <div className="bg-muted min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-primary mb-6 text-3xl font-bold">الشروط والأحكام</h1>
        <div className="space-y-6 rounded-lg bg-white p-8 shadow-sm">
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-800">شروط الاستخدام</h2>
            <p className="leading-relaxed text-gray-600">
              باستخدامك لموقع {SITE_CONFIG.nameAr}، فإنك توافق على الالتزام بالشروط والأحكام
              التالية. يرجى قراءتها بعناية.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-800">حقوق الملكية الفكرية</h2>
            <p className="leading-relaxed text-gray-600">
              جميع المحتويات المنشورة على هذا الموقع، بما في ذلك النصوص والصور والتصاميم، هي ملك لـ{' '}
              {SITE_CONFIG.nameAr} ومحمية بموجب قوانين حقوق الملكية الفكرية.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-800">إعادة النشر</h2>
            <p className="leading-relaxed text-gray-600">
              يُسمح بمشاركة روابط المقالات على وسائل التواصل الاجتماعي. لا يُسمح بإعادة نشر المقالات
              كاملة دون إذن مسبق.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-800">إخلاء المسؤولية</h2>
            <p className="leading-relaxed text-gray-600">
              نبذل قصارى جهدنا لضمان دقة المعلومات المنشورة، لكننا لا نتحمل المسؤولية عن أي أخطاء أو
              سهو قد يحدث.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
