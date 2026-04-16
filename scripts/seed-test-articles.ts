/**
 * Seed test articles across all 4 user accounts for role testing.
 * Run with: npx tsx scripts/seed-test-articles.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Articles grouped by author email
const articlesByAuthor: Record<
  string,
  Array<{
    title_ar: string
    excerpt_ar: string
    body_md: string
    section_slug: string
    is_breaking: boolean
    is_featured: boolean
    priority: number
    cover_image_url: string
  }>
> = {
  // ANIS - Super Admin (7 articles across sections)
  'anisabisaad@4lebanon.com': [
    {
      title_ar: 'مجلس الوزراء يقرّ خطة الطوارئ الاقتصادية لدعم الليرة اللبنانية',
      excerpt_ar:
        'في جلسة استثنائية عُقدت اليوم، أقرّ مجلس الوزراء خطة طوارئ اقتصادية شاملة تهدف إلى استقرار سعر صرف الليرة اللبنانية ودعم القطاعات الإنتاجية.',
      body_md: `<h2>خطة الطوارئ الاقتصادية</h2><p>أقرّ مجلس الوزراء اللبناني في جلسته الاستثنائية اليوم خطة طوارئ اقتصادية شاملة تتضمن عدة محاور أساسية.</p><h3>أبرز بنود الخطة</h3><ul><li><strong>دعم القطاع المصرفي</strong>: إعادة هيكلة البنوك وضمان حقوق المودعين</li><li><strong>تحفيز القطاعات الإنتاجية</strong>: تقديم قروض ميسّرة للصناعة والزراعة</li><li><strong>إصلاح قطاع الكهرباء</strong>: خطة لمعالجة أزمة الكهرباء خلال 18 شهراً</li><li><strong>الحماية الاجتماعية</strong>: زيادة المساعدات للأسر الأكثر فقراً</li></ul><p>صرّح رئيس الحكومة عقب الجلسة: "هذه الخطة تمثل خارطة طريق واضحة للخروج من الأزمة الاقتصادية."</p>`,
      section_slug: 'local',
      is_breaking: true,
      is_featured: true,
      priority: 1,
      cover_image_url:
        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'القمة العربية تُناقش التطورات الإقليمية وملف اللاجئين',
      excerpt_ar:
        'انطلقت أعمال القمة العربية في الرياض بمشاركة رؤساء الدول العربية، حيث يتصدر جدول الأعمال التطورات الإقليمية وملف اللاجئين.',
      body_md: `<h2>القمة العربية في الرياض</h2><p>افتتحت اليوم أعمال القمة العربية في العاصمة السعودية الرياض، بحضور قادة ورؤساء الدول العربية.</p><h3>جدول الأعمال</h3><ul><li><strong>الأوضاع الإقليمية</strong>: مناقشة التطورات في المنطقة</li><li><strong>ملف اللاجئين</strong>: البحث في أوضاع اللاجئين ودعم الدول المضيفة</li><li><strong>التعاون الاقتصادي</strong>: تعزيز التبادل التجاري العربي</li></ul>`,
      section_slug: 'regional',
      is_breaking: false,
      is_featured: true,
      priority: 2,
      cover_image_url:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'تحقيق: كيف تُهرّب الأموال عبر الحدود اللبنانية؟',
      excerpt_ar:
        'تحقيق استقصائي يكشف عن شبكات تهريب الأموال عبر الحدود اللبنانية، والآليات المستخدمة للتحايل على القوانين المصرفية.',
      body_md: `<h2>تحقيق استقصائي: تهريب الأموال</h2><p>كشف تحقيق استقصائي أجراه فريق 4Lebanon عن شبكات منظمة لتهريب الأموال عبر الحدود.</p><h3>الآليات المستخدمة</h3><p>تتعدد طرق تهريب الأموال وتشمل:</p><h4>1. الصرافون غير المرخصين</h4><p>يعمل عدد من الصرافين خارج الإطار القانوني، ويقدمون خدمات تحويل الأموال دون رقابة.</p><h4>2. التحويلات عبر العملات الرقمية</h4><p>أصبحت العملات المشفرة وسيلة جديدة للتحايل على الرقابة المالية.</p>`,
      section_slug: 'opinions',
      is_breaking: false,
      is_featured: true,
      priority: 3,
      cover_image_url:
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'البنك الدولي يوافق على قرض بقيمة 300 مليون دولار لدعم الإصلاحات في لبنان',
      excerpt_ar:
        'وافق مجلس إدارة البنك الدولي على منح لبنان قرضاً بقيمة 300 مليون دولار لدعم برنامج الإصلاحات الهيكلية وشبكة الأمان الاجتماعي.',
      body_md: `<h2>قرض البنك الدولي</h2><p>في خطوة هامة لدعم الاقتصاد اللبناني، وافق البنك الدولي على تقديم قرض بقيمة 300 مليون دولار أمريكي.</p><h3>شروط القرض</h3><ol><li>تنفيذ إصلاحات في قطاع الكهرباء</li><li>إعادة هيكلة القطاع المصرفي</li><li>تعزيز الحوكمة ومكافحة الفساد</li></ol>`,
      section_slug: 'economy',
      is_breaking: false,
      is_featured: true,
      priority: 2,
      cover_image_url:
        'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'الجيش اللبناني يُحبط محاولة تهريب كبيرة عبر الحدود الشمالية',
      excerpt_ar:
        'أعلنت قيادة الجيش اللبناني عن إحباط عملية تهريب كبيرة عبر الحدود الشمالية، حيث ضُبطت كميات من المواد الممنوعة.',
      body_md: `<h2>عملية أمنية ناجحة</h2><p>نثّذت وحدات الجيش اللبناني عملية أمنية نوعية في منطقة الحدود الشمالية أسفرت عن إحباط محاولة تهريب كبيرة.</p><h3>نتائج العملية</h3><ul><li>توقيف 5 أشخاص</li><li>ضبط كميات من المواد الممنوعة</li><li>مصادرة أسلحة ومعدات</li></ul>`,
      section_slug: 'local',
      is_breaking: true,
      is_featured: false,
      priority: 2,
      cover_image_url:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'إغلاق طريق الضبية بسبب أعمال صيانة حتى نهاية الأسبوع',
      excerpt_ar:
        'أعلنت وزارة الأشغال العامة عن إغلاق جزئي لطريق الضبية السريع بسبب أعمال الصيانة.',
      body_md: `<h2>إغلاق طريق الضبية</h2><p>أعلنت وزارة الأشغال العامة عن إغلاق جزئي لطريق الضبية السريع اعتباراً من اليوم.</p><h3>تفاصيل الإغلاق</h3><ul><li><strong>المدة</strong>: حتى نهاية الأسبوع</li><li><strong>الساعات</strong>: من الساعة 10 صباحاً حتى 4 عصراً</li></ul>`,
      section_slug: 'said-and-said',
      is_breaking: false,
      is_featured: false,
      priority: 4,
      cover_image_url:
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'رأي: لبنان على مفترق طرق... خيارات المستقبل',
      excerpt_ar:
        'مقال رأي يُحلل الخيارات المتاحة أمام لبنان للخروج من أزماته المتراكمة، والسيناريوهات الممكنة للمرحلة المقبلة.',
      body_md: `<h2>لبنان على مفترق طرق</h2><p><em>بقلم: أنيس أبي سعد</em></p><p>يقف لبنان اليوم على مفترق طرق حاسم في تاريخه المعاصر. الأزمات المتراكمة تفرض خيارات صعبة، لكنها أيضاً تفتح نوافذ للتغيير الحقيقي.</p><h3>السيناريوهات الممكنة</h3><ol><li>الإصلاح الشامل بدعم دولي</li><li>الاستمرار في إدارة الأزمة</li><li>الانهيار الكامل وإعادة البناء</li></ol>`,
      section_slug: 'opinions',
      is_breaking: false,
      is_featured: false,
      priority: 3,
      cover_image_url:
        'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=1200&h=800&fit=crop',
    },
  ],

  // ELIE - Admin (7 articles)
  'elieantoun@4lebanon.com': [
    {
      title_ar: 'توقيع اتفاقية تعاون بين لبنان ومصر في مجال الطاقة',
      excerpt_ar:
        'وقّع وزيرا الطاقة اللبناني والمصري اتفاقية تعاون لنقل الغاز الطبيعي إلى لبنان عبر خط الغاز العربي.',
      body_md: `<h2>اتفاقية الطاقة اللبنانية المصرية</h2><p>في إطار تعزيز التعاون العربي في قطاع الطاقة، وقّع وزير الطاقة اللبناني ونظيره المصري اتفاقية تعاون استراتيجية.</p><h3>بنود الاتفاقية</h3><ol><li>نقل الغاز المصري إلى لبنان عبر سوريا والأردن</li><li>تزويد لبنان بكميات تكفي لتشغيل معامل الكهرباء</li><li>التعاون في مجال الطاقة المتجددة</li></ol>`,
      section_slug: 'regional',
      is_breaking: false,
      is_featured: true,
      priority: 3,
      cover_image_url:
        'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'ارتفاع أسعار المحروقات: تداعيات على قطاع النقل وحركة التجارة',
      excerpt_ar:
        'سجّلت أسعار المحروقات ارتفاعاً جديداً هذا الأسبوع، مما يُلقي بظلاله على قطاع النقل العام والتجارة.',
      body_md: `<h2>ارتفاع أسعار المحروقات</h2><p>شهدت أسعار المحروقات ارتفاعاً جديداً هذا الأسبوع، في ظل التقلبات في أسواق النفط العالمية.</p><h3>التأثير على القطاعات</h3><p>أعرب سائقو الأجرة عن استيائهم من الارتفاع المتواصل في الأسعار، مطالبين بتعديل التعرفة.</p><ul><li>ارتفاع بنزين 95: بنسبة 8%</li><li>ارتفاع المازوت: بنسبة 12%</li><li>تأثير مباشر على أسعار السلع الاستهلاكية</li></ul>`,
      section_slug: 'economy',
      is_breaking: false,
      is_featured: false,
      priority: 4,
      cover_image_url:
        'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'بلدية بيروت تُطلق حملة لتنظيف الشواطئ العامة',
      excerpt_ar:
        'أطلقت بلدية بيروت حملة واسعة لتنظيف الشواطئ العامة بالتعاون مع جمعيات بيئية ومتطوعين.',
      body_md: `<h2>حملة تنظيف الشواطئ</h2><p>أطلقت بلدية بيروت حملة بيئية واسعة لتنظيف الشواطئ العامة، بمشاركة مئات المتطوعين.</p><h3>تفاصيل الحملة</h3><p>انطلقت الحملة صباح اليوم من شاطئ الرملة البيضاء، وتستمر على مدى أسبوع كامل.</p><ul><li>500 متطوع في اليوم الأول</li><li>جمع أكثر من 3 أطنان من النفايات</li><li>توعية بيئية للمواطنين</li></ul>`,
      section_slug: 'local',
      is_breaking: false,
      is_featured: false,
      priority: 4,
      cover_image_url:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'افتتاح مستشفى حكومي جديد في طرابلس بتمويل دولي',
      excerpt_ar:
        'افتُتح اليوم مستشفى طرابلس الحكومي الجديد بحضور رسمي ودولي، ليكون أكبر مرفق صحي حكومي في الشمال.',
      body_md: `<h2>افتتاح مستشفى طرابلس الجديد</h2><p>شهدت مدينة طرابلس اليوم افتتاح المستشفى الحكومي الجديد، بحضور رسمي ودولي رفيع المستوى.</p><h3>مواصفات المستشفى</h3><ul><li><strong>السعة</strong>: 300 سرير</li><li><strong>التخصصات</strong>: 15 قسماً طبياً</li><li><strong>التمويل</strong>: منحة من الاتحاد الأوروبي</li></ul>`,
      section_slug: 'local',
      is_breaking: false,
      is_featured: true,
      priority: 3,
      cover_image_url:
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'لبنان يفوز ببطولة غرب آسيا لكرة السلة للشباب',
      excerpt_ar:
        'حقق منتخب لبنان لكرة السلة للشباب لقب بطولة غرب آسيا بعد فوزه في المباراة النهائية.',
      body_md: `<h2>لبنان بطل غرب آسيا لكرة السلة</h2><p>توّج منتخب لبنان لكرة السلة للشباب بلقب بطولة غرب آسيا 2026.</p><h3>تفاصيل المباراة النهائية</h3><ul><li>النتيجة: 78-65 ضد الأردن</li><li>أفضل لاعب: كريم شمس الدين (22 نقطة)</li><li>موقع البطولة: عمّان</li></ul>`,
      section_slug: 'local',
      is_breaking: false,
      is_featured: false,
      priority: 4,
      cover_image_url:
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'زيارة رسمية لوزير الخارجية الفرنسي: دعم أوروبي للإصلاحات',
      excerpt_ar:
        'وصل وزير الخارجية الفرنسي إلى بيروت في زيارة رسمية حاملاً رسائل دعم أوروبي للإصلاحات.',
      body_md: `<h2>زيارة وزير الخارجية الفرنسي</h2><p>وصل وزير الخارجية الفرنسي إلى بيروت في زيارة رسمية تستمر يومين.</p><h3>جدول الزيارة</h3><ul><li>لقاء رئيس الجمهورية</li><li>اجتماع مع رئيس الحكومة</li><li>جولة على مشاريع إنسانية فرنسية</li></ul>`,
      section_slug: 'international',
      is_breaking: false,
      is_featured: false,
      priority: 3,
      cover_image_url:
        'https://images.unsplash.com/photo-1524522173746-f628baad3644?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'حوار خاص مع وزير الاقتصاد حول خطة النهوض الاقتصادي',
      excerpt_ar:
        'في حوار خاص مع 4Lebanon، يتحدث وزير الاقتصاد عن خطة النهوض الاقتصادي والتحديات والفرص.',
      body_md: `<h2>حوار خاص مع وزير الاقتصاد</h2><p>أجرت 4Lebanon حواراً خاصاً مع وزير الاقتصاد حول الوضع الاقتصادي الراهن وخطط المستقبل.</p><h3>أبرز التصريحات</h3><ul><li>النمو المتوقع: 3% في 2027</li><li>أولوية الإصلاح المالي</li><li>التحول الرقمي في الخدمات الحكومية</li></ul>`,
      section_slug: 'economy',
      is_breaking: false,
      is_featured: false,
      priority: 4,
      cover_image_url:
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=800&fit=crop',
    },
  ],

  // ANTHONY - Admin (7 articles)
  'anthonyelmaalouf@4lebanon.com': [
    {
      title_ar: 'انطلاق مهرجان بيروت الدولي للسينما بمشاركة نجوم عرب وعالميين',
      excerpt_ar:
        'افتُتح مهرجان بيروت الدولي للسينما بحضور كبير من الفنانين والمخرجين العرب والدوليين.',
      body_md: `<h2>مهرجان بيروت الدولي للسينما</h2><p>افتتح مهرجان بيروت الدولي للسينما أعماله هذا المساء في سينما متروبوليس إمباير.</p><h3>أبرز المشاركات</h3><ul><li>45 فيلماً من 20 دولة</li><li>تكريم المخرج اللبناني نادين لبكي</li><li>جائزة خاصة للسينما العربية</li></ul>`,
      section_slug: 'local',
      is_breaking: false,
      is_featured: true,
      priority: 3,
      cover_image_url:
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'اكتشاف موقع أثري جديد في جبيل يعود للعصر الفينيقي',
      excerpt_ar:
        'أعلنت المديرية العامة للآثار عن اكتشاف موقع أثري مهم في جبيل يضم قطعاً نادرة تعود للحضارة الفينيقية.',
      body_md: `<h2>اكتشاف أثري في جبيل</h2><p>أعلنت المديرية العامة للآثار عن اكتشاف أثري مهم في محيط مدينة جبيل التاريخية.</p><h3>أهمية الاكتشاف</h3><ul><li>قطع فخارية نادرة تعود لـ 3000 عام</li><li>نقوش فينيقية محفوظة بشكل ممتاز</li><li>أدوات من البرونز تُستخدم في الملاحة</li></ul>`,
      section_slug: 'local',
      is_breaking: false,
      is_featured: true,
      priority: 3,
      cover_image_url:
        'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'مؤتمر دولي في بيروت حول مستقبل الذكاء الاصطناعي في المنطقة',
      excerpt_ar:
        'استضافت بيروت مؤتمراً دولياً حول الذكاء الاصطناعي بمشاركة خبراء من شركات التكنولوجيا الكبرى.',
      body_md: `<h2>مؤتمر الذكاء الاصطناعي في بيروت</h2><p>انطلقت أعمال المؤتمر الدولي للذكاء الاصطناعي في فندق فينيسيا بيروت.</p><h3>المشاركون</h3><ul><li>خبراء من Google وMicrosoft</li><li>جامعات لبنانية وعربية</li><li>شركات ناشئة محلية</li></ul><h3>أبرز التوصيات</h3><p>دعا المشاركون إلى إنشاء مركز إقليمي للذكاء الاصطناعي في بيروت.</p>`,
      section_slug: 'international',
      is_breaking: false,
      is_featured: false,
      priority: 4,
      cover_image_url:
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'ارتفاع صادرات لبنان الزراعية بنسبة 25% خلال العام الحالي',
      excerpt_ar:
        'أعلنت وزارة الزراعة عن ارتفاع ملحوظ في الصادرات الزراعية اللبنانية إلى الأسواق العربية والأوروبية.',
      body_md: `<h2>نمو الصادرات الزراعية</h2><p>سجّل قطاع الصادرات الزراعية اللبنانية نمواً ملحوظاً بلغ 25% مقارنة بالعام الماضي.</p><h3>أبرز المنتجات المصدّرة</h3><ul><li>التفاح والكرز: ارتفاع بنسبة 30%</li><li>الخضروات الطازجة: ارتفاع بنسبة 20%</li><li>زيت الزيتون: ارتفاع بنسبة 35%</li></ul>`,
      section_slug: 'economy',
      is_breaking: false,
      is_featured: false,
      priority: 4,
      cover_image_url:
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'افتتاح أول مصنع للسيارات الكهربائية في لبنان',
      excerpt_ar:
        'افتُتح في منطقة الكرنتينا أول مصنع لتجميع السيارات الكهربائية في لبنان باستثمار لبناني-صيني مشترك.',
      body_md: `<h2>مصنع السيارات الكهربائية</h2><p>شهد لبنان افتتاح أول مصنع لتجميع السيارات الكهربائية في منطقة الكرنتينا.</p><h3>تفاصيل المشروع</h3><ul><li>الاستثمار: 50 مليون دولار</li><li>الطاقة الإنتاجية: 5000 سيارة سنوياً</li><li>فرص العمل: 200 وظيفة مباشرة</li></ul>`,
      section_slug: 'economy',
      is_breaking: false,
      is_featured: true,
      priority: 3,
      cover_image_url:
        'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'تحذيرات من موجة حر شديدة تضرب لبنان الأسبوع المقبل',
      excerpt_ar:
        'أصدرت مصلحة الأرصاد الجوية تحذيراً من موجة حر شديدة ستضرب لبنان مع درجات حرارة قياسية.',
      body_md: `<h2>موجة حر متوقعة</h2><p>حذّرت مصلحة الأرصاد الجوية من موجة حر شديدة ستؤثر على لبنان.</p><h3>التوقعات</h3><ul><li>درجات الحرارة: 40-45 درجة مئوية</li><li>المدة: 5 أيام</li><li>المناطق الأكثر تأثراً: البقاع والساحل</li></ul>`,
      section_slug: 'said-and-said',
      is_breaking: false,
      is_featured: false,
      priority: 4,
      cover_image_url:
        'https://images.unsplash.com/photo-1504370805625-d32c54b16100?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'الدفاع المدني يُخمد حريقاً كبيراً في أحراج الشوف',
      excerpt_ar:
        'تمكنت فرق الدفاع المدني بمساعدة طوافات الجيش من إخماد حريق كبير اندلع في أحراج الشوف.',
      body_md: `<h2>حريق أحراج الشوف</h2><p>تمكنت فرق الدفاع المدني من السيطرة على حريق كبير اندلع في أحراج الشوف صباح اليوم.</p><h3>تفاصيل الحادثة</h3><ul><li>المساحة المتضررة: 15 هكتاراً</li><li>8 فرق إطفاء شاركت في العملية</li><li>مساعدة 3 طوافات عسكرية</li></ul>`,
      section_slug: 'local',
      is_breaking: true,
      is_featured: false,
      priority: 2,
      cover_image_url:
        'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=1200&h=800&fit=crop',
    },
  ],

  // CHADI - Admin (7 articles)
  'chadizgheib@4lebanon.com': [
    {
      title_ar: 'توقيف شبكة احتيال إلكتروني استهدفت مصارف لبنانية',
      excerpt_ar:
        'أوقفت شعبة المعلومات شبكة من المحتالين الإلكترونيين استهدفوا حسابات مصرفية لبنانية.',
      body_md: `<h2>توقيف شبكة احتيال إلكتروني</h2><p>أعلنت المديرية العامة لقوى الأمن الداخلي عن توقيف شبكة متخصصة بالاحتيال الإلكتروني.</p><h3>تفاصيل العملية</h3><ul><li>توقيف 7 أشخاص</li><li>استرداد مبالغ بقيمة 2 مليون دولار</li><li>ضبط معدات إلكترونية متطورة</li></ul>`,
      section_slug: 'local',
      is_breaking: true,
      is_featured: false,
      priority: 2,
      cover_image_url:
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'قوى الأمن تفكك خلية إرهابية كانت تخطط لعمليات في بيروت',
      excerpt_ar: 'أعلنت المديرية العامة لقوى الأمن الداخلي عن تفكيك خلية إرهابية وتوقيف أعضائها.',
      body_md: `<h2>تفكيك خلية إرهابية</h2><p>أعلنت قوى الأمن الداخلي عن إحباط مخطط إرهابي في العاصمة بيروت.</p><h3>نتائج العملية</h3><ul><li>توقيف 6 أشخاص</li><li>ضبط متفجرات وأسلحة</li><li>التحقيقات مستمرة لكشف الشبكة الكاملة</li></ul>`,
      section_slug: 'local',
      is_breaking: true,
      is_featured: true,
      priority: 2,
      cover_image_url:
        'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'ضبط شحنة مخدرات كبيرة في مرفأ بيروت',
      excerpt_ar:
        'ضبطت الجمارك اللبنانية شحنة مخدرات كبيرة كانت مخبأة في حاوية قادمة من أمريكا الجنوبية.',
      body_md: `<h2>ضبط مخدرات في المرفأ</h2><p>نجحت الجمارك اللبنانية في ضبط شحنة مخدرات كبيرة في مرفأ بيروت.</p><h3>تفاصيل الضبطية</h3><ul><li>الكمية: 500 كيلوغرام</li><li>المصدر: أمريكا الجنوبية</li><li>طريقة الإخفاء: داخل شحنة فواكه</li></ul>`,
      section_slug: 'local',
      is_breaking: true,
      is_featured: false,
      priority: 2,
      cover_image_url:
        'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'إطلاق منصة رقمية جديدة لتسهيل معاملات المواطنين الحكومية',
      excerpt_ar:
        'أطلقت الحكومة منصة إلكترونية موحدة تتيح للمواطنين إنجاز معاملاتهم الرسمية عبر الإنترنت.',
      body_md: `<h2>المنصة الحكومية الرقمية</h2><p>أطلقت الحكومة اللبنانية منصة "لبنان الرقمي" لتسهيل الخدمات الحكومية للمواطنين.</p><h3>الخدمات المتاحة</h3><ul><li>استخراج وثائق رسمية</li><li>دفع الرسوم والضرائب إلكترونياً</li><li>تجديد الوثائق والرخص</li></ul>`,
      section_slug: 'local',
      is_breaking: false,
      is_featured: false,
      priority: 4,
      cover_image_url:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'تحقيق: الهجرة اللبنانية... أرقام صادمة وقصص إنسانية',
      excerpt_ar:
        'تحقيق موسّع يرصد أرقام الهجرة اللبنانية خلال السنوات الأخيرة ويوثّق قصصاً إنسانية.',
      body_md: `<h2>الهجرة اللبنانية: تحقيق موسّع</h2><p>أجرى فريق 4Lebanon تحقيقاً موسعاً حول ظاهرة الهجرة المتزايدة من لبنان.</p><h3>الأرقام</h3><ul><li>300,000 لبناني هاجروا منذ 2020</li><li>40% منهم من فئة الشباب (25-35 سنة)</li><li>أبرز الوجهات: كندا، أستراليا، الخليج</li></ul>`,
      section_slug: 'opinions',
      is_breaking: false,
      is_featured: true,
      priority: 3,
      cover_image_url:
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'زيادة الحد الأدنى للأجور: بين مطالب العمال وقلق أصحاب العمل',
      excerpt_ar:
        'تتصاعد النقاشات حول رفع الحد الأدنى للأجور في لبنان، وسط مطالب نقابية وتحفظات من القطاع الخاص.',
      body_md: `<h2>ملف زيادة الأجور</h2><p>يعود ملف زيادة الحد الأدنى للأجور إلى الواجهة مع تصاعد المطالب النقابية.</p><h3>مواقف الأطراف</h3><h4>النقابات</h4><p>تطالب بزيادة فورية تتناسب مع ارتفاع الأسعار وانخفاض القدرة الشرائية.</p><h4>أصحاب العمل</h4><p>يحذرون من تأثير ذلك على القدرة التنافسية وإمكانية تسريح العمال.</p>`,
      section_slug: 'economy',
      is_breaking: false,
      is_featured: false,
      priority: 4,
      cover_image_url:
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=800&fit=crop',
    },
    {
      title_ar: 'دراسة: تلوث الهواء في بيروت يتجاوز المعايير العالمية بخمس مرات',
      excerpt_ar:
        'كشفت دراسة بيئية جديدة أن نسبة تلوث الهواء في العاصمة بيروت تتجاوز المعايير الصحية العالمية.',
      body_md: `<h2>تلوث الهواء في بيروت</h2><p>كشفت دراسة علمية جديدة عن مستويات خطيرة من تلوث الهواء في بيروت.</p><h3>نتائج الدراسة</h3><ul><li>تجاوز معايير WHO بـ 5 أضعاف</li><li>المصادر الرئيسية: السيارات والمولدات الكهربائية</li><li>التأثير الصحي: ارتفاع أمراض الجهاز التنفسي بنسبة 40%</li></ul>`,
      section_slug: 'opinions',
      is_breaking: false,
      is_featured: false,
      priority: 4,
      cover_image_url:
        'https://images.unsplash.com/photo-1532330393533-443990a51d10?w=1200&h=800&fit=crop',
    },
  ],
}

async function main() {
  console.log('=== Seeding Test Articles for All Users ===\n')

  // Step 1: Get all user IDs
  const { data: authData } = await supabase.auth.admin.listUsers()
  if (!authData?.users?.length) {
    console.error('No users found!')
    process.exit(1)
  }

  const userMap = new Map<string, string>()
  for (const user of authData.users) {
    if (user.email) userMap.set(user.email, user.id)
  }

  console.log('Users found:')
  for (const [email, id] of userMap) {
    console.log(`  ${email} → ${id}`)
  }

  // Step 2: Get section IDs
  const { data: sections } = await supabase.from('sections').select('id, slug')
  if (!sections?.length) {
    console.error('No sections found!')
    process.exit(1)
  }

  const sectionMap = new Map<string, number>()
  for (const s of sections) {
    sectionMap.set(s.slug, s.id)
  }

  console.log('\nSections:')
  for (const [slug, id] of sectionMap) {
    console.log(`  ${slug} → ${id}`)
  }

  // Step 3: Clear existing articles
  console.log('\nClearing existing articles...')
  await supabase
    .from('article_topics')
    .delete()
    .neq('article_id', '00000000-0000-0000-0000-000000000000')

  await supabase.from('articles').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('Done.\n')

  // Step 4: Create articles per user
  let totalCreated = 0

  for (const [email, articles] of Object.entries(articlesByAuthor)) {
    const userId = userMap.get(email)
    if (!userId) {
      console.error(`User not found: ${email}`)
      continue
    }

    console.log(`\nCreating articles for ${email}...`)

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]
      const sectionId = sectionMap.get(article.section_slug)

      if (!sectionId) {
        console.error(`  Section not found: ${article.section_slug}`)
        continue
      }

      const slug =
        article.title_ar
          .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50) +
        '-' +
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 5)

      // Stagger published dates: breaking/pinned articles are recent (within 24h),
      // featured within 48h, normal articles spread across the last few days
      let hoursAgo: number
      if (article.priority <= 2) {
        // Breaking/pinned: published within the last 12 hours
        hoursAgo = i * 1.5 + Math.random() * 1
      } else if (article.priority === 3) {
        // Featured: published within the last 36 hours
        hoursAgo = 4 + i * 2 + Math.random() * 2
      } else {
        // Normal: spread across the last 4 days
        hoursAgo = 12 + (totalCreated + i) * 4 + Math.random() * 3
      }
      const publishedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

      const { error } = await supabase.from('articles').insert({
        author_id: userId,
        slug,
        title_ar: article.title_ar,
        excerpt_ar: article.excerpt_ar,
        body_md: article.body_md,
        cover_image_path: article.cover_image_url,
        section_id: sectionId,
        status: 'published',
        published_at: publishedAt,
        is_breaking: article.is_breaking,
        is_featured: article.is_featured,
        priority: article.priority,
        sources: [],
      })

      if (error) {
        console.error(`  FAILED: ${article.title_ar.substring(0, 40)}... → ${error.message}`)
      } else {
        console.log(`  OK: ${article.title_ar.substring(0, 50)}...`)
        totalCreated++
      }
    }
  }

  // Step 5: Summary
  console.log(
    `\n=== Done! Created ${totalCreated} articles across ${Object.keys(articlesByAuthor).length} users ===`
  )

  const { data: counts } = await supabase
    .from('articles')
    .select('author_id, profiles!inner(display_name_ar)')

  if (counts) {
    const byAuthor = new Map<string, number>()
    for (const row of counts) {
      const name =
        (row as unknown as { profiles?: { display_name_ar?: string } }).profiles?.display_name_ar ||
        'Unknown'
      byAuthor.set(name, (byAuthor.get(name) || 0) + 1)
    }
    console.log('\nArticles per author:')
    for (const [name, count] of byAuthor) {
      console.log(`  ${name}: ${count}`)
    }
  }
}

main().catch(console.error)
