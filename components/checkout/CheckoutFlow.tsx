"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { CheckoutReviewModal } from "@/components/checkout/CheckoutReviewModal"
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary"
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps"
import { getCartSummary } from "@/components/global/const"
import type { AddressView } from "@/services/address.service"
import { useCartStore } from "@/store/cartStore"
import type { CartItem } from "@/store/cartTypes"

export type CheckoutShippingDetails = {
  addressId?: string
  fullName: string
  phone: string
  email?: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}

const manualAddressId = "manual"

function getAddressShipping(address: AddressView): CheckoutShippingDetails {
  return {
    addressId: address.id,
    fullName: address.fullName,
    phone: address.phone,
    email: "",
    addressLine1: address.line1,
    addressLine2: [address.line2, address.locality].filter(Boolean).join(", "),
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country || "India",
  }
}

function getEmptyShipping(): CheckoutShippingDetails {
  return {
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  }
}

function getInitialAddress(addresses: AddressView[]) {
  return addresses.find((address) => address.isDefault) ?? addresses[0] ?? null
}

function isShippingComplete(shipping: CheckoutShippingDetails, isGuest: boolean) {
  const isBaseComplete = Boolean(
    shipping.fullName.trim() &&
      shipping.phone.trim() &&
      shipping.addressLine1.trim() &&
      shipping.city.trim() &&
      shipping.state.trim() &&
      shipping.postalCode.trim(),
  )
  if (isGuest) {
    return isBaseComplete && Boolean(shipping.email?.trim())
  }
  return isBaseComplete
}

export function CheckoutFlow({
  addresses,
  isGuest,
}: {
  addresses: AddressView[]
  isGuest: boolean
}) {
  const searchParams = useSearchParams()
  const source = searchParams.get("source") === "buy-now" ? "buy-now" : "cart"

  const cartItems = useCartStore((state) => state.items)
  const initialAddress = getInitialAddress(addresses)

  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const [selectedAddressId, setSelectedAddressId] = useState(
    initialAddress?.id ?? manualAddressId,
  )

  const [shipping, setShipping] = useState<CheckoutShippingDetails>(
    initialAddress ? getAddressShipping(initialAddress) : getEmptyShipping(),
  )

  const items = source === "buy-now" ? (buyNowItem ? [buyNowItem] : []) : cartItems
  const summary = getCartSummary(items)

  const isManualAddress = selectedAddressId === manualAddressId
  const canReviewOrder = items.length > 0 && isShippingComplete(shipping, isGuest)

  useEffect(() => {
    if (source !== "buy-now") return

    const timer = window.setTimeout(() => {
      const item = window.sessionStorage.getItem("roopshree-buy-now")

      if (!item) {
        setBuyNowItem(null)
        return
      }

      try {
        setBuyNowItem(JSON.parse(item) as CartItem)
      } catch {
        setBuyNowItem(null)
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [source])

  return (
    <>
      {isReviewOpen ? (
        <CheckoutReviewModal
          items={items}
          summary={summary}
          source={source}
          shipping={shipping}
          isGuest={isGuest}
          onClose={() => setIsReviewOpen(false)}
        />
      ) : (
        <>
          <CheckoutSteps activeStep={1} />

          <div className="mt-8 grid gap-5 md:mt-12 md:grid-cols-[480px_210px] md:items-start md:justify-center">
            <section className="min-w-0">
              <h1 className="font-heading text-xl font-semibold leading-none text-black">
                Shipping Details
              </h1>

              {addresses.length > 0 ? (
                <div className="mt-5 space-y-3 md:mt-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3F2617]/70">
                    Saved Addresses
                  </p>

                  {addresses.map((address) => (
                    <SavedAddressCard
                      key={address.id}
                      address={address}
                      selected={selectedAddressId === address.id}
                      onSelect={() => {
                        setSelectedAddressId(address.id)
                        setShipping(getAddressShipping(address))
                      }}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressId(manualAddressId)
                      setShipping(getEmptyShipping())
                    }}
                    className={`flex min-h-12 w-full items-center gap-3 border px-4 py-3 text-left text-sm font-medium transition ${
                      isManualAddress
                        ? "border-[#C39150] bg-[#3F2617]/10 text-[#3F2617]"
                        : "border-[#C39150]/40 bg-white/70 text-[#3F2617] hover:border-[#C39150]"
                    }`}
                  >
                    <span
                      className={`size-3 rounded-full border ${
                        isManualAddress
                          ? "border-[#C39150] bg-[#C39150]"
                          : "border-[#3F2617]/50 bg-white"
                      }`}
                    />
                    Use a different address
                  </button>
                </div>
              ) : null}

              <form
                className="mt-5 grid gap-3 md:mt-6"
                onSubmit={(event) => {
                  event.preventDefault()

                  if (canReviewOrder) {
                    setIsReviewOpen(true)
                  }
                }}
              >
                {addresses.length === 0 || isManualAddress ? (
                  <>
                    {isGuest ? (
                      <div className="mb-3">
                        <CheckoutInput
                          label="Email Address"
                          value={shipping.email || ""}
                          onChange={(value) =>
                            setShipping((current) => ({
                              ...current,
                              email: value,
                            }))
                          }
                        />
                      </div>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <CheckoutInput
                        label="Full Name"
                        value={shipping.fullName}
                        onChange={(value) =>
                          setShipping((current) => ({
                            ...current,
                            fullName: value,
                          }))
                        }
                      />

                      <CheckoutInput
                        label="Phone no."
                        value={shipping.phone}
                        onChange={(value) =>
                          setShipping((current) => ({
                            ...current,
                            phone: value,
                          }))
                        }
                      />
                    </div>

                    <CheckoutInput
                      label="Address Line 1"
                      value={shipping.addressLine1}
                      onChange={(value) =>
                        setShipping((current) => ({
                          ...current,
                          addressLine1: value,
                        }))
                      }
                    />

                    <CheckoutInput
                      label="Address Line 2 (Optional)"
                      value={shipping.addressLine2}
                      onChange={(value) =>
                        setShipping((current) => ({
                          ...current,
                          addressLine2: value,
                        }))
                      }
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <CheckoutInput
                        label="City"
                        value={shipping.city}
                        onChange={(value) =>
                          setShipping((current) => ({
                            ...current,
                            city: value,
                          }))
                        }
                      />

                      <CheckoutInput
                        label="State"
                        value={shipping.state}
                        onChange={(value) =>
                          setShipping((current) => ({
                            ...current,
                            state: value,
                          }))
                        }
                      />
                    </div>

                    <CheckoutInput
                      label="Pincode"
                      value={shipping.postalCode}
                      onChange={(value) =>
                        setShipping((current) => ({
                          ...current,
                          postalCode: value,
                        }))
                      }
                    />
                  </>
                ) : null}

                {addresses.length > 0 && !isManualAddress ? (
                  <div className="border border-[#C39150]/45 bg-white/65 px-4 py-3 text-xs font-medium leading-5 text-[#3F2617]">
                    Selected address will be used for this order.
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canReviewOrder}
                  className="mt-2 h-11 bg-[#C39150] px-6 text-sm font-semibold tracking-[0.05em] text-white transition hover:bg-[#3F2617] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Review Order
                </button>
              </form>
            </section>

            <CheckoutSummary items={items} summary={summary} />
          </div>
        </>
      )}
    </>
  )
}

function SavedAddressCard({
  address,
  selected,
  onSelect,
}: {
  address: AddressView
  selected: boolean
  onSelect: () => void
}) {
  const addressLine = [
    address.line1,
    address.line2,
    address.locality,
    address.city,
    address.state,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full border px-4 py-4 text-left transition ${
        selected
          ? "border-[#C39150] bg-[#3F2617]/10"
          : "border-[#C39150]/40 bg-white/70 hover:border-[#C39150]"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-1 size-3 shrink-0 rounded-full border ${
            selected
              ? "border-[#C39150] bg-[#C39150]"
              : "border-[#3F2617]/50 bg-white"
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="break-words text-sm font-semibold text-[#3F2617]">
              {address.fullName}
            </p>
            {address.isDefault ? (
              <span className="bg-[#C39150] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
                Default
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs font-medium text-[#3F2617]/70">
            {address.phone}
          </p>
          <p className="mt-1 break-words text-xs leading-5 text-[#3F2617]/70">
            {addressLine}
          </p>
        </div>
      </div>
    </button>
  )
}

function CheckoutInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C39150]">
        {label}
      </span>
      <input
        type="text"
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full border border-[#C39150]/80 bg-white/70 px-4 text-sm font-medium text-[#3F2617] outline-none transition placeholder:text-[#3F2617]/70 focus:border-[#3F2617] md:h-10 md:text-xs"
      />
    </label>
  )
}
