'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSection(formData: {
  name_ar: string
  slug: string
  description_ar: string | null
  sort_order: number
}) {
  try {
    const supabase = await createServiceClient()

    // Get sections that need to shift (those with sort_order >= new sort_order)
    const { data: sectionsToShift } = await supabase
      .from('sections')
      .select('id, sort_order')
      .gte('sort_order', formData.sort_order)
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
        name_ar: formData.name_ar.trim(),
        slug: formData.slug.trim(),
        description_ar: formData.description_ar?.trim() || null,
        sort_order: formData.sort_order,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating section:', error)
      return { success: false, error: error.message }
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
  const supabase = await createServiceClient()

  const { error } = await supabase.from('sections').delete().eq('id', sectionId)

  if (error) {
    console.error('Error deleting section:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/sections/new')
  revalidatePath('/')
  return { success: true }
}

export async function getSections() {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching sections:', error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}
