import { CheckoutPage } from "@/components/checkout/CheckoutPage"
import { getAddresses } from "@/helper/address/action"
import { getProfile } from "@/helper/user/action"
import { getCurrentSession } from "@/lib/auth"

export default async function Page() {
  const session = await getCurrentSession()

  const [addresses, profile] = session
    ? await Promise.all([getAddresses(), getProfile()])
    : [[], null]

  return (
    <CheckoutPage
      addresses={addresses}
      isGuest={!session}
      secondPhone={profile?.secondPhone ?? ""}
    />
  )
}
