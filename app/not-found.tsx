import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="bg-muted flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-primary mb-4 text-6xl font-bold">404</h1>
        <h2 className="text-foreground mb-4 text-2xl font-bold">الصفحة غير موجودة</h2>
        <p className="text-muted-foreground mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <Link
          href="/"
          className="bg-primary inline-block rounded-lg px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  )
}
