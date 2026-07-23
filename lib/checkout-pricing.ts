export const FREE_DELIVERY_MINIMUM_RUPEES = 500
export const DELIVERY_CHARGE_RUPEES = 70

export const FREE_DELIVERY_MINIMUM_PAISE = FREE_DELIVERY_MINIMUM_RUPEES * 100
export const DELIVERY_CHARGE_PAISE = DELIVERY_CHARGE_RUPEES * 100

export type SummaryItem = {
  price: number
  quantity: number
}

export function getDeliveryCharge(subtotal: number, {
  freeDeliveryMinimum,
  deliveryCharge,
}: {
  freeDeliveryMinimum: number
  deliveryCharge: number
}) {
  return subtotal > 0 && subtotal < freeDeliveryMinimum ? deliveryCharge : 0
}

export function getOrderSummary(items: SummaryItem[], {
  freeDeliveryMinimum,
  deliveryCharge,
}: {
  freeDeliveryMinimum: number
  deliveryCharge: number
}) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const shipping = getDeliveryCharge(subtotal, {
    freeDeliveryMinimum,
    deliveryCharge,
  })
  const gst = 0

  return {
    subtotal,
    shipping,
    gst,
    total: subtotal + shipping + gst,
    qualifiesForFreeDelivery: subtotal >= freeDeliveryMinimum,
    freeDeliveryMinimum,
    deliveryCharge,
  }
}

export function getRupeeOrderSummary(items: SummaryItem[]) {
  return getOrderSummary(items, {
    freeDeliveryMinimum: FREE_DELIVERY_MINIMUM_RUPEES,
    deliveryCharge: DELIVERY_CHARGE_RUPEES,
  })
}

export function getPaiseOrderSummary(items: SummaryItem[]) {
  return getOrderSummary(items, {
    freeDeliveryMinimum: FREE_DELIVERY_MINIMUM_PAISE,
    deliveryCharge: DELIVERY_CHARGE_PAISE,
  })
}
