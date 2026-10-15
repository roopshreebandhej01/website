import { NextRequest, NextResponse } from "next/server"

import { finalizeIciciPaymentOrder } from "@/actions/checkout.action"
import { checkIciciStatus, getIciciConfig, verifyIciciCallbackHash } from "@/lib/icici"

async function extractPayload(req: NextRequest) {
  const result: Record<string, string> = {}

  req.nextUrl.searchParams.forEach((val, key) => {
    result[key] = val
  })

  if (req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        const json = await req.json()
        Object.entries(json).forEach(([k, v]) => {
          result[k] = String(v)
        })
      } else {
        const formData = await req.formData()
        formData.forEach((val, key) => {
          result[key] = typeof val === "string" ? val : val.name
        })
      }
    } catch {
      // Body may be empty on some proxies
    }
  }

  return result
}

function parseAmountToPaise(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined
  const num = parseFloat(String(val).replace(/,/g, ""))
  if (isNaN(num) || num <= 0) return undefined
  return Math.round(num * 100)
}

function getBaseUrl(req: NextRequest): string {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.host ||
    "localhost:3000"
  const protocol =
    req.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https")
  return `${protocol}://${host}`
}

async function handleIciciCallback(req: NextRequest) {
  const baseUrl = getBaseUrl(req)

  try {
    const payload = await extractPayload(req)

    const merchantTxnNo =
      payload.merchantTxnNo ||
      payload.merchantRefNo ||
      payload.transactionid ||
      payload.transactionId ||
      payload.merchantTxnId ||
      payload.mer_txn ||
      ""

    const bankRefNo =
      payload.paymentID ||
      payload.txnID ||
      payload.bankRefNo ||
      payload.pgTxnNo ||
      payload.tranCtx ||
      payload.rrn ||
      payload.originalid ||
      payload.paymentId ||
      ""

    const responseCode = String(
      payload.responseCode || payload.statusCode || "",
    ).trim()

    const respDescription = String(
      payload.respDescription || payload.responseMessage || "",
    ).toUpperCase()

    const rawStatus = String(
      payload.status || payload.transactionStatus || payload.txnStatus || "",
    ).toUpperCase()

    if (!merchantTxnNo) {
      console.error("[ICICI Callback] Missing merchantTxnNo:", payload)
      return NextResponse.redirect(new URL("/cart", baseUrl), 303)
    }

    // 1. REAL-TIME BANK APPROVAL CHECK:
    // Only approved when bank actually confirms success
    const bankApprovedIncoming =
      responseCode === "0000" ||
      responseCode === "00" ||
      responseCode === "0" ||
      responseCode === "E000" ||
      rawStatus === "SUC" ||
      rawStatus === "SUCCESS" ||
      rawStatus === "PAID" ||
      respDescription.includes("SUCCESS")

    let isSuccess = false
    let verifiedBankRefNo = bankRefNo
    let verifiedRawResponse: Record<string, unknown> = payload
    let paidAmountInPaise = parseAmountToPaise(
      payload.amount || payload.txnAmount || payload.paymentAmount,
    )

    // Check with bank server-to-server status API if possible
    try {
      const statusCheck = await checkIciciStatus(merchantTxnNo)
      if (statusCheck.success) {
        isSuccess = true
        if (statusCheck.bankRefNo) {
          verifiedBankRefNo = statusCheck.bankRefNo
        }
        if (statusCheck.rawResponse) {
          verifiedRawResponse = {
            ...payload,
            statusApiVerification: statusCheck.rawResponse,
          }
          const statusAmt =
            statusCheck.rawResponse.amount ||
            statusCheck.rawResponse.txnAmount ||
            statusCheck.rawResponse.originalTxnAmount ||
            statusCheck.rawResponse.paymentAmount
          const parsedStatusPaise = parseAmountToPaise(statusAmt)
          if (parsedStatusPaise !== undefined) {
            paidAmountInPaise = parsedStatusPaise
          }
        }
      }
    } catch (err) {
      console.warn("[ICICI Callback] checkIciciStatus inquiry warning:", err)
    }

    // If server status API confirmed OR incoming bank payload confirmed approval
    if (!isSuccess && bankApprovedIncoming) {
      isSuccess = true
    }

    // If not approved by bank, it is failed/cancelled
    console.log(
      `[ICICI Callback] Real-time evaluation: merchantTxnNo=${merchantTxnNo}, isSuccess=${isSuccess}, responseCode=${responseCode}, respDescription=${respDescription}, rawStatus=${rawStatus}`,
    )

    const finalizeResult = await finalizeIciciPaymentOrder({
      merchantTxnNo,
      bankRefNo: verifiedBankRefNo || payload.txnID || payload.paymentID || merchantTxnNo,
      status: isSuccess ? "paid" : "failed",
      rawResponse: verifiedRawResponse,
      paidAmountInPaise: isSuccess ? paidAmountInPaise : undefined,
    })

    if (finalizeResult.orderId) {
      return NextResponse.redirect(
        new URL(
          `/order-confirmation?orderId=${encodeURIComponent(finalizeResult.orderId)}`,
          baseUrl,
        ),
        303,
      )
    }

    return NextResponse.redirect(new URL("/cart", baseUrl), 303)
  } catch (error) {
    console.error("[ICICI Callback] Fatal callback error:", error)
    return NextResponse.redirect(new URL("/cart", baseUrl), 303)
  }
}

export async function GET(req: NextRequest) {
  return handleIciciCallback(req)
}

export async function POST(req: NextRequest) {
  return handleIciciCallback(req)
}