'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'
import {
  ArticleSchema,
  UUIDSchema,
  checkRateLimit,
  getClientIdentifier,
  logSecurityEvent,
  sanitizeFilename,
} from '@/lib/security'
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
    await logSecurityEvent('unauthorized_access', { action: 'createArticle' })
    return { error: 'يجب تسجيل الدخول' }
  }

  // Rate limiting
  const clientId = await getClientIdentifier()
  const rateLimit = checkRateLimit(clientId, 'create')
  if (!rateLimit.allowed) {
    await logSecurityEvent('rate_limit_exceeded', { action: 'createArticle', userId: user.id })
    return { error: 'تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً' }
  }

  // Validate and sanitize input with Zod
  const validationResult = ArticleSchema.safeParse(formData)
  if (!validationResult.success) {
    await logSecurityEvent('invalid_input', {
      action: 'createArticle',
      userId: user.id,
      errors: validationResult.error.flatten().fieldErrors,
    })
    const firstError = validationResult.error.issues[0]
    return { error: firstError?.message || 'البيانات المدخلة غير صالحة' }
  }

  const validatedData = validationResult.data

  // Generate slug from sanitized title
  const slug = generateSlug(validatedData.title_ar, crypto.randomUUID().slice(0, 8))

  // Insert article with validated data
  const { data: article, error: insertError } = await supabase
    .from('articles')
    .insert({
      author_id: user.id,
      slug,
      title_ar: validatedData.title_ar,
      excerpt_ar: validatedData.excerpt_ar || null,
      body_md: validatedData.body_md,
      cover_image_path: validatedData.cover_image_path,
      section_id: validatedData.section_id,
      region_id: validatedData.region_id,
      country_id: validatedData.country_id,
      status: validatedData.status,
      published_at:
        validatedData.status !== 'draft'
          ? validatedData.published_at || new Date().toISOString()
          : null,
      is_breaking: validatedData.is_breaking,
      is_featured: validatedData.is_featured,
      sources: validatedData.sources,
    })
    .select('id')
    .single()

  if (insertError || !article) {
    console.error('Create article error:', insertError)
    return { error: 'حدث خطأ أثناء إنشاء المقال' }
  }

  const articleId = (article as { id: string }).id

  // Insert article topics
  if (validatedData.topic_ids.length > 0) {
    await supabase.from('article_topics').insert(
      validatedData.topic_ids.map((topic_id) => ({
        article_id: articleId,
        topic_id,
      }))
    )
  }

  // Revalidate paths
  revalidatePath('/')
  revalidatePath('/admin')
  if (validatedData.status === 'published') {
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
    await logSecurityEvent('unauthorized_access', { action: 'updateArticle' })
    return { error: 'يجب تسجيل الدخول' }
  }

  // Validate article ID
  const idValidation = UUIDSchema.safeParse(articleId)
  if (!idValidation.success) {
    await logSecurityEvent('invalid_input', {
      action: 'updateArticle',
      userId: user.id,
      error: 'Invalid article ID format',
    })
    return { error: 'معرف المقال غير صالح' }
  }

  // Rate limiting
  const clientId = await getClientIdentifier()
  const rateLimit = checkRateLimit(clientId, 'create')
  if (!rateLimit.allowed) {
    await logSecurityEvent('rate_limit_exceeded', { action: 'updateArticle', userId: user.id })
    return { error: 'تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً' }
  }

  // Validate and sanitize input with Zod
  const validationResult = ArticleSchema.safeParse(formData)
  if (!validationResult.success) {
    await logSecurityEvent('invalid_input', {
      action: 'updateArticle',
      userId: user.id,
      errors: validationResult.error.flatten().fieldErrors,
    })
    const firstError = validationResult.error.issues[0]
    return { error: firstError?.message || 'البيانات المدخلة غير صالحة' }
  }

  const validatedData = validationResult.data

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
    await logSecurityEvent('unauthorized_access', {
      action: 'updateArticle',
      userId: user.id,
      attemptedArticleId: articleId,
    })
    return { error: 'ليس لديك صلاحية لتعديل هذا المقال' }
  }

  const oldSlug = existing.slug
  const wasPublished = existing.status === 'published'

  // Generate new slug if title changed
  let newSlug = oldSlug
  if (existing.title_ar !== validatedData.title_ar) {
    newSlug = generateSlug(validatedData.title_ar, articleId.slice(0, 8))
  }

  // Update article with validated data
  const { error: updateError } = await supabase
    .from('articles')
    .update({
      slug: newSlug,
      title_ar: validatedData.title_ar,
      excerpt_ar: validatedData.excerpt_ar || null,
      body_md: validatedData.body_md,
      cover_image_path: validatedData.cover_image_path,
      section_id: validatedData.section_id,
      region_id: validatedData.region_id,
      country_id: validatedData.country_id,
      status: validatedData.status,
      published_at:
        validatedData.status !== 'draft'
          ? validatedData.published_at || new Date().toISOString()
          : null,
      is_breaking: validatedData.is_breaking,
      is_featured: validatedData.is_featured,
      sources: validatedData.sources,
    })
    .eq('id', articleId)

  if (updateError) {
    console.error('Update article error:', updateError)
    return { error: 'حدث خطأ أثناء تحديث المقال' }
  }

  // Update article topics (delete existing, insert new)
  await supabase.from('article_topics').delete().eq('article_id', articleId)

  if (validatedData.topic_ids.length > 0) {
    await supabase.from('article_topics').insert(
      validatedData.topic_ids.map((topic_id) => ({
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
    await logSecurityEvent('unauthorized_access', { action: 'deleteArticle' })
    return { error: 'يجب تسجيل الدخول' }
  }

  // Validate article ID
  const idValidation = UUIDSchema.safeParse(articleId)
  if (!idValidation.success) {
    await logSecurityEvent('invalid_input', {
      action: 'deleteArticle',
      userId: user.id,
      error: 'Invalid article ID format',
    })
    return { error: 'معرف المقال غير صالح' }
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
    await logSecurityEvent('unauthorized_access', {
      action: 'deleteArticle',
      userId: user.id,
      attemptedArticleId: articleId,
    })
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
    await logSecurityEvent('unauthorized_access', { action: 'uploadImage' })
    return { error: 'يجب تسجيل الدخول' }
  }

  // Rate limiting for uploads
  const clientId = await getClientIdentifier()
  const rateLimit = checkRateLimit(clientId, 'upload')
  if (!rateLimit.allowed) {
    await logSecurityEvent('rate_limit_exceeded', { action: 'uploadImage', userId: user.id })
    return { error: 'تم تجاوز حد الرفع. يرجى المحاولة لاحقاً' }
  }

  const file = formData.get('file') as File

  if (!file) {
    return { error: 'لم يتم اختيار ملف' }
  }

  // Validate file type - check both MIME type and extension
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  const fileExtension = file.name.split('.').pop()?.toLowerCase()

  if (
    !allowedTypes.includes(file.type) ||
    !fileExtension ||
    !allowedExtensions.includes(fileExtension)
  ) {
    await logSecurityEvent('suspicious_activity', {
      action: 'uploadImage',
      userId: user.id,
      reason: 'Invalid file type',
      providedType: file.type,
      fileName: file.name,
    })
    return { error: 'نوع الملف غير مدعوم' }
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { error: 'حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)' }
  }

  // Validate file size minimum (prevent empty files)
  if (file.size < 100) {
    await logSecurityEvent('suspicious_activity', {
      action: 'uploadImage',
      userId: user.id,
      reason: 'File too small',
      fileSize: file.size,
    })
    return { error: 'الملف فارغ أو صغير جداً' }
  }

  // Sanitize filename and generate secure unique name
  const sanitizedExt = sanitizeFilename(fileExtension)
  const filename = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${sanitizedExt}`

  // Log file upload
  await logSecurityEvent('file_upload', {
    userId: user.id,
    originalName: file.name,
    fileSize: file.size,
    fileType: file.type,
  })

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('article-images')
    .upload(filename, file, {
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
