'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'
import type { ArticleFormData } from '@/types/database'

interface ActionResult {
  error?: string
  success?: boolean
  articleId?: string
  newSlug?: string
}

export async function createArticle(formData: ArticleFormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'يجب تسجيل الدخول' }
  }

  // Generate slug from title
  const slug = generateSlug(formData.title_ar, crypto.randomUUID().slice(0, 8))

  // Insert article
  const { data: article, error: insertError } = await supabase
    .from('articles')
    .insert({
      author_id: user.id,
      slug,
      title_ar: formData.title_ar,
      excerpt_ar: formData.excerpt_ar || null,
      body_md: formData.body_md,
      cover_image_path: formData.cover_image_path,
      section_id: formData.section_id,
      region_id: formData.region_id,
      country_id: formData.country_id,
      status: formData.status,
      published_at:
        formData.status !== 'draft' ? formData.published_at || new Date().toISOString() : null,
      is_breaking: formData.is_breaking,
      is_featured: formData.is_featured,
      sources: formData.sources,
    })
    .select('id')
    .single()

  if (insertError || !article) {
    console.error('Create article error:', insertError)
    return { error: 'حدث خطأ أثناء إنشاء المقال' }
  }

  const articleId = (article as { id: string }).id

  // Insert article topics
  if (formData.topic_ids.length > 0) {
    await supabase.from('article_topics').insert(
      formData.topic_ids.map((topic_id) => ({
        article_id: articleId,
        topic_id,
      }))
    )
  }

  // Revalidate paths
  revalidatePath('/')
  revalidatePath('/admin')
  if (formData.status === 'published') {
    revalidatePath(`/article/${slug}`)
  }

  return { success: true, articleId }
}

export async function updateArticle(
  articleId: string,
  formData: ArticleFormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'يجب تسجيل الدخول' }
  }

  // Verify ownership
  const { data: existingArticle } = await supabase
    .from('articles')
    .select('author_id, slug, status, title_ar')
    .eq('id', articleId)
    .single()

  if (!existingArticle) {
    return { error: 'المقال غير موجود' }
  }

  const existing = existingArticle as {
    author_id: string
    slug: string
    status: string
    title_ar: string
  }

  if (existing.author_id !== user.id) {
    return { error: 'ليس لديك صلاحية لتعديل هذا المقال' }
  }

  const oldSlug = existing.slug
  const wasPublished = existing.status === 'published'

  // Generate new slug if title changed
  let newSlug = oldSlug
  if (existing.title_ar !== formData.title_ar) {
    newSlug = generateSlug(formData.title_ar, articleId.slice(0, 8))
  }

  // Update article
  const { error: updateError } = await supabase
    .from('articles')
    .update({
      slug: newSlug,
      title_ar: formData.title_ar,
      excerpt_ar: formData.excerpt_ar || null,
      body_md: formData.body_md,
      cover_image_path: formData.cover_image_path,
      section_id: formData.section_id,
      region_id: formData.region_id,
      country_id: formData.country_id,
      status: formData.status,
      published_at:
        formData.status !== 'draft' ? formData.published_at || new Date().toISOString() : null,
      is_breaking: formData.is_breaking,
      is_featured: formData.is_featured,
      sources: formData.sources,
    })
    .eq('id', articleId)

  if (updateError) {
    console.error('Update article error:', updateError)
    return { error: 'حدث خطأ أثناء تحديث المقال' }
  }

  // Update article topics (delete existing, insert new)
  await supabase.from('article_topics').delete().eq('article_id', articleId)

  if (formData.topic_ids.length > 0) {
    await supabase.from('article_topics').insert(
      formData.topic_ids.map((topic_id) => ({
        article_id: articleId,
        topic_id,
      }))
    )
  }

  // Revalidate paths
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath(`/article/${newSlug}`)
  if (oldSlug !== newSlug && wasPublished) {
    revalidatePath(`/article/${oldSlug}`)
  }

  return { success: true, newSlug }
}

export async function deleteArticle(articleId: string): Promise<ActionResult | void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'يجب تسجيل الدخول' }
  }

  // Verify ownership and get slug for revalidation
  const { data: article } = await supabase
    .from('articles')
    .select('author_id, slug')
    .eq('id', articleId)
    .single()

  if (!article) {
    return { error: 'المقال غير موجود' }
  }

  const articleData = article as { author_id: string; slug: string }

  if (articleData.author_id !== user.id) {
    return { error: 'ليس لديك صلاحية لحذف هذا المقال' }
  }

  // Delete article (cascades to article_topics)
  const { error: deleteError } = await supabase.from('articles').delete().eq('id', articleId)

  if (deleteError) {
    console.error('Delete article error:', deleteError)
    return { error: 'حدث خطأ أثناء حذف المقال' }
  }

  // Revalidate paths
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath(`/article/${articleData.slug}`)

  redirect('/admin')
}

export async function uploadImage(
  formData: FormData
): Promise<{ error?: string; success?: boolean; path?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'يجب تسجيل الدخول' }
  }

  const file = formData.get('file') as File

  if (!file) {
    return { error: 'لم يتم اختيار ملف' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'نوع الملف غير مدعوم' }
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { error: 'حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)' }
  }

  // Generate unique filename
  const ext = file.name.split('.').pop()
  const filename = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage.from('images').upload(filename, file, {
    cacheControl: '31536000', // 1 year
    upsert: false,
  })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: 'حدث خطأ أثناء رفع الصورة' }
  }

  return { success: true, path: filename }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
