'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { UUIDSchema, checkRateLimit, getClientIdentifier, logSecurityEvent } from '@/lib/security'
import type { UserRole, ArticlePriority } from '@/types/database'
import { MAX_PINNED_ARTICLES } from '@/lib/constants'

function clampPriority(priority: number, role: UserRole): ArticlePriority {
  const minAllowed = role === 'super_admin' ? 1 : role === 'admin' ? 2 : 3
  return Math.max(priority, minAllowed) as ArticlePriority
}

async function getAuthenticatedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = ((profile as { role: string } | null)?.role as UserRole) || 'editor'
  return { user, role }
}

export async function updateArticlePriority(
  articleId: string,
  newPriority: number
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const auth = await getAuthenticatedUser(supabase)

  if (!auth) {
    return { error: 'يجب تسجيل الدخول' }
  }

  if (auth.role === 'editor') {
    return { error: 'ليس لديك صلاحية لهذا الإجراء' }
  }

  const idValidation = UUIDSchema.safeParse(articleId)
  if (!idValidation.success) {
    return { error: 'معرف المقال غير صالح' }
  }

  if (newPriority < 1 || newPriority > 5) {
    return { error: 'قيمة الأولوية غير صالحة' }
  }

  const clientId = await getClientIdentifier()
  const rateLimit = checkRateLimit(clientId, 'admin')
  if (!rateLimit.allowed) {
    return { error: 'تم تجاوز حد الطلبات' }
  }

  const effectivePriority = clampPriority(newPriority, auth.role)

  // Check pinned limit
  if (effectivePriority === 1) {
    const { count } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('priority', 1)
      .eq('status', 'published')
      .neq('id', articleId)

    if ((count ?? 0) >= MAX_PINNED_ARTICLES) {
      return { error: `لا يمكن تثبيت أكثر من ${MAX_PINNED_ARTICLES} مقالات` }
    }
  }

  // Get the article to check authorization
  const { data: article } = await supabase
    .from('articles')
    .select('author_id, published_at')
    .eq('id', articleId)
    .single()

  if (!article) {
    return { error: 'المقال غير موجود' }
  }

  const articleData = article as { author_id: string; published_at: string | null }

  // Authorization: own article, super_admin, or admin>editor
  if (articleData.author_id !== auth.user.id && auth.role !== 'super_admin') {
    if (auth.role === 'admin') {
      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', articleData.author_id)
        .single()
      if ((authorProfile as { role: string } | null)?.role !== 'editor') {
        return { error: 'ليس لديك صلاحية لتعديل هذا المقال' }
      }
    } else {
      return { error: 'ليس لديك صلاحية لتعديل هذا المقال' }
    }
  }

  // Calculate new sort_position
  let sortPosition: number
  if (effectivePriority === 1) {
    const { data } = await supabase
      .from('articles')
      .select('sort_position')
      .eq('priority', 1)
      .eq('status', 'published')
      .order('sort_position', { ascending: true })
      .limit(1)
    const minPosition = (data?.[0] as { sort_position: number } | undefined)?.sort_position
    sortPosition = minPosition != null ? minPosition - 1 : 0
  } else {
    sortPosition = articleData.published_at
      ? new Date(articleData.published_at).getTime() / 1000
      : Date.now() / 1000
  }

  const { error: updateError } = await supabase
    .from('articles')
    .update({ priority: effectivePriority, sort_position: sortPosition })
    .eq('id', articleId)

  if (updateError) {
    console.error('Update priority error:', updateError)
    return { error: 'حدث خطأ أثناء تحديث الأولوية' }
  }

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/priority')

  return { success: true }
}

export async function reorderArticles(
  orderedIds: string[],
  priority: number
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const auth = await getAuthenticatedUser(supabase)

  if (!auth) {
    return { error: 'يجب تسجيل الدخول' }
  }

  if (auth.role === 'editor') {
    return { error: 'ليس لديك صلاحية لهذا الإجراء' }
  }

  // Validate priority access
  const minAllowed = auth.role === 'super_admin' ? 1 : 2
  if (priority < minAllowed || priority > 5) {
    return { error: 'ليس لديك صلاحية لإعادة ترتيب هذه الأولوية' }
  }

  const clientId = await getClientIdentifier()
  const rateLimit = checkRateLimit(clientId, 'admin')
  if (!rateLimit.allowed) {
    return { error: 'تم تجاوز حد الطلبات' }
  }

  // Validate all IDs
  for (const id of orderedIds) {
    if (!UUIDSchema.safeParse(id).success) {
      return { error: 'معرف مقال غير صالح' }
    }
  }

  // Update sort_positions: first item gets highest position (shown first)
  const updates = orderedIds.map((id, index) => ({
    id,
    sort_position: orderedIds.length - index,
  }))

  for (const update of updates) {
    const { error } = await supabase
      .from('articles')
      .update({ sort_position: update.sort_position })
      .eq('id', update.id)
      .eq('priority', priority)

    if (error) {
      console.error('Reorder error:', error)
      await logSecurityEvent('invalid_input', {
        action: 'reorderArticles',
        userId: auth.user.id,
        error: error.message,
      })
    }
  }

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/priority')

  return { success: true }
}
