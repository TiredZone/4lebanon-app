import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.+)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSearch() {
  console.log('🔍 Testing search functionality...\n')

  // Test 1: Get all published articles
  console.log('Test 1: Fetching all published articles')
  const { data: allArticles, count: totalCount, error: allError } = await supabase
    .from('articles')
    .select('id, title_ar, status', { count: 'exact' })
    .eq('status', 'published')
    .limit(5)

  if (allError) {
    console.error('❌ Error:', allError.message)
  } else {
    console.log(`✅ Found ${totalCount} published articles`)
    if (allArticles && allArticles.length > 0) {
      console.log('First 5 articles:')
      allArticles.forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.title_ar}`)
      })
    }
  }

  console.log('\n---\n')

  // Test 2: Full text search
  console.log('Test 2: Testing full-text search')
  const searchTerm = 'لبنان'
  const { data: searchResults, count: searchCount, error: searchError } = await supabase
    .from('articles')
    .select('id, title_ar, excerpt_ar', { count: 'exact' })
    .eq('status', 'published')
    .textSearch('search_vector', searchTerm, { config: 'simple' })
    .limit(5)

  if (searchError) {
    console.error('❌ Search error:', searchError.message)
  } else {
    console.log(`✅ Search for "${searchTerm}" found ${searchCount} results`)
    if (searchResults && searchResults.length > 0) {
      console.log('Top 5 results:')
      searchResults.forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.title_ar}`)
        if (a.excerpt_ar) {
          console.log(`     ${a.excerpt_ar.substring(0, 60)}...`)
        }
      })
    }
  }

  console.log('\n---\n')

  // Test 3: Get sections
  console.log('Test 3: Fetching sections')
  const { data: sections, error: sectionsError } = await supabase
    .from('sections')
    .select('id, slug, name_ar')
    .order('sort_order')

  if (sectionsError) {
    console.error('❌ Error:', sectionsError.message)
  } else {
    console.log(`✅ Found ${sections?.length || 0} sections:`)
    sections?.forEach((s) => {
      console.log(`  - ${s.name_ar} (${s.slug})`)
    })
  }

  console.log('\n---\n')

  // Test 4: Filter by section
  if (sections && sections.length > 0) {
    const testSection = sections[0]
    console.log(`Test 4: Filtering by section "${testSection.name_ar}"`)
    const { data: sectionArticles, count: sectionCount, error: sectionError } = await supabase
      .from('articles')
      .select(
        `
        id, title_ar,
        section:sections!articles_section_id_fkey(name_ar)
      `,
        { count: 'exact' }
      )
      .eq('status', 'published')
      .eq('section_id', testSection.id)
      .limit(5)

    if (sectionError) {
      console.error('❌ Error:', sectionError.message)
    } else {
      console.log(`✅ Found ${sectionCount} articles in "${testSection.name_ar}"`)
      if (sectionArticles && sectionArticles.length > 0) {
        console.log('First 5:')
        sectionArticles.forEach((a, i) => {
          console.log(`  ${i + 1}. ${a.title_ar}`)
        })
      }
    }
  }

  console.log('\n---\n')

  // Test 5: Get regions
  console.log('Test 5: Fetching regions and countries')
  const { data: regions, error: regionsError } = await supabase
    .from('regions')
    .select('id, slug, name_ar')
    .order('sort_order')

  if (regionsError) {
    console.error('❌ Error:', regionsError.message)
  } else {
    console.log(`✅ Found ${regions?.length || 0} regions:`)
    regions?.forEach((r) => {
      console.log(`  - ${r.name_ar} (${r.slug})`)
    })
  }

  const { data: countries, error: countriesError } = await supabase
    .from('countries')
    .select('id, slug, name_ar, region_id')
    .order('sort_order')
    .limit(10)

  if (countriesError) {
    console.error('❌ Error:', countriesError.message)
  } else {
    console.log(`✅ Found ${countries?.length || 0}+ countries (showing first 10):`)
    countries?.forEach((c) => {
      console.log(`  - ${c.name_ar} (${c.slug})`)
    })
  }

  console.log('\n✅ Search functionality test complete!\n')
}

testSearch().catch(console.error)
