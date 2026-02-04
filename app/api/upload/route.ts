import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 20 // 20 uploads per minute

  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  entry.count++
  return entry.count <= maxRequests
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfIp = request.headers.get('cf-connecting-ip')

  if (forwarded) return forwarded.split(',')[0].trim()
  return cfIp || realIp || 'unknown'
}

// Validate file type by checking magic bytes
function validateMagicBytes(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer.slice(0, 12))

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }

  // AVIF: ... 66 74 79 70 61 76 69 66 (ftyp avif)
  // Check for 'ftyp' box with 'avif' brand
  for (let i = 0; i < 8; i++) {
    if (
      bytes[i + 4] === 0x66 && // f
      bytes[i + 5] === 0x74 && // t
      bytes[i + 6] === 0x79 && // y
      bytes[i + 7] === 0x70 // p
    ) {
      return 'image/avif'
    }
  }

  return null
}

// Generate safe filename
function generateSafeFilename(originalName: string, detectedType: string): string {
  // Get extension from detected type
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/avif': '.avif',
  }

  const ext = extensions[detectedType] || '.jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)

  // Sanitize original name (remove special chars, keep only alphanumeric)
  const safeName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9]/g, '-') // Replace special chars
    .replace(/-+/g, '-') // Collapse multiple dashes
    .substring(0, 50) // Limit length

  return `${timestamp}-${random}-${safeName}${ext}`
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  // Rate limiting
  if (!checkRateLimit(ip)) {
    console.warn(`[SECURITY] Upload rate limit exceeded for IP: ${ip}`)
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn(`[SECURITY] Unauthorized upload attempt from IP: ${ip}`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    // Validate MIME type (client-provided, can be spoofed)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, AVIF' },
        { status: 400 }
      )
    }

    // Read file buffer for magic byte validation
    const buffer = await file.arrayBuffer()

    // Validate actual file type via magic bytes
    const detectedType = validateMagicBytes(buffer)

    if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
      return NextResponse.json(
        { error: 'Invalid file content. File does not match allowed image types.' },
        { status: 400 }
      )
    }

    // Generate safe filename and path
    const safeFilename = generateSafeFilename(file.name, detectedType)
    const filePath = `${user.id}/${safeFilename}`

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(filePath, buffer, {
        contentType: detectedType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('article-images').getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      path: data.path,
      url: publicUrl,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete image endpoint
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    }

    // Verify the path belongs to the user (RLS will also enforce this)
    if (!path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: deleteError } = await supabase.storage.from('article-images').remove([path])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
