import { NextRequest } from "next/server"

import { GET as callbackGet, POST as callbackPost } from "@/app/api/payment/icici/callback/route"

export async function GET(req: NextRequest) {
  return callbackGet(req)
}

export async function POST(req: NextRequest) {
  return callbackPost(req)
}
