import { createHmac } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { verifyAdminSession, ADMIN_ACCESS_COOKIE_NAME } from '@/lib/admin-access-cookie'

const authCookieNames = {
  accessToken: 'rs_access_token',
  idToken: 'rs_id_token',
  refreshToken: 'rs_refresh_token',
  email: 'rs_auth_email',
  username: 'rs_auth_username',
  role: 'rs_auth_role',
} as const

type JwtClaims = {
  exp?: number
  email?: string
  sub?: string
  'cognito:username'?: string
  'custom:role'?: string
  'cognito:groups'?: string[]
}

type CognitoRefreshResponse = {
  AuthenticationResult?: {
    AccessToken?: string
    IdToken?: string
    RefreshToken?: string
    ExpiresIn?: number
  }
}

const refreshTokenMaxAge = 60 * 60 * 24 * 30
const refreshSkewMs = 60_000

function getAuthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is not configured`)
  }

  return value
}

function decodeJwtPayload<TClaims>(token?: string): TClaims | null {
  try {
    const payload = token?.split('.')[1]

    if (!payload) return null

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    )

    return JSON.parse(atob(paddedPayload)) as TClaims
  } catch {
    return null
  }
}

function isTokenExpired(token?: string) {
  const exp = decodeJwtPayload<JwtClaims>(token)?.exp

  if (!exp) return true

  return Date.now() >= exp * 1000 - refreshSkewMs
}

function getRoleFromIdToken(idToken: string) {
  const claims = decodeJwtPayload<JwtClaims>(idToken)

  if (
    claims?.['custom:role'] === 'admin' ||
    claims?.['cognito:groups']?.includes('admin')
  ) {
    return 'admin'
  }

  return 'user'
}

function generateSecretHash(username: string) {
  const clientId = getRequiredEnv('COGNITO_CLIENT_ID')
  const clientSecret = getRequiredEnv('COGNITO_CLIENT_SECRET')

  return createHmac('sha256', clientSecret)
    .update(`${username}${clientId}`)
    .digest('base64')
}

async function refreshCognitoSession({
  username,
  refreshToken,
}: {
  username: string
  refreshToken: string
}) {
  const region = getRequiredEnv('AWS_REGION')
  const clientId = getRequiredEnv('COGNITO_CLIENT_ID')

  const response = await fetch(
    `https://cognito-idp.${region}.amazonaws.com/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      },
      body: JSON.stringify({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: clientId,
        AuthParameters: {
          USERNAME: username,
          REFRESH_TOKEN: refreshToken,
          SECRET_HASH: generateSecretHash(username),
        },
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to refresh Cognito session (${response.status})`)
  }

  const data = (await response.json()) as CognitoRefreshResponse
  const tokens = data.AuthenticationResult

  if (!tokens?.AccessToken || !tokens.IdToken) {
    throw new Error('Cognito did not return refreshed tokens')
  }

  return {
    accessToken: tokens.AccessToken,
    idToken: tokens.IdToken,
    refreshToken: tokens.RefreshToken ?? refreshToken,
    expiresIn: tokens.ExpiresIn ?? 3600,
  }
}

function getAuthCookiePayload({
  email,
  username,
  accessToken,
  idToken,
  refreshToken,
  expiresIn,
}: {
  email: string
  username?: string
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
}) {
  const refreshUsername =
    username ??
    decodeJwtPayload<JwtClaims>(idToken)?.['cognito:username'] ??
    decodeJwtPayload<JwtClaims>(idToken)?.sub ??
    email

  return [
    {
      name: authCookieNames.accessToken,
      value: accessToken,
      maxAge: expiresIn,
    },
    {
      name: authCookieNames.idToken,
      value: idToken,
      maxAge: expiresIn,
    },
    {
      name: authCookieNames.refreshToken,
      value: refreshToken,
      maxAge: refreshTokenMaxAge,
    },
    {
      name: authCookieNames.email,
      value: email,
      maxAge: refreshTokenMaxAge,
    },
    {
      name: authCookieNames.username,
      value: refreshUsername,
      maxAge: refreshTokenMaxAge,
    },
    {
      name: authCookieNames.role,
      value: getRoleFromIdToken(idToken),
      maxAge: refreshTokenMaxAge,
    },
  ]
}

function applyAuthCookiesToRequest(
  request: NextRequest,
  cookies: ReturnType<typeof getAuthCookiePayload>,
) {
  for (const cookie of cookies) {
    request.cookies.set(cookie.name, cookie.value)
  }
}

function applyAuthCookiesToResponse(
  response: NextResponse,
  cookies: ReturnType<typeof getAuthCookiePayload>,
) {
  for (const cookie of cookies) {
    response.cookies.set(
      cookie.name,
      cookie.value,
      getAuthCookieOptions(cookie.maxAge),
    )
  }
}

function clearAuthCookiesFromRequest(request: NextRequest) {
  Object.values(authCookieNames).forEach((name) => {
    request.cookies.delete(name)
  })
}

function clearAuthCookiesFromResponse(response: NextResponse) {
  Object.values(authCookieNames).forEach((name) => {
    response.cookies.set(name, '', getAuthCookieOptions(0))
  })
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Admin API Route Protection
  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin/access') {
      return NextResponse.next()
    }

    const adminCookie = request.cookies.get(ADMIN_ACCESS_COOKIE_NAME)?.value
    if (!verifyAdminSession(adminCookie)) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // 2. Admin UI Route Protection
  if (pathname.startsWith('/admin')) {
    const adminCookie = request.cookies.get(ADMIN_ACCESS_COOKIE_NAME)?.value
    const hasValidSession = verifyAdminSession(adminCookie)

    if (pathname === '/admin/gate') {
      if (hasValidSession) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return NextResponse.next()
    } else {
      if (!hasValidSession) {
        return NextResponse.redirect(new URL('/admin/gate', request.url))
      }
      return NextResponse.next()
    }
  }

  // 3. User Session Refresh & Route Protection
  const isProtectedRoute = pathname.startsWith('/dashboard')
  const refreshToken = request.cookies.get(authCookieNames.refreshToken)?.value

  // If on a protected route but no refresh token is present, redirect to /auth
  if (isProtectedRoute && !refreshToken) {
    return NextResponse.redirect(
      new URL(`/auth?callbackUrl=${encodeURIComponent(pathname)}`, request.url)
    )
  }

  // If we have a refresh token, check/refresh if expired
  if (refreshToken) {
    const accessToken = request.cookies.get(authCookieNames.accessToken)?.value
    const idToken = request.cookies.get(authCookieNames.idToken)?.value

    const accessTokenExpired = isTokenExpired(accessToken)
    const idTokenExpired = isTokenExpired(idToken)

    if (accessTokenExpired || idTokenExpired) {
      const email = request.cookies.get(authCookieNames.email)?.value
      const username =
        request.cookies.get(authCookieNames.username)?.value ??
        decodeJwtPayload<JwtClaims>(idToken)?.['cognito:username'] ??
        decodeJwtPayload<JwtClaims>(idToken)?.sub ??
        email

      if (!email || !username) {
        if (isProtectedRoute) {
          const response = NextResponse.redirect(
            new URL(`/auth?callbackUrl=${encodeURIComponent(pathname)}`, request.url)
          )
          clearAuthCookiesFromResponse(response)
          return response
        } else {
          const response = NextResponse.next()
          clearAuthCookiesFromResponse(response)
          return response
        }
      }

      try {
        const tokens = await refreshCognitoSession({ username, refreshToken })
        const cookiesPayload = getAuthCookiePayload({
          email,
          username,
          accessToken: tokens.accessToken,
          idToken: tokens.idToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        })

        applyAuthCookiesToRequest(request, cookiesPayload)

        const response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })

        applyAuthCookiesToResponse(response, cookiesPayload)
        return response
      } catch {
        if (isProtectedRoute) {
          const response = NextResponse.redirect(
            new URL(`/auth?callbackUrl=${encodeURIComponent(pathname)}`, request.url)
          )
          clearAuthCookiesFromResponse(response)
          return response
        } else {
          const response = NextResponse.next()
          clearAuthCookiesFromResponse(response)
          return response
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
