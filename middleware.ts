import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// In-memory store for rate limiting
const rateLimit = new Map<string, { count: number; timestamp: number }>()

// Rate limit configuration
const RATE_LIMIT = 50 // requests
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getSession()

  // Only apply rate limiting to API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return response
  }

  const ip = request.ip ?? 'anonymous'
  const now = Date.now()
  const rateLimitInfo = rateLimit.get(ip)

  // Clean up old entries
  if (rateLimitInfo && now - rateLimitInfo.timestamp > RATE_LIMIT_WINDOW) {
    rateLimit.delete(ip)
  }

  // Check rate limit
  if (rateLimitInfo) {
    if (rateLimitInfo.count >= RATE_LIMIT) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    rateLimitInfo.count++
  } else {
    rateLimit.set(ip, { count: 1, timestamp: now })
  }

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT.toString())
  response.headers.set(
    'X-RateLimit-Remaining',
    (RATE_LIMIT - (rateLimitInfo?.count ?? 1)).toString()
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 