export type ProfilePayload = {
  fullName: string
  phone: string
  secondPhone?: string
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeMobileNumber(value: string) {
  return value.replace(/[^\d]/g, '')
}

export function validateProfilePayload(payload: unknown): ProfilePayload {
  const data = payload as Partial<Record<keyof ProfilePayload, unknown>>
  const fullName = getString(data.fullName)
  const phone = normalizeMobileNumber(getString(data.phone))
  const secondPhone = normalizeMobileNumber(getString(data.secondPhone))

  if (!fullName) {
    throw new Error('Full name is required')
  }

  if (!phone) {
    throw new Error('Mobile number is required')
  }

  if (phone.length !== 10) {
    throw new Error('Mobile number must be exactly 10 digits')
  }

  if (secondPhone && secondPhone.length !== 10) {
    throw new Error('Alternate mobile number must be exactly 10 digits')
  }

  return {
    fullName,
    phone,
    secondPhone: secondPhone || undefined,
  }
}
