import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'من نحن',
  description: `تعرّف على ${SITE_CONFIG.nameAr} - موقع إخباري لبناني مستقل`,
}

export default function AboutPage() {
  return (
    <div className="bg-muted min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-primary mb-6 text-3xl font-bold">من نحن</h1>
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <p className="mb-4 text-lg leading-relaxed text-gray-700">
            {SITE_CONFIG.nameAr} هو موقع إخباري لبناني مستقل يهدف إلى تقديم الأخبار والتحليلات
            بمصداقية وشفافية.
          </p>
          <p className="mb-4 leading-relaxed text-gray-600">
            نسعى لتغطية الأحداث المحلية والإقليمية والدولية بأسلوب مهني وموضوعي، مع التركيز على
            القضايا التي تهم المواطن اللبناني.
          </p>
          <p className="leading-relaxed text-gray-600">
            فريقنا مكوّن من صحفيين وكتّاب متخصصين يعملون على مدار الساعة لتوفير تغطية شاملة
            ومتوازنة.
          </p>
        </div>
      </div>
    </div>
  )
}
