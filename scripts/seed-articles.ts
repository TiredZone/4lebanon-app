/**
 * Seed script to populate the database with sample Lebanese news articles
 * Run with: npx tsx scripts/seed-articles.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample articles data - Real Lebanese news style with images
const sampleArticles = [
  // Breaking/Featured News
  {
    title_ar: 'مجلس الوزراء يقرّ خطة الطوارئ الاقتصادية لدعم الليرة اللبنانية',
    excerpt_ar:
      'في جلسة استثنائية عُقدت اليوم، أقرّ مجلس الوزراء خطة طوارئ اقتصادية شاملة تهدف إلى استقرار سعر صرف الليرة اللبنانية ودعم القطاعات الإنتاجية.',
    body_md: `# خطة الطوارئ الاقتصادية

أقرّ مجلس الوزراء اللبناني في جلسته الاستثنائية اليوم خطة طوارئ اقتصادية شاملة تتضمن عدة محاور أساسية.

## أبرز بنود الخطة

- **دعم القطاع المصرفي**: إعادة هيكلة البنوك وضمان حقوق المودعين
- **تحفيز القطاعات الإنتاجية**: تقديم قروض ميسّرة للصناعة والزراعة
- **إصلاح قطاع الكهرباء**: خطة لمعالجة أزمة الكهرباء خلال 18 شهراً
- **الحماية الاجتماعية**: زيادة المساعدات للأسر الأكثر فقراً

## تصريحات رسمية

صرّح رئيس الحكومة عقب الجلسة: "هذه الخطة تمثل خارطة طريق واضحة للخروج من الأزمة الاقتصادية."`,
    section_slug: 'local',
    is_breaking: true,
    is_featured: true,
    cover_image_path:
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'الجيش اللبناني يُحبط محاولة تهريب كبيرة عبر الحدود الشمالية',
    excerpt_ar:
      'أعلنت قيادة الجيش اللبناني عن إحباط عملية تهريب كبيرة عبر الحدود الشمالية، حيث ضُبطت كميات من المواد الممنوعة والأسلحة.',
    body_md: `# عملية أمنية ناجحة

نثّذت وحدات الجيش اللبناني عملية أمنية نوعية في منطقة الحدود الشمالية أسفرت عن إحباط محاولة تهريب كبيرة.

## تفاصيل العملية

بحسب البيان الصادر عن قيادة الجيش، رصدت دوريات المراقبة تحركات مشبوهة قرب الحدود في ساعات الفجر الأولى.

تمّ نشر تعزيزات عسكرية في المنطقة، ونُفّذت عملية مداهمة أسفرت عن:

- توقيف 5 أشخاص
- ضبط كميات من المواد الممنوعة
- مصادرة أسلحة ومعدات`,
    section_slug: 'security',
    is_breaking: true,
    is_featured: true,
    cover_image_path:
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop',
  },
  // Economy
  {
    title_ar: 'البنك الدولي يوافق على قرض بقيمة 300 مليون دولار لدعم الإصلاحات في لبنان',
    excerpt_ar:
      'وافق مجلس إدارة البنك الدولي على منح لبنان قرضاً بقيمة 300 مليون دولار لدعم برنامج الإصلاحات الهيكلية وشبكة الأمان الاجتماعي.',
    body_md: `# قرض البنك الدولي

في خطوة هامة لدعم الاقتصاد اللبناني، وافق البنك الدولي على تقديم قرض بقيمة 300 مليون دولار أمريكي.

## شروط القرض

يأتي هذا القرض ضمن برنامج دعم الإصلاحات الهيكلية، ويشترط:

1. تنفيذ إصلاحات في قطاع الكهرباء
2. إعادة هيكلة القطاع المصرفي
3. تعزيز الحوكمة ومكافحة الفساد`,
    section_slug: 'economy',
    is_breaking: false,
    is_featured: true,
    cover_image_path:
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'ارتفاع أسعار المحروقات: تداعيات على قطاع النقل وحركة التجارة',
    excerpt_ar:
      'سجّلت أسعار المحروقات ارتفاعاً جديداً هذا الأسبوع، مما يُلقي بظلاله على قطاع النقل العام والتجارة في مختلف المناطق اللبنانية.',
    body_md: `# ارتفاع أسعار المحروقات

شهدت أسعار المحروقات ارتفاعاً جديداً هذا الأسبوع، في ظل التقلبات في أسواق النفط العالمية.

## التأثير على القطاعات

أعرب سائقو الأجرة عن استيائهم من الارتفاع المتواصل في الأسعار، مطالبين بتعديل التعرفة.`,
    section_slug: 'economy',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=1200&h=800&fit=crop',
  },
  // Regional
  {
    title_ar: 'القمة العربية تُناقش التطورات الإقليمية وملف اللاجئين',
    excerpt_ar:
      'انطلقت أعمال القمة العربية في الرياض بمشاركة رؤساء الدول العربية، حيث يتصدر جدول الأعمال التطورات الإقليمية وملف اللاجئين.',
    body_md: `# القمة العربية في الرياض

افتتحت اليوم أعمال القمة العربية في العاصمة السعودية الرياض، بحضور قادة ورؤساء الدول العربية.

## جدول الأعمال

تتضمن أجندة القمة عدة ملفات أساسية:

- **الأوضاع الإقليمية**: مناقشة التطورات في المنطقة
- **ملف اللاجئين**: البحث في أوضاع اللاجئين ودعم الدول المضيفة`,
    section_slug: 'regional',
    is_breaking: false,
    is_featured: true,
    cover_image_path:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'توقيع اتفاقية تعاون بين لبنان ومصر في مجال الطاقة',
    excerpt_ar:
      'وقّع وزيرا الطاقة اللبناني والمصري اتفاقية تعاون لنقل الغاز الطبيعي إلى لبنان عبر خط الغاز العربي.',
    body_md: `# اتفاقية الطاقة اللبنانية المصرية

في إطار تعزيز التعاون العربي في قطاع الطاقة، وقّع وزير الطاقة اللبناني ونظيره المصري اتفاقية تعاون استراتيجية.

## بنود الاتفاقية

تنص الاتفاقية على:

1. نقل الغاز المصري إلى لبنان عبر سوريا والأردن
2. تزويد لبنان بكميات تكفي لتشغيل معامل الكهرباء`,
    section_slug: 'regional',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&h=800&fit=crop',
  },
  // Investigation/Analysis
  {
    title_ar: 'تحقيق: كيف تُهرّب الأموال عبر الحدود اللبنانية؟',
    excerpt_ar:
      'تحقيق استقصائي يكشف عن شبكات تهريب الأموال عبر الحدود اللبنانية، والآليات المستخدمة للتحايل على القوانين المصرفية.',
    body_md: `# تحقيق استقصائي: تهريب الأموال

كشف تحقيق استقصائي أجراه فريق "4 لبنان" عن شبكات منظمة لتهريب الأموال عبر الحدود.

## الآليات المستخدمة

تتعدد طرق تهريب الأموال وتشمل:

### 1. الصرافون غير المرخصين
يعمل عدد من الصرافين خارج الإطار القانوني، ويقدمون خدمات تحويل الأموال دون رقابة.`,
    section_slug: 'investigation',
    is_breaking: false,
    is_featured: true,
    cover_image_path:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'ملف خاص: واقع التعليم الرسمي في لبنان بعد سنوات الأزمة',
    excerpt_ar:
      'دراسة معمّقة حول واقع التعليم الرسمي في لبنان، التحديات التي يواجهها المعلمون والطلاب، والحلول الممكنة للنهوض بالقطاع.',
    body_md: `# واقع التعليم الرسمي في لبنان

يمرّ قطاع التعليم الرسمي في لبنان بأصعب مراحله، في ظل الأزمة الاقتصادية المستمرة.

## الأرقام والإحصاءات

- **30%** من المعلمين تركوا المهنة
- **200,000** طالب انتقلوا من التعليم الخاص إلى الرسمي`,
    section_slug: 'investigation',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=800&fit=crop',
  },
  // Local News
  {
    title_ar: 'بلدية بيروت تُطلق حملة لتنظيف الشواطئ العامة',
    excerpt_ar:
      'أطلقت بلدية بيروت حملة واسعة لتنظيف الشواطئ العامة بالتعاون مع جمعيات بيئية ومتطوعين من المجتمع المدني.',
    body_md: `# حملة تنظيف الشواطئ

أطلقت بلدية بيروت حملة بيئية واسعة لتنظيف الشواطئ العامة، بمشاركة مئات المتطوعين.

## تفاصيل الحملة

انطلقت الحملة صباح اليوم من شاطئ الرملة البيضاء، وتستمر على مدى أسبوع.`,
    section_slug: 'local',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'افتتاح مستشفى حكومي جديد في طرابلس بتمويل دولي',
    excerpt_ar:
      'افتُتح اليوم مستشفى طرابلس الحكومي الجديد بحضور رسمي ودولي، ليكون أكبر مرفق صحي حكومي في الشمال.',
    body_md: `# افتتاح مستشفى طرابلس الجديد

شهدت مدينة طرابلس اليوم افتتاح المستشفى الحكومي الجديد، بحضور رسمي ودولي رفيع المستوى.

## مواصفات المستشفى

- **السعة**: 300 سرير
- **التخصصات**: 15 قسماً طبياً`,
    section_slug: 'local',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=800&fit=crop',
  },
  // Radar (Quick News)
  {
    title_ar: 'إغلاق طريق الضبية بسبب أعمال صيانة حتى نهاية الأسبوع',
    excerpt_ar:
      'أعلنت وزارة الأشغال العامة عن إغلاق جزئي لطريق الضبية السريع بسبب أعمال الصيانة، مع تحويل السير عبر طرق بديلة.',
    body_md: `# إغلاق طريق الضبية

أعلنت وزارة الأشغال العامة عن إغلاق جزئي لطريق الضبية السريع اعتباراً من اليوم.

## تفاصيل الإغلاق

- **المدة**: حتى نهاية الأسبوع
- **الساعات**: من الساعة 10 صباحاً حتى 4 عصراً`,
    section_slug: 'radar',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'طقس غير مستقر مع أمطار غزيرة متوقعة خلال الأيام القادمة',
    excerpt_ar:
      'توقعت مصلحة الأرصاد الجوية طقساً غير مستقر مع أمطار غزيرة وعواصف رعدية في مختلف المناطق اللبنانية.',
    body_md: `# توقعات الطقس

تشير توقعات مصلحة الأرصاد الجوية إلى طقس غير مستقر خلال الأيام القادمة.

## التوقعات

### اليوم
- غيوم متفرقة مع احتمال أمطار خفيفة`,
    section_slug: 'radar',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&h=800&fit=crop',
  },
  // Special/Opinion
  {
    title_ar: 'رأي: لبنان على مفترق طرق... خيارات المستقبل',
    excerpt_ar:
      'مقال رأي يُحلل الخيارات المتاحة أمام لبنان للخروج من أزماته المتراكمة، والسيناريوهات الممكنة للمرحلة المقبلة.',
    body_md: `# لبنان على مفترق طرق

*بقلم: محمد الخوري*

يقف لبنان اليوم على مفترق طرق حاسم في تاريخه المعاصر.`,
    section_slug: 'special',
    is_breaking: false,
    is_featured: true,
    cover_image_path:
      'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'حوار خاص مع وزير الاقتصاد حول خطة النهوض الاقتصادي',
    excerpt_ar:
      'في حوار خاص مع "4 لبنان"، يتحدث وزير الاقتصاد عن خطة النهوض الاقتصادي، التحديات والفرص المتاحة أمام لبنان.',
    body_md: `# حوار خاص مع وزير الاقتصاد

أجرت "4 لبنان" حواراً خاصاً مع وزير الاقتصاد حول الوضع الاقتصادي الراهن وخطط المستقبل.`,
    section_slug: 'special',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=800&fit=crop',
  },
  // NEW ARTICLES (20 more)
  {
    title_ar: 'انطلاق مهرجان بيروت الدولي للسينما بمشاركة نجوم عرب وعالميين',
    excerpt_ar:
      'افتُتح مهرجان بيروت الدولي للسينما بحضور كبير من الفنانين والمخرجين العرب والدوليين، في دورته الجديدة التي تُكرّم السينما اللبنانية.',
    body_md: `# مهرجان بيروت الدولي للسينما

افتتح مهرجان بيروت الدولي للسينما أعماله هذا المساء في سينما متروبوليس إمباير، بحضور نخبة من النجوم والمخرجين.

## أبرز المشاركات

- 45 فيلماً من 20 دولة
- تكريم المخرج اللبناني نادين لبكي
- جائزة خاصة للسينما العربية`,
    section_slug: 'local',
    is_breaking: false,
    is_featured: true,
    cover_image_path:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'الدفاع المدني يُخمد حريقاً كبيراً في أحراج الشوف',
    excerpt_ar:
      'تمكنت فرق الدفاع المدني بمساعدة طوافات الجيش من إخماد حريق كبير اندلع في أحراج الشوف بعد ساعات من العمل المتواصل.',
    body_md: `# حريق أحراج الشوف

تمكنت فرق الدفاع المدني من السيطرة على حريق كبير اندلع في أحراج الشوف صباح اليوم.

## تفاصيل الحادثة

- المساحة المتضررة: 15 هكتاراً
- 8 فرق إطفاء شاركت في العملية
- مساعدة 3 طوافات عسكرية`,
    section_slug: 'local',
    is_breaking: true,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'ارتفاع صادرات لبنان الزراعية بنسبة 25% خلال العام الحالي',
    excerpt_ar:
      'أعلنت وزارة الزراعة عن ارتفاع ملحوظ في الصادرات الزراعية اللبنانية إلى الأسواق العربية والأوروبية خلال العام الحالي.',
    body_md: `# نمو الصادرات الزراعية

سجّل قطاع الصادرات الزراعية اللبنانية نمواً ملحوظاً بلغ 25% مقارنة بالعام الماضي.

## أبرز المنتجات المصدّرة

- التفاح والكرز
- الخضروات الطازجة
- زيت الزيتون`,
    section_slug: 'economy',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'إطلاق منصة رقمية جديدة لتسهيل معاملات المواطنين الحكومية',
    excerpt_ar:
      'أطلقت الحكومة منصة إلكترونية موحدة تتيح للمواطنين إنجاز معاملاتهم الرسمية عبر الإنترنت دون الحاجة لزيارة الإدارات.',
    body_md: `# المنصة الحكومية الرقمية

أطلقت الحكومة اللبنانية منصة "لبنان الرقمي" لتسهيل الخدمات الحكومية للمواطنين.

## الخدمات المتاحة

- استخراج وثائق رسمية
- دفع الرسوم والضرائب
- تجديد الوثائق`,
    section_slug: 'local',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'اكتشاف موقع أثري جديد في جبيل يعود للعصر الفينيقي',
    excerpt_ar:
      'أعلنت المديرية العامة للآثار عن اكتشاف موقع أثري مهم في جبيل يضم قطعاً نادرة تعود للحضارة الفينيقية.',
    body_md: `# اكتشاف أثري في جبيل

أعلنت المديرية العامة للآثار عن اكتشاف أثري مهم في محيط مدينة جبيل التاريخية.

## أهمية الاكتشاف

- قطع فخارية نادرة
- نقوش فينيقية محفوظة
- أدوات من البرونز`,
    section_slug: 'local',
    is_breaking: false,
    is_featured: true,
    cover_image_path:
      'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'توقيف شبكة احتيال إلكتروني استهدفت مصارف لبنانية',
    excerpt_ar:
      'أوقفت شعبة المعلومات شبكة من المحتالين الإلكترونيين استهدفوا حسابات مصرفية لبنانية وسرقوا ملايين الدولارات.',
    body_md: `# توقيف شبكة احتيال إلكتروني

أعلنت المديرية العامة لقوى الأمن الداخلي عن توقيف شبكة متخصصة بالاحتيال الإلكتروني.

## تفاصيل العملية

- توقيف 7 أشخاص
- استرداد مبالغ بقيمة 2 مليون دولار
- ضبط معدات إلكترونية متطورة`,
    section_slug: 'security',
    is_breaking: true,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'مؤتمر دولي في بيروت حول مستقبل الذكاء الاصطناعي في المنطقة',
    excerpt_ar:
      'استضافت بيروت مؤتمراً دولياً حول الذكاء الاصطناعي بمشاركة خبراء من شركات التكنولوجيا الكبرى ومراكز أبحاث عالمية.',
    body_md: `# مؤتمر الذكاء الاصطناعي في بيروت

انطلقت أعمال المؤتمر الدولي للذكاء الاصطناعي في فندق فينيسيا بيروت.

## المشاركون

- خبراء من Google وMicrosoft
- جامعات لبنانية وعربية
- شركات ناشئة محلية`,
    section_slug: 'special',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'لبنان يفوز ببطولة غرب آسيا لكرة السلة للشباب',
    excerpt_ar:
      'حقق منتخب لبنان لكرة السلة للشباب لقب بطولة غرب آسيا بعد فوزه في المباراة النهائية على المنتخب الأردني.',
    body_md: `# لبنان بطل غرب آسيا لكرة السلة

توّج منتخب لبنان لكرة السلة للشباب بلقب بطولة غرب آسيا 2026.

## تفاصيل المباراة النهائية

- النتيجة: 78-65
- أفضل لاعب: كريم شمس الدين
- موقع البطولة: عمّان`,
    section_slug: 'local',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'زيادة الحد الأدنى للأجور: بين مطالب العمال وقلق أصحاب العمل',
    excerpt_ar:
      'تتصاعد النقاشات حول رفع الحد الأدنى للأجور في لبنان، وسط مطالب نقابية وتحفظات من القطاع الخاص.',
    body_md: `# ملف زيادة الأجور

يعود ملف زيادة الحد الأدنى للأجور إلى الواجهة مع تصاعد المطالب النقابية.

## مواقف الأطراف

### النقابات
تطالب بزيادة فورية تتناسب مع ارتفاع الأسعار.

### أصحاب العمل
يحذرون من تأثير ذلك على القدرة التنافسية.`,
    section_slug: 'economy',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'تحذيرات من موجة حر شديدة تضرب لبنان الأسبوع المقبل',
    excerpt_ar:
      'أصدرت مصلحة الأرصاد الجوية تحذيراً من موجة حر شديدة ستضرب لبنان الأسبوع المقبل مع درجات حرارة قياسية.',
    body_md: `# موجة حر متوقعة

حذّرت مصلحة الأرصاد الجوية من موجة حر شديدة ستؤثر على لبنان.

## التوقعات

- درجات الحرارة: 40-45 درجة مئوية
- المدة: 5 أيام
- المناطق الأكثر تأثراً: البقاع والساحل`,
    section_slug: 'radar',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1504370805625-d32c54b16100?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'تحقيق: الهجرة اللبنانية... أرقام صادمة وقصص إنسانية',
    excerpt_ar:
      'تحقيق موسّع يرصد أرقام الهجرة اللبنانية خلال السنوات الأخيرة ويوثّق قصصاً إنسانية لعائلات اختارت مغادرة الوطن.',
    body_md: `# الهجرة اللبنانية: تحقيق موسّع

أجرى فريق "4 لبنان" تحقيقاً موسعاً حول ظاهرة الهجرة المتزايدة من لبنان.

## الأرقام

- 300,000 لبناني هاجروا منذ 2020
- 40% منهم من فئة الشباب
- أبرز الوجهات: كندا، أستراليا، الخليج`,
    section_slug: 'investigation',
    is_breaking: false,
    is_featured: true,
    cover_image_path:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'قوى الأمن تفكك خلية إرهابية كانت تخطط لعمليات في بيروت',
    excerpt_ar:
      'أعلنت المديرية العامة لقوى الأمن الداخلي عن تفكيك خلية إرهابية وتوقيف أعضائها قبل تنفيذ عمليات إرهابية.',
    body_md: `# تفكيك خلية إرهابية

أعلنت قوى الأمن الداخلي عن إحباط مخطط إرهابي في العاصمة بيروت.

## نتائج العملية

- توقيف 6 أشخاص
- ضبط متفجرات وأسلحة
- التحقيقات مستمرة`,
    section_slug: 'security',
    is_breaking: true,
    is_featured: true,
    cover_image_path:
      'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'افتتاح أول مصنع للسيارات الكهربائية في لبنان',
    excerpt_ar:
      'افتُتح في منطقة الكرنتينا أول مصنع لتجميع السيارات الكهربائية في لبنان باستثمار لبناني-صيني مشترك.',
    body_md: `# مصنع السيارات الكهربائية

شهد لبنان افتتاح أول مصنع لتجميع السيارات الكهربائية في منطقة الكرنتينا.

## تفاصيل المشروع

- الاستثمار: 50 مليون دولار
- الطاقة الإنتاجية: 5000 سيارة سنوياً
- فرص العمل: 200 وظيفة مباشرة`,
    section_slug: 'economy',
    is_breaking: false,
    is_featured: true,
    cover_image_path:
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'زيارة رسمية لوزير الخارجية الفرنسي: دعم أوروبي للإصلاحات',
    excerpt_ar:
      'وصل وزير الخارجية الفرنسي إلى بيروت في زيارة رسمية حاملاً رسائل دعم أوروبي للإصلاحات في لبنان.',
    body_md: `# زيارة وزير الخارجية الفرنسي

وصل وزير الخارجية الفرنسي إلى بيروت في زيارة رسمية تستمر يومين.

## جدول الزيارة

- لقاء رئيس الجمهورية
- اجتماع مع رئيس الحكومة
- جولة على مشاريع إنسانية`,
    section_slug: 'regional',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1524522173746-f628baad3644?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'إطلاق برنامج وطني لدعم المزارعين الصغار',
    excerpt_ar:
      'أطلقت وزارة الزراعة بالتعاون مع منظمات دولية برنامجاً لدعم صغار المزارعين يشمل قروضاً ميسرة ومساعدات تقنية.',
    body_md: `# برنامج دعم المزارعين

أطلقت وزارة الزراعة برنامجاً شاملاً لدعم صغار المزارعين في لبنان.

## عناصر البرنامج

- قروض بفائدة صفر
- توزيع بذور وأسمدة
- تدريب على الزراعة الحديثة`,
    section_slug: 'local',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'ضبط شحنة مخدرات كبيرة في مرفأ بيروت',
    excerpt_ar:
      'ضبطت الجمارك اللبنانية شحنة مخدرات كبيرة كانت مخبأة في حاوية قادمة من أمريكا الجنوبية عبر مرفأ بيروت.',
    body_md: `# ضبط مخدرات في المرفأ

نجحت الجمارك اللبنانية في ضبط شحنة مخدرات كبيرة في مرفأ بيروت.

## تفاصيل الضبطية

- الكمية: 500 كيلوغرام
- المصدر: أمريكا الجنوبية
- طريقة الإخفاء: داخل شحنة فواكه`,
    section_slug: 'security',
    is_breaking: true,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'حوار: رئيس الجامعة اللبنانية يتحدث عن مستقبل التعليم العالي',
    excerpt_ar:
      'في حوار خاص، يتحدث رئيس الجامعة اللبنانية عن التحديات التي تواجه التعليم العالي الرسمي وخطط التطوير.',
    body_md: `# حوار مع رئيس الجامعة اللبنانية

أجرت "4 لبنان" حواراً مع رئيس الجامعة اللبنانية حول مستقبل التعليم العالي.

## أبرز التصريحات

- ضرورة تحديث المناهج
- التحول الرقمي أولوية
- الحاجة لدعم مالي أكبر`,
    section_slug: 'special',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'انقطاع الكهرباء يضرب مناطق واسعة في بيروت الكبرى',
    excerpt_ar:
      'شهدت مناطق واسعة من بيروت الكبرى انقطاعاً مفاجئاً في التيار الكهربائي بسبب عطل في المحطة الرئيسية.',
    body_md: `# انقطاع الكهرباء في بيروت

ضرب انقطاع مفاجئ للتيار الكهربائي مناطق واسعة من العاصمة.

## المناطق المتأثرة

- بيروت الإدارية
- الأشرفية والجميزة
- الحمرا وفردان`,
    section_slug: 'radar',
    is_breaking: true,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1518173946687-a4c340f9c1f0?w=1200&h=800&fit=crop',
  },
  {
    title_ar: 'دراسة: تلوث الهواء في بيروت يتجاوز المعايير العالمية بخمس مرات',
    excerpt_ar:
      'كشفت دراسة بيئية جديدة أن نسبة تلوث الهواء في العاصمة بيروت تتجاوز المعايير الصحية العالمية بمعدل خمس مرات.',
    body_md: `# تلوث الهواء في بيروت

كشفت دراسة علمية جديدة عن مستويات خطيرة من تلوث الهواء في بيروت.

## نتائج الدراسة

- تجاوز معايير WHO بـ 5 أضعاف
- المصادر: السيارات والمولدات
- التأثير الصحي: أمراض تنفسية`,
    section_slug: 'investigation',
    is_breaking: false,
    is_featured: false,
    cover_image_path:
      'https://images.unsplash.com/photo-1532330393533-443990a51d10?w=1200&h=800&fit=crop',
  },
]

async function getOrCreateAuthor(): Promise<string> {
  // Get existing auth user
  const { data: authUser } = await supabase.auth.admin.listUsers()
  const userId = authUser?.users?.[0]?.id

  if (!userId) {
    throw new Error(
      'No auth user found. Please create a user account first via Supabase dashboard.'
    )
  }

  console.log(`🔍 Found auth user: ${userId}`)

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name_ar')
    .eq('id', userId)
    .single()

  if (profile?.id) {
    console.log(`✅ Profile exists: ${profile.display_name_ar}`)
    return profile.id
  }

  // Create profile if missing
  console.log('⚠️  Profile missing, creating one...')
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      display_name_ar: 'مسؤول الموقع',
      role: 'super_admin',
    })
    .select('id')
    .single()

  if (createError) {
    console.error('Failed to create profile:', createError)
    throw new Error('Could not create profile for auth user.')
  }

  console.log(`✅ Created profile for user: ${userId}`)
  return newProfile!.id
}

async function getSectionId(slug: string): Promise<number | null> {
  const { data } = await supabase.from('sections').select('id').eq('slug', slug).single()

  return data?.id || null
}

async function clearArticles() {
  console.log('🗑️  Deleting all existing articles...')

  // Delete article_topics first (foreign key constraint)
  await supabase
    .from('article_topics')
    .delete()
    .neq('article_id', '00000000-0000-0000-0000-000000000000')

  // Delete all articles
  const { error } = await supabase
    .from('articles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    console.error('Error deleting articles:', error)
    throw error
  }

  console.log('✅ All articles deleted')
}

async function createArticles(authorId: string) {
  console.log('📝 Creating new articles...')

  let created = 0
  for (const article of sampleArticles) {
    const sectionId = await getSectionId(article.section_slug)

    // Generate a slug from the title
    const slug =
      article.title_ar
        .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) +
      '-' +
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 5)

    const { error } = await supabase
      .from('articles')
      .insert({
        author_id: authorId,
        slug,
        title_ar: article.title_ar,
        excerpt_ar: article.excerpt_ar,
        body_md: article.body_md,
        cover_image_path: article.cover_image_path,
        section_id: sectionId,
        status: 'published',
        published_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 7 days
        is_breaking: article.is_breaking,
        is_featured: article.is_featured,
        sources: [],
      })
      .select('id, title_ar')
      .single()

    if (error) {
      console.error(
        `❌ Error creating article "${article.title_ar.substring(0, 30)}...":`,
        error.message
      )
    } else {
      created++
      console.log(`✅ Created: ${article.title_ar.substring(0, 50)}...`)
    }
  }

  return created
}

async function main() {
  console.log('🚀 Starting seed script...\n')

  try {
    // Get or create author
    const authorId = await getOrCreateAuthor()
    console.log(`👤 Using author ID: ${authorId}\n`)

    // Clear existing articles
    await clearArticles()
    console.log('')

    // Create new articles
    const created = await createArticles(authorId)

    console.log('\n✨ Seed completed successfully!')
    console.log(`📊 Created ${created} articles with images`)
  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  }
}

main()
