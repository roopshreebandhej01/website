'use server'

import { cookies } from 'next/headers'
import {
  authSignIn,
  cognitoAdminCreateUser,
  cognitoAdminGetUser,
  cognitoAdminSetUserPassword,
  cognitoChangePassword,
  cognitoConfirmForgotPassword,
  cognitoConfirmSignUp,
  cognitoForgotPassword,
  cognitoResendConfirmationCode,
  cognitoSignUp,
  cognitoUpdateUserAttribute,
} from '@/helper/cognito'
import { findUserByEmail } from '@/repositories/user.repository'
import { db } from '@/lib/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import {
  assertCompleteTokenSet,
  getAuthCookiePayload,
  getClearAuthCookiePayload,
} from '@/lib/auth-cookies'
import { getUserClaimsFromIdToken } from '@/lib/auth-token'
import { getCurrentSession, requireUser, ADMIN_EMAILS } from '@/lib/auth'
import { notifyWelcomeEmail } from '@/lib/email-notifications'
import { syncProfileFromAuthClaimsService } from '@/services/user.service'

type AuthActionResult = {
  ok: boolean
  error?: string
  message?: string
  isAdmin?: boolean
}

function getNormalizedEmail(email: string) {
  return email.trim().toLowerCase()
}

function getSignupPhoneNumber(phone: string) {
  let digits = phone.replace(/[^\d]/g, '')

  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  const withoutCountryCode =
    digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits

  if (withoutCountryCode.length !== 10) {
    throw new Error('Mobile number must be exactly 10 digits')
  }

  return `+91${withoutCountryCode}`
}

function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function hasAuthErrorName(error: unknown, name: string) {
  return error instanceof Error && error.name === name
}

function getDeliveryMessage(
  details?: {
    DeliveryMedium?: string
    Destination?: string
  },
  fallback = 'OTP sent. Please check your inbox.',
) {
  if (!details?.Destination) return fallback

  const medium = details.DeliveryMedium?.toLowerCase()
  const destination = details.Destination

  if (medium === 'email') {
    return `OTP sent to ${destination}`
  }

  if (medium === 'sms') {
    return `OTP sent on ${destination}`
  }

  return `OTP sent to ${destination}`
}

async function ensureCognitoEmailVerifiedForRecovery(email: string) {
  const response = await cognitoAdminGetUser({ email })
  const attributes = response.UserAttributes ?? []
  const accountEmail = attributes.find((attribute) => attribute.Name === 'email')?.Value
  const emailVerified = attributes.find((attribute) => attribute.Name === 'email_verified')?.Value

  if (accountEmail?.trim().toLowerCase() !== email || emailVerified === 'true') {
    return
  }

  const updateRes = await cognitoUpdateUserAttribute({
    email,
    userAttribute: [{ Name: 'email_verified', Value: 'true' }],
  })
}

async function setAuthCookies(email: string, password: string) {
  const cookieStore = await cookies()
  const tokens = assertCompleteTokenSet(await authSignIn({ email, password }))

  getAuthCookiePayload({ email, tokens }).forEach((cookie) => {
    cookieStore.set(cookie.name, cookie.value, cookie.options)
  })

  try {
    await syncProfileFromAuthClaimsService(getUserClaimsFromIdToken(tokens.idToken))
  } catch (error) {
    console.error('Unable to sync signed-in user profile:', error)
  }
}

export async function signInAction({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<AuthActionResult> {
  const normalizedEmail = getNormalizedEmail(email)

  if (!normalizedEmail || !password) {
    return { ok: false, error: 'Email and password are required' }
  }

  try {
    await setAuthCookies(normalizedEmail, password)

    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail)

    return { ok: true, isAdmin }
  } catch (error) {
    if (hasAuthErrorName(error, 'UserNotConfirmedException')) {
      return { ok: false, error: 'Please verify your account OTP before login' }
    }

    return { ok: false, error: 'Invalid email or password' }
  }
}

export async function getAuthStatusAction() {
  const session = await getCurrentSession()

  return { isAuthenticated: Boolean(session) }
}

export async function signUpAction({
  name,
  email,
  phone,
  password,
}: {
  name: string
  email: string
  phone: string
  password: string
}): Promise<AuthActionResult> {
  const fullName = name.trim()
  const normalizedEmail = getNormalizedEmail(email)

  if (!fullName || !normalizedEmail || !phone || !password) {
    return { ok: false, error: 'Name, email, phone and password are required' }
  }

  let cognitoPhoneNumber: string

  try {
    cognitoPhoneNumber = getSignupPhoneNumber(phone)
  } catch (error) {
    return {
      ok: false,
      error: getAuthErrorMessage(error, 'Invalid mobile number'),
    }
  }

  try {
    const response = await cognitoSignUp({
      email: normalizedEmail,
      password,
      userAttribute: [
        { Name: 'name', Value: fullName },
        { Name: 'email', Value: normalizedEmail },
        { Name: 'phone_number', Value: cognitoPhoneNumber },
      ],
    })

    return {
      ok: true,
      message: getDeliveryMessage(response.CodeDeliveryDetails),
    }
  } catch (error) {
    console.error('Unable to create account:', error)

    return {
      ok: false,
      error: getAuthErrorMessage(error, 'Unable to create account'),
    }
  }
}

export async function resendSignUpOtpAction({
  email,
}: {
  email: string
}): Promise<AuthActionResult> {
  const normalizedEmail = getNormalizedEmail(email)

  if (!normalizedEmail) {
    return { ok: false, error: 'Email is required' }
  }

  try {
    const response = await cognitoResendConfirmationCode({
      email: normalizedEmail,
    })

    return {
      ok: true,
      message: getDeliveryMessage(response.CodeDeliveryDetails, 'OTP resent. Please check your inbox.'),
    }
  } catch (error) {
    console.error('Unable to resend signup OTP:', error)

    return {
      ok: false,
      error: getAuthErrorMessage(error, 'Unable to resend OTP'),
    }
  }
}

export async function confirmSignUpAction({
  email,
  code,
  password,
}: {
  email: string
  code: string
  password: string
}): Promise<AuthActionResult> {
  const normalizedEmail = getNormalizedEmail(email)

  if (!normalizedEmail || !code || !password) {
    return { ok: false, error: 'Email, OTP and password are required' }
  }

  try {
    await cognitoConfirmSignUp({ email: normalizedEmail, code })
    await setAuthCookies(normalizedEmail, password)
    try {
      await notifyWelcomeEmail({
        email: normalizedEmail,
        customerName: normalizedEmail.split('@')[0],
      })
    } catch (emailError) {
      console.error('Unable to send welcome email:', emailError)
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: getAuthErrorMessage(error, 'Unable to verify account'),
    }
  }
}

export async function forgotPasswordAction({
  email,
}: {
  email: string
}): Promise<AuthActionResult> {
  const normalizedEmail = getNormalizedEmail(email)
  if (!normalizedEmail) {
    return { ok: false, error: 'Email is required' }
  }

  try {
    const existing = await findUserByEmail(normalizedEmail)
    if (existing && !existing.cognitoSub) {
      let cognitoPhone: string | undefined = undefined
      if (existing.phone) {
        try {
          cognitoPhone = getSignupPhoneNumber(existing.phone)
        } catch (e) {
          const clean = existing.phone.replace(/[^\d]/g, '')
          if (clean.length === 10) {
            cognitoPhone = `+91${clean}`
          } 
        }
      } 
      try {
        const createRes = await cognitoAdminCreateUser({
          email: normalizedEmail,
          name: existing.name,
          phone: cognitoPhone,
        })
        const attributes = createRes.User?.Attributes ?? []
        //const createdSub = attributes.find((attr) => attr.Name === 'sub')?.Value || createRes.User?.Username
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'
         await cognitoAdminSetUserPassword({
          email: normalizedEmail,
          password: tempPassword,
        })
      } catch (err) {
        console.error('[forgotPasswordAction] ERROR in Step 3 (guest creation in Cognito):', err)
      }
    }

    await ensureCognitoEmailVerifiedForRecovery(normalizedEmail)
    const response = await cognitoForgotPassword({ email: normalizedEmail })
    return {
      ok: true,
      message: getDeliveryMessage(response.CodeDeliveryDetails, 'Password reset OTP sent. Please check your inbox.'),
    }
  } catch (error) {
    console.error('[forgotPasswordAction] ERROR in forgotPasswordAction:', error)

    return {
      ok: false,
      error: getAuthErrorMessage(error, 'Unable to send OTP'),
    }
  }
}

export async function confirmForgotPasswordAction({
  email,
  code,
  newPassword,
}: {
  email: string
  code: string
  newPassword: string
}): Promise<AuthActionResult> {
  const normalizedEmail = getNormalizedEmail(email)
  if (!normalizedEmail || !code || !newPassword) {
    return { ok: false, error: 'Email, OTP and new password are required' }
  }

  try {
    const confirmRes = await cognitoConfirmForgotPassword({
      email: normalizedEmail,
      code,
      newPassword,
    })
    try {
      const userRes = await cognitoAdminGetUser({ email: normalizedEmail })
      const attributes = userRes.UserAttributes ?? []
      const userSub = attributes.find((attr) => attr.Name === 'sub')?.Value || userRes.Username
      if (userSub) {
        const dbUpdate = await db
          .update(users)
          .set({ cognitoSub: userSub, emailVerified: true, updatedAt: new Date() })
          .where(eq(users.email, normalizedEmail))
          .returning()
      }
    } catch (dbErr) {
      console.error('[confirmForgotPasswordAction] Step 4 ERROR updating local DB after recovery:', dbErr)
    }

    return { ok: true }
  } catch (error) {
    console.error('[confirmForgotPasswordAction] ERROR in confirmForgotPasswordAction:', error)

    return {
      ok: false,
      error: getAuthErrorMessage(error, 'Unable to update password'),
    }
  }
}

export async function changePasswordAction({
  currentPassword,
  newPassword,
  confirmPassword,
}: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<AuthActionResult> {
  let normalizedEmail = ''

  try {
    const user = await requireUser()
    normalizedEmail = getNormalizedEmail(user.email ?? '')
  } catch {
    return { ok: false, error: 'Please sign in again to update your password' }
  }

  if (!normalizedEmail) {
    return { ok: false, error: 'Please sign in again to update your password' }
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { ok: false, error: 'Current password, new password and confirmation are required' }
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, error: 'New password and confirmation do not match' }
  }

  if (currentPassword === newPassword) {
    return { ok: false, error: 'New password must be different from current password' }
  }

  try {
    const tokens = assertCompleteTokenSet(
      await authSignIn({ email: normalizedEmail, password: currentPassword }),
    )

    await cognitoChangePassword({
      accessToken: tokens.accessToken,
      currentPassword,
      newPassword,
    })

    await setAuthCookies(normalizedEmail, newPassword)

    return { ok: true, message: 'Password updated successfully' }
  } catch (error) {
    if (hasAuthErrorName(error, 'NotAuthorizedException')) {
      return { ok: false, error: 'Current password is incorrect' }
    }

    return {
      ok: false,
      error: getAuthErrorMessage(error, 'Unable to update password'),
    }
  }
}

export async function signOutAction(): Promise<AuthActionResult> {
  const cookieStore = await cookies()

  getClearAuthCookiePayload().forEach((cookie) => {
    cookieStore.set(cookie.name, cookie.value, cookie.options)
  })

  return { ok: true }
}
