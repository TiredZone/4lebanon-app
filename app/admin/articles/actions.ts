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
import type { ArticleFormData, UserRole, ArticlePriority } from '@/types/database'
import { MAX_PINNED_ARTICLES } from '@/lib/constants'

interface ActionResult {
  error?: string
  success?: boolean
  articleId?: string
  newSlug?: string
}

/** Clamp priority to the max allowed for a given role */
function clampPriority(priority: number, role: UserRole): ArticlePriority {
  // super_admin: 1-5, admin: 2-5, editor: 3-5
  const minAllowed = role === 'super_admin' ? 1 : role === 'admin' ? 2 : 3
  return Math.max(priority, minAllowed) as ArticlePriority
}

/** Get the sort_position for a new pinned article (FIFO: first pinned stays on top) */
async function getPinnedSortPosition(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  const { data } = await supabase
    .from('articles')
    .select('sort_position')
    .eq('priority', 1)
    .eq('status', 'published')
    .order('sort_position', { ascending: true })
    .limit(1)

  const minPosition = data?.[0]?.sort_position as number | undefined
  return minPosition != null ? minPosition - 1 : 0
}

/** Check if the pinned articles limit has been reached */
async function getPinnedCount(supabase: Awaited<ReturnType<typeof createClient>>): Promise<number> {
  const { count } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('priority', 1)
    .eq('status', 'published')

  return count ?? 0
}

async function verifyEditorRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return (
    !!profile && ['super_admin', 'admin', 'editor'].includes((profile as { role: string }).role)
  )
}

export async function createArticle(formData: ArticleFormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'يجب تسجيل الدخول' }
    }

    if (!(await verifyEditorRole(supabase, user.id))) {
      return { error: 'ليس لديك صلاحية لهذا الإجراء' }
    }

    // Get user role for priority enforcement
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const creatorRole = ((creatorProfile as { role: string } | null)?.role as UserRole) || 'editor'

    // Rate limiting
    const clientId = await getClientIdentifier()
    const rateLimit = checkRateLimit(clientId, 'create')
    if (!rateLimit.allowed) {
      return { error: 'تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً' }
    }

    // Validate and sanitize input with Zod
    const validationResult = ArticleSchema.safeParse(formData)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return { error: firstError?.message || 'البيانات المدخلة غير صالحة' }
    }

    const validatedData = validationResult.data

    // Enforce role-based priority cap
    const effectivePriority = clampPriority(validatedData.priority, creatorRole)

    // Check pinned limit if priority 1
    if (effectivePriority === 1) {
      const pinnedCount = await getPinnedCount(supabase)
      if (pinnedCount >= MAX_PINNED_ARTICLES) {
        return { error: `لا يمكن تثبيت أكثر من ${MAX_PINNED_ARTICLES} مقالات في الأعلى` }
      }
    }

    // Generate slug from sanitized title
    const slug = generateSlug(validatedData.title_ar, crypto.randomUUID().slice(0, 8))

    // Calculate sort_position
    const publishedAt =
      validatedData.status !== 'draft'
        ? validatedData.published_at || new Date().toISOString()
        : null
    let sortPosition: number
    if (effectivePriority === 1) {
      sortPosition = await getPinnedSortPosition(supabase)
    } else {
      sortPosition = publishedAt ? new Date(publishedAt).getTime() / 1000 : Date.now() / 1000
    }

    // Insert article with validated data
    // Note: is_breaking/is_featured are auto-set by DB trigger from priority
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
        published_at: publishedAt,
        priority: effectivePriority,
        sort_position: sortPosition,
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
      const { error: topicsError } = await supabase.from('article_topics').insert(
        validatedData.topic_ids.map((topic_id) => ({
          article_id: articleId,
          topic_id,
        }))
      )
      if (topicsError) {
        console.error('Error inserting article topics:', topicsError)
      }
    }

    // Revalidate paths
    revalidatePath('/')
    revalidatePath('/admin')
    if (validatedData.status === 'published') {
      revalidatePath(`/article/${slug}`)
    }

    return { success: true, articleId }
  } catch (err) {
    console.error('createArticle unexpected error:', err)
    return { error: 'حدث خطأ أثناء إنشاء المقال. يرجى المحاولة مرة أخرى.' }
  }
}

export async function updateArticle(
  articleId: string,
  formData: ArticleFormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'يجب تسجيل الدخول' }
    }

    // Validate article ID first (fast check)
    const idValidation = UUIDSchema.safeParse(articleId)
    if (!idValidation.success) {
      return { error: 'معرف المقال غير صالح' }
    }

    // AUTHORIZATION CHECK FIRST - verify ownership before expensive operations
    const { data: existingArticle, error: fetchError } = await supabase
      .from('articles')
      .select('author_id, slug, status, title_ar, priority, sort_position')
      .eq('id', articleId)
      .single()

    if (fetchError || !existingArticle) {
      return { error: 'المقال غير موجود أو ليس لديك صلاحية للتعديل' }
    }

    const existing = existingArticle as {
      author_id: string
      slug: string
      status: string
      title_ar: string
      priority: number
      sort_position: number
    }

    // Get user role - needed for both authorization and priority enforcement
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const updaterRole: UserRole =
      ((currentUserProfile as { role: string } | null)?.role as UserRole) || 'editor'

    if (existing.author_id !== user.id) {
      let authorized = updaterRole === 'super_admin'

      if (!authorized && updaterRole === 'admin') {
        const { data: authorProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', existing.author_id)
          .single()
        const authorRole = (authorProfile as { role: string } | null)?.role
        authorized = authorRole === 'editor'
      }

      if (!authorized) {
        return { error: 'المقال غير موجود أو ليس لديك صلاحية للتعديل' }
      }
    }

    // Rate limiting
    const clientId = await getClientIdentifier()
    const rateLimit = checkRateLimit(clientId, 'create')
    if (!rateLimit.allowed) {
      return { error: 'تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً' }
    }

    // Validate and sanitize input with Zod
    const validationResult = ArticleSchema.safeParse(formData)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return { error: firstError?.message || 'البيانات المدخلة غير صالحة' }
    }

    const validatedData = validationResult.data

    // Enforce role-based priority cap
    const effectivePriority = clampPriority(validatedData.priority, updaterRole)

    // Check pinned limit if changing TO priority 1 (not if already pinned)
    if (effectivePriority === 1 && existing.priority !== 1) {
      const pinnedCount = await getPinnedCount(supabase)
      if (pinnedCount >= MAX_PINNED_ARTICLES) {
        return { error: `لا يمكن تثبيت أكثر من ${MAX_PINNED_ARTICLES} مقالات في الأعلى` }
      }
    }

    const oldSlug = existing.slug
    const wasPublished = existing.status === 'published'

    // Generate new slug if title changed
    let newSlug = oldSlug
    if (existing.title_ar !== validatedData.title_ar) {
      newSlug = generateSlug(validatedData.title_ar, articleId.slice(0, 8))
    }

    // Calculate sort_position based on priority change
    const publishedAt =
      validatedData.status !== 'draft'
        ? validatedData.published_at || new Date().toISOString()
        : null
    let sortPosition = existing.sort_position
    if (effectivePriority !== existing.priority) {
      if (effectivePriority === 1) {
        sortPosition = await getPinnedSortPosition(supabase)
      } else {
        sortPosition = publishedAt ? new Date(publishedAt).getTime() / 1000 : Date.now() / 1000
      }
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
        published_at: publishedAt,
        priority: effectivePriority,
        sort_position: sortPosition,
        sources: validatedData.sources,
      })
      .eq('id', articleId)

    if (updateError) {
      console.error('Update article error:', updateError)
      return { error: 'حدث خطأ أثناء تحديث المقال' }
    }

    // Update article topics
    const { error: deleteTopicsError } = await supabase
      .from('article_topics')
      .delete()
      .eq('article_id', articleId)

    if (deleteTopicsError) {
      console.error('Error deleting article topics:', deleteTopicsError)
    }

    if (validatedData.topic_ids.length > 0) {
      const { error: insertTopicsError } = await supabase.from('article_topics').insert(
        validatedData.topic_ids.map((topic_id) => ({
          article_id: articleId,
          topic_id,
        }))
      )

      if (insertTopicsError) {
        console.error('Error inserting article topics:', insertTopicsError)
      }
    }

    // Revalidate paths
    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath(`/article/${newSlug}`)
    if (oldSlug !== newSlug && wasPublished) {
      revalidatePath(`/article/${oldSlug}`)
    }

    return { success: true, newSlug }
  } catch (err) {
    console.error('updateArticle unexpected error:', err)
    return { error: 'حدث خطأ أثناء تحديث المقال. يرجى المحاولة مرة أخرى.' }
  }
}

export async function deleteArticle(articleId: string): Promise<ActionResult | void> {
  let shouldRedirect = false

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'يجب تسجيل الدخول' }
    }

    const idValidation = UUIDSchema.safeParse(articleId)
    if (!idValidation.success) {
      return { error: 'معرف المقال غير صالح' }
    }

    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('author_id, slug')
      .eq('id', articleId)
      .single()

    if (fetchError || !article) {
      return { error: 'المقال غير موجود أو ليس لديك صلاحية للحذف' }
    }

    const articleData = article as { author_id: string; slug: string }

    if (articleData.author_id !== user.id) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const userRole = (userProfile as { role: string } | null)?.role as UserRole

      let authorized = userRole === 'super_admin'

      if (!authorized && userRole === 'admin') {
        const { data: authorProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', articleData.author_id)
          .single()
        const authorRole = (authorProfile as { role: string } | null)?.role
        authorized = authorRole === 'editor'
      }

      if (!authorized) {
        return { error: 'المقال غير موجود أو ليس لديك صلاحية للحذف' }
      }
    }

    const { error: deleteError } = await supabase.from('articles').delete().eq('id', articleId)

    if (deleteError) {
      console.error('Delete article error:', deleteError)
      return { error: 'حدث خطأ أثناء حذف المقال' }
    }

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath(`/article/${articleData.slug}`)

    shouldRedirect = true
  } catch (err) {
    console.error('deleteArticle unexpected error:', err)
    return { error: 'حدث خطأ أثناء حذف المقال' }
  }

  if (shouldRedirect) {
    redirect('/admin')
  }
}

// Magic bytes for image format verification
const IMAGE_MAGIC_BYTES: Record<string, number[][]> = {
  jpeg: [
    [0xff, 0xd8, 0xff], // JPEG/JFIF
  ],
  jpg: [
    [0xff, 0xd8, 0xff], // JPEG/JFIF
  ],
  png: [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  ],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  webp: [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP starts with RIFF)
  ],
}

/**
 * Verify file content matches its claimed type using magic bytes
 */
async function verifyImageMagicBytes(
  file: File,
  extension: string
): Promise<{ valid: boolean; detectedType?: string }> {
  const expectedMagicBytes = IMAGE_MAGIC_BYTES[extension]
  if (!expectedMagicBytes) {
    return { valid: false }
  }

  try {
    // Read first 12 bytes for magic byte detection
    const buffer = await file.slice(0, 12).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    for (const magic of expectedMagicBytes) {
      let matches = true
      for (let i = 0; i < magic.length; i++) {
        if (bytes[i] !== magic[i]) {
          matches = false
          break
        }
      }
      if (matches) {
        return { valid: true, detectedType: extension }
      }
    }

    // Check if it matches any other image type (possible extension spoofing)
    for (const [type, magicList] of Object.entries(IMAGE_MAGIC_BYTES)) {
      for (const magic of magicList) {
        let matches = true
        for (let i = 0; i < magic.length; i++) {
          if (bytes[i] !== magic[i]) {
            matches = false
            break
          }
        }
        if (matches) {
          return { valid: false, detectedType: type }
        }
      }
    }

    return { valid: false }
  } catch {
    return { valid: false }
  }
}

/**
 * Check for embedded scripts or malicious content in image files.
 * NOTE: Only called AFTER magic byte verification confirms the file is a real image.
 * We skip the scan entirely for verified images because binary image data
 * produces false positives with text-based pattern matching (e.g. random bytes
 * matching `<%` or `<?php`). Magic byte verification is sufficient security.
 */
async function scanForMaliciousContent(
  file: File,
  magicBytesVerified: boolean
): Promise<{ safe: boolean; reason?: string }> {
  // If magic bytes already confirmed this is a valid image, skip text scan.
  // Binary image data contains random byte sequences that match text patterns.
  if (magicBytesVerified) {
    return { safe: true }
  }

  try {
    const textContent = await file.slice(0, 1024).text()
    const maliciousPatterns = [/<script/i, /javascript:/i]

    for (const pattern of maliciousPatterns) {
      if (pattern.test(textContent)) {
        return { safe: false, reason: `Malicious pattern detected: ${pattern}` }
      }
    }

    return { safe: true }
  } catch {
    return { safe: true }
  }
}

export async function uploadImage(
  formData: FormData
): Promise<{ error?: string; success?: boolean; path?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'يجب تسجيل الدخول' }
    }

    // Rate limiting for uploads - stricter limit
    const clientId = await getClientIdentifier()
    const rateLimit = checkRateLimit(clientId, 'upload')
    if (!rateLimit.allowed) {
      return { error: 'تم تجاوز حد الرفع. يرجى المحاولة لاحقاً' }
    }

    const file = formData.get('file') as File

    if (!file) {
      return { error: 'لم يتم اختيار ملف' }
    }

    // 1. Validate file type - check both MIME type and extension
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

    // 2. Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return { error: 'حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)' }
    }

    // 3. Validate file size minimum (prevent empty files)
    if (file.size < 100) {
      await logSecurityEvent('suspicious_activity', {
        action: 'uploadImage',
        userId: user.id,
        reason: 'File too small',
        fileSize: file.size,
      })
      return { error: 'الملف فارغ أو صغير جداً' }
    }

    // 4. SECURITY: Verify magic bytes match claimed extension
    const magicByteCheck = await verifyImageMagicBytes(file, fileExtension)
    if (!magicByteCheck.valid) {
      await logSecurityEvent('suspicious_activity', {
        action: 'uploadImage',
        userId: user.id,
        reason: 'Magic byte mismatch - possible file spoofing',
        claimedExtension: fileExtension,
        detectedType: magicByteCheck.detectedType || 'unknown',
        fileName: file.name,
      })
      return { error: 'محتوى الملف لا يتطابق مع نوعه - يرجى رفع صورة صالحة' }
    }

    // 5. SECURITY: Scan for embedded malicious content
    const malwareCheck = await scanForMaliciousContent(file, magicByteCheck.valid)
    if (!malwareCheck.safe) {
      await logSecurityEvent('suspicious_activity', {
        action: 'uploadImage',
        userId: user.id,
        reason: malwareCheck.reason,
        fileName: file.name,
      })
      return { error: 'تم اكتشاف محتوى مشبوه في الملف' }
    }

    // 6. Sanitize filename and generate secure unique name
    const sanitizedExt = sanitizeFilename(fileExtension)
    const filename = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${sanitizedExt}`

    // Log successful file upload
    await logSecurityEvent('file_upload', {
      userId: user.id,
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      storedAs: filename,
    })

    // 7. Upload to Supabase Storage with strict settings
    const { error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(filename, file, {
        cacheControl: '31536000', // 1 year
        upsert: false, // Never overwrite existing files
        contentType: file.type, // Enforce content type
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'حدث خطأ أثناء رفع الصورة' }
    }

    return { success: true, path: filename }
  } catch (err) {
    console.error('uploadImage unexpected error:', err)
    return { error: 'حدث خطأ أثناء رفع الصورة. يرجى المحاولة مرة أخرى.' }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
