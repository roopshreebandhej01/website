import { formatPrice } from "@/components/global/const"
import type { CartItem } from "@/store/cartTypes"

type CartSummary = {
  subtotal: number
  shipping: number
  gst: number
  total: number
}

export function CheckoutSummary({
  items,
  summary,
}: {
  items: CartItem[]
  summary: CartSummary
}) {
  return (
    <aside className="min-w-0 bg-[#3F2617] px-5 py-6 text-white shadow-sm md:min-h-[318px]">
      <h2 className="font-heading text-sm font-semibold border-b border-white/20 pb-3">Summary</h2>
      
      {/* Product List */}
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.addedAt}`}
            className="flex items-start justify-between gap-4 text-white/80 border-b border-white/10 pb-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white text-xs leading-normal">{item.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-white/60">
                {item.attributes?.map((attr) => (
                  <span key={attr.name} className="bg-white/10 px-1.5 py-0.5 rounded-[2px]">
                    {attr.name}: {attr.value}
                  </span>
                ))}
                <span className="font-semibold text-white/70">Qty: {item.quantity}</span>
                <span>&times; {formatPrice(item.price)}</span>
              </div>
            </div>
            <span className="shrink-0 font-semibold text-white text-xs align-top pt-0.5">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div className="mt-5 space-y-3 text-[11px] pt-2">
        <SummaryLine label="Subtotal" value={formatPrice(summary.subtotal)} />
        <SummaryLine
          label="Delivery Charge"
          value={summary.shipping > 0 ? formatPrice(summary.shipping) : "Free"}
        />
        <p className="text-[10px] leading-4 text-white/60">
          {summary.shipping > 0
            ? "Free delivery on orders ₹500 and above."
            : "Free delivery applied."}
        </p>
      </div>
      <div className="mt-7 border-t border-white/35 pt-4 text-xs md:mt-24">
        <SummaryLine label="Total" value={formatPrice(summary.total)} strong />
      </div>
    </aside>
  )
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={`flex items-start justify-between gap-6 ${
        strong ? "font-semibold text-white" : "text-white/80"
      }`}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 font-semibold text-white">{value}</span>
    </div>
  )
}
