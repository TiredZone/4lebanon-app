import { NextResponse } from 'next/server'

/**
 * Security.txt - Standard for security vulnerability disclosure
 * See: https://securitytxt.org/
 */
export async function GET() {
  const securityTxt = `# Security Policy for 4Lebanon News
# This file provides security researchers with information about how to report vulnerabilities

# Contact for security issues
Contact: mailto:security@4lebanon.com

# Preferred languages
Preferred-Languages: ar, en

# Security policy
Policy: https://4lebanon.com/security-policy

# Acknowledgments page (optional - add when you have one)
# Acknowledgments: https://4lebanon.com/security-acknowledgments

# Expiry date (update annually)
Expires: 2027-01-22T00:00:00.000Z

# Encryption key (optional - add PGP key if available)
# Encryption: https://4lebanon.com/.well-known/pgp-key.txt

# Canonical URL
Canonical: https://4lebanon.com/.well-known/security.txt
`

  return new NextResponse(securityTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
    },
  })
}
