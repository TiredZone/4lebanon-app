'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Input validation schema for sections
const SectionSchema = z.object({
  name_ar: z
    .string()
    .min(1, 'اسم القسم مطلوب')
    .max(100, 'اسم القسم طويل جداً')
    .transform((val) => val.trim()),
  slug: z
    .string()
    .min(1, 'الرابط مطلوب')
    .max(100, 'الرابط طويل جداً')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'الرابط يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط'),
  description_ar: z
    .string()
    .max(500, 'الوصف طويل جداً')
    .nullable()
    .optional()
    .transform((val) => val?.trim() || null),
  sort_order: z.number().int().min(0).max(1000),
})

export async function createSection(formData: {
  name_ar: string
  slug: string
  description_ar: string | null
  sort_order: number
}) {
  try {
    // Authorization check - require authenticated user
    const authSupabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser()

    if (authError || !user) {
      console.warn('[SECURITY] Unauthorized section creation attempt')
      return { success: false, error: 'غير مصرح بهذا الإجراء' }
    }

    // Input validation
    const validationResult = SectionSchema.safeParse(formData)
    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((e: { message: string }) => e.message)
        .join(', ')
      return { success: false, error: errors }
    }

    const validatedData = validationResult.data
    const supabase = await createServiceClient()

    // Check if slug already exists
    const { data: existingSection } = await supabase
      .from('sections')
      .select('id')
      .eq('slug', validatedData.slug)
      .single()

    if (existingSection) {
      return { success: false, error: 'هذا الرابط مستخدم بالفعل' }
    }

    // Get sections that need to shift (those with sort_order >= new sort_order)
    const { data: sectionsToShift } = await supabase
      .from('sections')
      .select('id, sort_order')
      .gte('sort_order', validatedData.sort_order)
      .order('sort_order', { ascending: false }) // Start from highest to avoid conflicts

    // Shift each section's sort_order by 1 to make room
    if (sectionsToShift && sectionsToShift.length > 0) {
      for (const section of sectionsToShift) {
        await supabase
          .from('sections')
          .update({ sort_order: section.sort_order + 1 })
          .eq('id', section.id)
      }
    }

    // Now insert the new section at the desired position
    const { data, error } = await supabase
      .from('sections')
      .insert({
        name_ar: validatedData.name_ar,
        slug: validatedData.slug,
        description_ar: validatedData.description_ar,
        sort_order: validatedData.sort_order,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating section:', error)
      return { success: false, error: 'حدث خطأ أثناء إنشاء القسم' }
    }

    revalidatePath('/admin/sections/new')
    revalidatePath('/')
    return { success: true, data }
  } catch (err) {
    console.error('Unexpected error creating section:', err)
    return { success: false, error: 'حدث خطأ غير متوقع' }
  }
}

export async function deleteSection(sectionId: number) {
  try {
    // Authorization check - require authenticated user
    const authSupabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser()

    if (authError || !user) {
      console.warn('[SECURITY] Unauthorized section deletion attempt')
      return { success: false, error: 'غير مصرح بهذا الإجراء' }
    }

    // Validate section ID
    if (!Number.isInteger(sectionId) || sectionId <= 0) {
      return { success: false, error: 'معرف القسم غير صالح' }
    }

    const supabase = await createServiceClient()

    // Check if section has articles
    const { data: articlesInSection } = await supabase
      .from('articles')
      .select('id')
      .eq('section_id', sectionId)
      .limit(1)

    if (articlesInSection && articlesInSection.length > 0) {
      return { success: false, error: 'لا يمكن حذف القسم - يوجد مقالات مرتبطة به' }
    }

    const { error } = await supabase.from('sections').delete().eq('id', sectionId)

    if (error) {
      console.error('Error deleting section:', error)
      return { success: false, error: 'حدث خطأ أثناء حذف القسم' }
    }

    revalidatePath('/admin/sections/new')
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('Unexpected error deleting section:', err)
    return { success: false, error: 'حدث خطأ غير متوقع' }
  }
}

export async function getSections() {
  // Authorization check - require authenticated user
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'غير مصرح بهذا الإجراء', data: [] }
  }

  // Sections are publicly readable via RLS, no need for service client
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching sections:', error)
    return { success: false, error: 'حدث خطأ أثناء تحميل الأقسام', data: [] }
  }

  return { success: true, data: data || [] }
}
