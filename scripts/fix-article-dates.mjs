// Script to fix article dates
// Run with: node scripts/fix-article-dates.mjs

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wtidfjfakbdmusuraswx.supabase.co'
const supabaseServiceKey = 'sb_secret_r_8VhTGLOWWZ1jtHNugk0g_C4OkfT2t'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixArticleDates() {
  console.log('🔧 Fixing article dates...\n')

  // First, let's see what we're dealing with
  const { data: articlesWithIssues, error: checkError } = await supabase
    .from('articles')
    .select('id, title_ar, status, published_at')
    .eq('status', 'published')

  if (checkError) {
    console.error('❌ Error checking articles:', checkError.message)
    return
  }

  const now = new Date()
  const futureArticles = articlesWithIssues.filter(a => {
    if (!a.published_at) return true // NULL dates
    return new Date(a.published_at) > now
  })

  const nullDateArticles = articlesWithIssues.filter(a => !a.published_at)

  console.log(`📊 Total published articles: ${articlesWithIssues.length}`)
  console.log(`⚠️  Articles with NULL published_at: ${nullDateArticles.length}`)
  console.log(`⚠️  Articles with future published_at: ${futureArticles.length - nullDateArticles.length}`)
  console.log('')

  if (futureArticles.length === 0) {
    console.log('✅ No articles need fixing!')
    return
  }

  console.log('Articles to fix:')
  futureArticles.forEach(a => {
    console.log(`  - [${a.id.slice(0, 8)}...] ${a.title_ar?.slice(0, 50)}... | published_at: ${a.published_at || 'NULL'}`)
  })
  console.log('')

  // Fix articles with NULL published_at
  if (nullDateArticles.length > 0) {
    console.log('🔄 Fixing articles with NULL published_at...')
    const { error: nullError } = await supabase
      .from('articles')
      .update({ published_at: new Date().toISOString() })
      .eq('status', 'published')
      .is('published_at', null)

    if (nullError) {
      console.error('❌ Error fixing NULL dates:', nullError.message)
    } else {
      console.log(`✅ Fixed ${nullDateArticles.length} articles with NULL dates`)
    }
  }

  // Fix articles with future dates
  const futureDateArticles = futureArticles.filter(a => a.published_at)
  if (futureDateArticles.length > 0) {
    console.log('🔄 Fixing articles with future published_at...')
    const { error: futureError } = await supabase
      .from('articles')
      .update({ published_at: new Date().toISOString() })
      .eq('status', 'published')
      .gt('published_at', new Date().toISOString())

    if (futureError) {
      console.error('❌ Error fixing future dates:', futureError.message)
    } else {
      console.log(`✅ Fixed ${futureDateArticles.length} articles with future dates`)
    }
  }

  console.log('\n🎉 Done!')
}

fixArticleDates().catch(console.error)
