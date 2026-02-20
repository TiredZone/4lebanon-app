import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: `سياسة الخصوصية لموقع ${SITE_CONFIG.nameAr}`,
}

export default function PrivacyPage() {
  return (
    <div className="bg-muted min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-primary mb-6 text-3xl font-bold">سياسة الخصوصية</h1>
        <div className="space-y-6 rounded-lg bg-white p-8 shadow-sm">
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-800">جمع المعلومات</h2>
            <p className="leading-relaxed text-gray-600">
              نحن نحترم خصوصيتكم ونلتزم بحماية بياناتكم الشخصية. لا نقوم بجمع أي معلومات شخصية إلا
              ما هو ضروري لتقديم خدماتنا.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-800">استخدام ملفات تعريف الارتباط</h2>
            <p className="leading-relaxed text-gray-600">
              قد نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربة التصفح وتحليل حركة المرور على
              الموقع.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-800">حماية البيانات</h2>
            <p className="leading-relaxed text-gray-600">
              نتخذ إجراءات أمنية مناسبة لحماية معلوماتكم من الوصول غير المصرح به أو التعديل أو
              الإفصاح أو الإتلاف.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-800">التواصل معنا</h2>
            <p className="leading-relaxed text-gray-600">
              إذا كان لديكم أي استفسارات حول سياسة الخصوصية، يرجى التواصل معنا عبر صفحة اتصل بنا.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
