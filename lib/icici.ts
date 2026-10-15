import crypto from "node:crypto"

export type IciciSaleRequest = {
  amountInPaise: number
  merchantTxnNo: string
  customerName: string
  customerEmail: string
  customerPhone: string
  returnUrl?: string
}

export type IciciSaleResponse = {
  success: boolean
  redirectUrl?: string
  redirectURI?: string
  tranCtx?: string
  merchantTxnNo?: string
  message?: string
  rawResponse?: Record<string, unknown>
}

export type IciciStatusResponse = {
  success: boolean
  status?: string
  responseCode?: string
  bankRefNo?: string
  message?: string
  rawResponse?: Record<string, unknown>
}

export function getIciciConfig() {
  const isLive =
    process.env.ICICI_ENV === "LIVE" ||
    (process.env.NODE_ENV === "production" &&
      Boolean(process.env.LIVE_MERCHANT_ID) &&
      process.env.LIVE_MERCHANT_ID !== "YourMerchantId")

  if (isLive) {
    return {
      environment: "LIVE" as const,
      merchantId: process.env.LIVE_MERCHANT_ID?.trim() || "",
      aggregatorId: process.env.LIVE_AGGREGATOR_ID?.trim() || "",
      secretKey: process.env.LIVE_SECRET_KEY?.trim() || "",
      initiateSaleUrl:
        process.env.LIVE_API_INITIATE_SALE?.trim() ||
        "https://pgpay.icicibank.com/pg/api/v2/initiateSale",
      statusUrl:
        process.env.LIVE_API_STATUS?.trim() ||
        "https://pgpay.icicibank.com/pg/api/command",
      refundUrl:
        process.env.LIVE_API_REFUND?.trim() ||
        "https://pgpay.icicibank.com/pg/api/command",
      returnUrl:
        process.env.LIVE_RETURN_URL?.trim() ||
        process.env.UAT_RETURN_URL?.trim() ||
        "http://localhost:3000/api/payment/icici/callback",
    }
  }

  return {
    environment: "UAT" as const,
    merchantId: process.env.UAT_MERCHANT_ID?.trim() || "100000000007164",
    aggregatorId: process.env.UAT_AGGREGATOR_ID?.trim() || "A100000000007164",
    secretKey:
      process.env.UAT_SECRET_KEY?.trim() ||
      "db06cca0-838b-4e01-8b20-6ac446ffb6bd",
    initiateSaleUrl:
      process.env.UAT_API_INITIATE_SALE?.trim() ||
      "https://pgpayuat.icicibank.com/tsp/pg/api/v2/initiateSale",
    statusUrl:
      process.env.UAT_API_STATUS?.trim() ||
      "https://pgpayuat.icicibank.com/tsp/pg/api/command",
    refundUrl:
      process.env.UAT_API_REFUND?.trim() ||
      "https://pgpayuat.icicibank.com/tsp/pg/api/command",
    returnUrl:
      process.env.UAT_RETURN_URL?.trim() ||
      "http://localhost:3000/api/payment/icici/callback",
  }
}

// Returns formatted timestamp in Asia/Kolkata timezone: YYYYMMDDHHmmss
export function getIstTimestamp(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return `${map.year}${map.month}${map.day}${map.hour}${map.minute}${map.second}`
}

export function hmacSha256(data: string, secretKey: string): string {
  return crypto.createHmac("sha256", secretKey).update(data).digest("hex")
}

export function buildSortedDataToHash(fields: Record<string, string>): string {
  const sortedKeys = Object.keys(fields).sort()
  let dataToHash = ""
  for (const key of sortedKeys) {
    dataToHash += fields[key] ?? ""
  }
  return dataToHash
}

export function verifyIciciCallbackHash(
  fields: Record<string, string>,
  receivedHash: string,
  secretKey: string,
): boolean {
  if (!receivedHash || !secretKey) return false
  const fieldsCopy = { ...fields }
  delete fieldsCopy.secureHash
  const dataToHash = buildSortedDataToHash(fieldsCopy)
  const computedHash = hmacSha256(dataToHash, secretKey)
  return computedHash.toLowerCase() === receivedHash.toLowerCase()
}

// Generates unique Merchant Transaction Number: ROOP<YYYYMMDDHHmmss><random>
export function generateMerchantTxnNo(): string {
  const ts = getIstTimestamp()
  const randomSuffix = Math.floor(100 + Math.random() * 900)
  return `ROOP${ts}${randomSuffix}`
}

// Initiates sale on ICICI Bank Hosted Payment Gateway
export async function initiateIciciSale(
  params: IciciSaleRequest,
): Promise<IciciSaleResponse> {
  const config = getIciciConfig()

  if (!config.merchantId || !config.aggregatorId || !config.secretKey) {
    return {
      success: false,
      message: "ICICI credentials are not configured",
    }
  }

  const txnDate = getIstTimestamp()
  const amountStr = (params.amountInPaise / 100).toFixed(2)
  const phoneClean = params.customerPhone.replace(/\D/g, "").slice(-10) || "9999999999"
  // ICICI requires alphanumeric and spaces only for customerName
  const nameClean =
    params.customerName.replace(/[^a-zA-Z0-9 ]/g, "").trim().slice(0, 50) ||
    "Valued Customer"
  const emailClean = params.customerEmail.trim() || "customer@roopshree.com"
  const returnUrl = params.returnUrl || config.returnUrl

  // Fields to hash which is sorted in alphabetial order
  const fieldsToHash: Record<string, string> = {
    addlParam1: "",
    addlParam2: "",
    aggregatorID: config.aggregatorId,
    amount: amountStr,
    currencyCode: "356",
    customerEmailID: emailClean,
    customerMobileNo: phoneClean,
    customerName: nameClean,
    merchantId: config.merchantId,
    merchantTxnNo: params.merchantTxnNo,
    payType: "0",
    returnURL: returnUrl,
    transactionType: "SALE",
    txnDate: txnDate,
  }

  const dataToHash = buildSortedDataToHash(fieldsToHash)
  const secureHash = hmacSha256(dataToHash, config.secretKey)

  const payload = {
    ...fieldsToHash,
    secureHash,
  }

  const maxAttempts = 2
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(config.initiateSaleUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(
          `[ICICI initiateSale] Attempt ${attempt} failed (HTTP ${response.status}):`,
          errorText,
        )

        // Retry on transient 5xx server/gateway errors (500, 502, 503, 504)
        if ([500, 502, 503, 504].includes(response.status) && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 800))
          continue
        }

        const friendlyMessage = [502, 503, 504].includes(response.status)
          ? "ICICI Bank server is temporarily unreachable (502). Please try again or select Razorpay."
          : `ICICI Gateway Error (${response.status})`

        return {
          success: false,
          message: friendlyMessage,
          rawResponse: { error: errorText, status: response.status },
        }
      }

      const data = (await response.json()) as {
        redirectURI?: string
        tranCtx?: string
        responseCode?: string
        responseDescription?: string
        errorMsg?: string
        responseMessage?: string
        [key: string]: unknown
      }

      if (!data.redirectURI || !data.tranCtx) {
        console.error("[ICICI initiateSale] Missing redirectURI/tranCtx:", data)
        return {
          success: false,
          message:
            (data.errorMsg as string) ||
            (data.responseDescription as string) ||
            (data.responseMessage as string) ||
            "ICICI Gateway did not return redirect URL",
          rawResponse: data,
        }
      }

      const separator = data.redirectURI.includes("?") ? "&" : "?"
      const fullRedirectUrl = `${data.redirectURI}${separator}tranCtx=${encodeURIComponent(
        data.tranCtx,
      )}`

      return {
        success: true,
        redirectUrl: fullRedirectUrl,
        redirectURI: data.redirectURI,
        tranCtx: data.tranCtx,
        merchantTxnNo: params.merchantTxnNo,
        rawResponse: data,
      }
    } catch (error) {
      console.error(`[ICICI initiateSale] Attempt ${attempt} network exception:`, error)
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        continue
      }
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to ICICI gateway",
      }
    }
  }

  return {
    success: false,
    message: "Failed to initiate payment after retry",
  }
}

// Checks transaction status with ICICI Bank Command API
export async function checkIciciStatus(
  originalTxnNo: string,
): Promise<IciciStatusResponse> {
  const config = getIciciConfig()

  if (!config.merchantId || !config.aggregatorId || !config.secretKey) {
    return {
      success: false,
      message: "ICICI credentials are not configured",
    }
  }

  const queryTxnNo = generateMerchantTxnNo()

  const fieldsToHash: Record<string, string> = {
    aggregatorID: config.aggregatorId,
    merchantId: config.merchantId,
    merchantTxnNo: queryTxnNo,
    originalTxnNo: originalTxnNo,
    transactionType: "STATUS",
  }

  const dataToHash = buildSortedDataToHash(fieldsToHash)
  const secureHash = hmacSha256(dataToHash, config.secretKey)

  const payload = {
    ...fieldsToHash,
    secureHash,
  }

  try {
    const response = await fetch(config.statusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return {
        success: false,
        message: `ICICI Status HTTP Error: ${response.status}`,
      }
    }

    const data = (await response.json()) as Record<string, unknown>

    const txnStatus = String(
      data.txnStatus || data.status || data.transactionStatus || "",
    ).toUpperCase()

    const responseCode = String(
      data.txnResponseCode || data.responseCode || data.statusCode || "",
    ).trim()

    const respDesc = String(
      data.txnRespDescription || data.respDescription || data.responseMessage || "",
    ).toUpperCase()

    const isSuccess =
      txnStatus === "SUC" ||
      txnStatus === "SUCCESS" ||
      txnStatus === "PAID" ||
      responseCode === "0000" ||
      responseCode === "00" ||
      responseCode === "0" ||
      responseCode === "E000" ||
      respDesc.includes("SUCCESS")

    return {
      success: isSuccess,
      status: txnStatus || (isSuccess ? "SUCCESS" : "FAILED"),
      responseCode,
      bankRefNo: String(
        data.txnID || data.txnAuthID || data.bankRefNo || data.pgTxnNo || data.paymentID || "",
      ),
      rawResponse: data,
    }
  } catch (error) {
    console.error("ICICI checkStatus error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to query ICICI status",
    }
  }
}
