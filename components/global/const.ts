export type Product = {
  id: number | string
  variantId?: string | null
  slug: string
  name: string
  colour: string
  price: number
  stockQuantity?: number
  rating?: number
  reviewCount?: number
  image: string
  imageClass?: string
  isFeatured?: boolean
  isNewArrival?: boolean
  isTrending?: boolean
}

export function productToCartItem(product: Product) {
  const productId = product.variantId
    ? `${product.slug}:${product.variantId}`
    : product.slug

  return {
    productId,
    dbProductId: typeof product.id === "string" ? product.id : undefined,
    variantId: product.variantId ?? undefined,
    title: product.name,
    price: product.price,
    stockQuantity: product.stockQuantity,
    image: product.image,
    colour: product.colour,
    imageClass: product.imageClass,
    attributes: product.colour
      ? [{ name: "Colour", value: product.colour }]
      : undefined,
  }
}

export const products: Product[] = [
  {
    id: 1,
    slug: "lagdi-patta-dupata",
    name: "Lagdi Patta Dupata",
    colour: "Red",
    price: 1850,
    image: "/home/new-arrival-model.png",
    imageClass: "object-top",
  },
  {
    id: 2,
    slug: "lagdi-patta-saree",
    name: "Lagdi Patta Saree",
    colour: "Red",
    price: 1850,
    image: "/product/product_img.png",
    imageClass: "object-top",
  },
  {
    id: 3,
    slug: "jaal-chunri-with-pittan-work",
    name: "Jaal Chunri With Pittan Work",
    colour: "Red",
    price: 1850,
    image: "/home/zardozi.png",
    imageClass: "object-center",
  },
  {
    id: 4,
    slug: "radiant-peal-satin-tissue-saree",
    name: "Radiant Peal Satin Tissue Saree",
    colour: "Red",
    price: 1850,
    image: "/home/shrug.png",
    imageClass: "object-center",
  },
  {
    id: 5,
    slug: "lagdi-patta-dupata-belbuti",
    name: "Lagdi Patta Dupata",
    colour: "Red",
    price: 1850,
    image: "/home/belbuti.png",
    imageClass: "object-center",
  },
]

export const shopProducts: Product[] = [
  {
    ...products[0],
    image: "/shop/sm-shop_bg.png",
    imageClass: "object-[50%_58%]",
  },
  {
    ...products[1],
    image: "/shop/sm-shop_bg.png",
    imageClass: "object-[55%_55%]",
  },
  {
    ...products[2],
    image: "/shop/shop_bg.png",
    imageClass: "object-[68%_58%]",
  },
  {
    ...products[3],
    image: "/shop/shop_bg.png",
    imageClass: "object-[82%_50%]",
  },
]

export const wishlistProducts = products.slice(0, 3)

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price)
}

export type CartSummaryItem = {
  price: number
  quantity: number
}

export function getCartSummary(items: CartSummaryItem[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const shipping = 0
  const gst = 0

  return {
    subtotal,
    shipping,
    gst,
    total: subtotal + shipping + gst,
  }
}

export const blogCategories = ["All", "Design", "Trends", "Tips & Guides"]

export const blogPosts = [
  {
    slug: "elegance-of-gaji-silk",
    title: "The Elegance of Gaji Silk: A Timeless Dupatta Treasure",
    excerpt:
      "Discover the charm of authentic Bandhej and Gaji silk traditions.",
    image: "/product/product_img.png",
    author: "Rajan Kumar",
    authorRole: "Textile Curator",
    date: "12 March 2024",
    readTime: "7 min read",
    category: "Design",
    tags: ["Heritage", "Styling", "Handwork"],
    content: [
      "The Indian textile story is constantly evolving, responding to changing lifestyles, fresh regional references, and growing appreciation for craftsmanship. A hand-done Bandhej piece brings warmth and movement into modern wardrobes while carrying a deeply rooted cultural memory.",
      "Current styling trends celebrate pieces that are versatile, expressive, and refined. From festive gatherings to intimate celebrations, Bandhej dupattas and sarees continue to create a graceful bridge between tradition and contemporary dressing.",
      "What makes these textiles special is their handmade rhythm: the subtle irregularities, color blooms, tied motifs, and carefully finished borders. Each detail reflects patience, skill, and a design language passed through generations.",
      "To style a statement textile today, keep the silhouette simple and let the craft lead. Pair a richly detailed dupatta with a plain kurta, choose jewelry with restraint, and allow the color story to become the focal point.",
    ],
  },
  {
    slug: "bandhej-patterns-and-meaning",
    title: "Bandhej Patterns and the Stories They Carry",
    excerpt:
      "Explore how Bandhej patterns carry stories of craft, patience, and celebration.",
    image: "/product/product_img.png",
    author: "Rajan Kumar",
    authorRole: "Textile Curator",
    date: "12 March 2024",
    readTime: "7 min read",
    category: "Trends",
    tags: ["Bandhej", "Patterns", "Culture"],
    content: [
      "Bandhej motifs are more than decoration. They carry visual memory from regions, rituals, and seasons of celebration.",
      "Small dots, flowing repeats, and ornate borders create movement across the fabric while keeping the textile light and festive.",
      "Modern styling has brought Bandhej into everyday wardrobes, allowing traditional artistry to feel easy and personal.",
    ],
  },
  {
    slug: "styling-traditional-dupattas",
    title: "A Simple Guide to Styling Traditional Dupattas",
    excerpt:
      "A simple guide to pairing traditional dupattas with modern silhouettes.",
    image: "/product/product_img.png",
    author: "Rajan Kumar",
    authorRole: "Style Editor",
    date: "12 March 2024",
    readTime: "7 min read",
    category: "Tips & Guides",
    tags: ["Styling", "Dupatta", "Guide"],
    content: [
      "A traditional dupatta can transform the simplest outfit when the color, drape, and accessories are balanced.",
      "Choose clean base layers when the dupatta has heavy craft detail. This lets the textile breathe and keeps the look polished.",
      "For festive styling, repeat one color from the dupatta in jewelry, footwear, or a potli to make the outfit feel intentional.",
    ],
  },
  {
    slug: "heirloom-textiles-for-festive-wardrobes",
    title: "Why Heirloom Textiles Still Define Festive Wardrobes",
    excerpt:
      "Learn why heirloom textiles remain relevant for festive wardrobes.",
    image: "/product/product_img.png",
    author: "Rajan Kumar",
    authorRole: "Textile Curator",
    date: "12 March 2024",
    readTime: "7 min read",
    category: "Design",
    tags: ["Heirloom", "Festive", "Craft"],
    content: [
      "Heirloom textiles hold emotion. They remind us of family celebrations, regional identities, and the pleasure of dressing with meaning.",
      "Their relevance remains strong because they pair beautifully with both classic and contemporary silhouettes.",
      "A well-made Bandhej piece can be restyled year after year, becoming more personal with time.",
    ],
  },
  {
    slug: "color-motif-and-drape",
    title: "How Color, Motif, and Drape Shape a Bandhej Look",
    excerpt:
      "How color, motif, and drape create the mood of a Bandhej look.",
    image: "/product/product_img.png",
    author: "Rajan Kumar",
    authorRole: "Style Editor",
    date: "12 March 2024",
    readTime: "7 min read",
    category: "Trends",
    tags: ["Color", "Motif", "Drape"],
    content: [
      "Color sets the first impression of a Bandhej look. Deep reds feel ceremonial, while lighter tones can feel effortless and daytime-friendly.",
      "Motifs add rhythm, and the drape decides how the textile moves with the body.",
      "Together, these details create a mood that can be festive, regal, playful, or understated.",
    ],
  },
  {
    slug: "care-guide-for-handmade-textiles",
    title: "Care Tips for Delicate Handmade Textiles",
    excerpt:
      "Care tips to keep delicate handmade textiles beautiful for years.",
    image: "/product/product_img.png",
    author: "Rajan Kumar",
    authorRole: "Care Specialist",
    date: "12 March 2024",
    readTime: "7 min read",
    category: "Tips & Guides",
    tags: ["Care", "Storage", "Textiles"],
    content: [
      "Handmade textiles deserve gentle care. Air them after wear, avoid harsh sunlight, and store them folded with breathable fabric.",
      "Dry clean heavily embellished pieces and keep perfumes away from delicate surfaces.",
      "With mindful care, Bandhej and silk pieces can remain beautiful for years.",
    ],
  },
  {
    slug: "signature-details-in-bandhej",
    title: "Signature Details That Make Every Piece Unique",
    excerpt:
      "A closer look at signature details that make every piece unique.",
    image: "/product/product_img.png",
    author: "Rajan Kumar",
    authorRole: "Textile Curator",
    date: "12 March 2024",
    readTime: "7 min read",
    category: "Design",
    tags: ["Details", "Craft", "Bandhej"],
    content: [
      "No two handmade textiles are exactly alike. The placement of motif, depth of dye, and touch of the artisan all shape the final piece.",
      "These variations are not flaws; they are the quiet proof of handcraft.",
      "That is what makes each Bandhej piece feel alive.",
    ],
  },
  {
    slug: "handwork-in-everyday-styling",
    title: "Why Traditional Handwork Belongs in Everyday Styling",
    excerpt:
      "Why traditional handwork is finding new love in everyday styling.",
    image: "/product/product_img.png",
    author: "Rajan Kumar",
    authorRole: "Style Editor",
    date: "12 March 2024",
    readTime: "7 min read",
    category: "Trends",
    tags: ["Everyday", "Handwork", "Style"],
    content: [
      "Traditional handwork does not need to wait for grand occasions. Styled thoughtfully, it can bring character to everyday dressing.",
      "Pair a crafted dupatta with a plain kurta, cotton dress, or structured separates for a balanced look.",
      "The result feels personal, rooted, and quietly elegant.",
    ],
  },
]

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}
