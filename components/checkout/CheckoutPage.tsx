import Image from "next/image"

import { CheckoutFlow } from "@/components/checkout/CheckoutFlow"
import type { AddressView } from "@/services/address.service"

export function CheckoutPage({
  addresses,
  isGuest,
  secondPhone = "",
}: {
  addresses: AddressView[]
  isGuest: boolean
  secondPhone?: string
}) {
  return (
    <main className="min-h-screen overflow-x-hidden pt-16">
      <section className="relative isolate min-h-screen overflow-x-hidden">
        <Image
          src="/404.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-top"
        />

        <div className="mx-auto w-full max-w-[760px] px-4 pb-12 pt-7 sm:px-6 md:pb-20 md:pt-12 lg:px-0">
          <CheckoutFlow
            addresses={addresses}
            isGuest={isGuest}
            secondPhone={secondPhone}
          />
        </div>
      </section>
    </main>
  )
}
