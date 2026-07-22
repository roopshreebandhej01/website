import { CartPage } from "@/components/cart/CartPage"
import { getRecommendedProducts } from "@/services/product.service"

export default async function Page() {
  const recommendedProducts = await getRecommendedProducts(5)

  return <CartPage recommendedProducts={recommendedProducts} />
}
