import { sendTemplateEmail } from "@/lib/email"

type TemplateData = Record<string, string | number | null | undefined>

const subjects = {
  welcome: "Welcome to Roopshree Bandhej - Your Account is Ready!",
  orderConfirmation: "Roopshree Bandhej - Your Order Confirmation",
  firstOrder: "Thank You for Your First Order with Roopshree Bandhej",
  orderShipped: "Roopshree Bandhej - Your Order is Shipped",
  orderDelivered: "Roopshree Bandhej - Your Order Has Been Delivered",
  newsletter: "Roopshree Bandhej - You are subscribed",
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ""
}

function sendUserEmail({
  to,
  subject,
  template,
  data,
}: {
  to: string
  subject: string
  template: string
  data?: TemplateData
}) {
  return sendTemplateEmail({
    to,
    subject,
    type: "user",
    template,
    data: {
      baseUrl: getBaseUrl(),
      email: to,
      "Customer First Name": data?.customerName || data?.userName || "",
      ...data,
    },
  })
}

export async function notifyWelcomeEmail({
  email,
  customerName,
}: {
  email: string
  customerName: string
}) {
  return sendUserEmail({
    to: email,
    subject: subjects.welcome,
    template: "welcome",
    data: {
      customerName,
      name: customerName,
      "Customer First Name": customerName,
    },
  })
}

export async function notifyOrderConfirmationEmail({
  email,
  customerName,
  orderId,
  orderDate,
  productNames,
  orderTotal,
}: {
  email: string
  customerName: string
  orderId: string
  orderDate: string
  productNames: string
  orderTotal: string
}) {
  return sendUserEmail({
    to: email,
    subject: subjects.orderConfirmation,
    template: "order",
    data: {
      customerName,
      "Customer First Name": customerName,
      "Order ID": orderId,
      "Order Date": orderDate,
      "Product Names": productNames,
      "Order Total": orderTotal,
    },
  })
}

export async function notifyFirstOrderEmail({
  email,
  customerName,
}: {
  email: string
  customerName: string
}) {
  return sendUserEmail({
    to: email,
    subject: subjects.firstOrder,
    template: "firstorder",
    data: {
      customerName,
      "Customer First Name": customerName,
    },
  })
}

export async function notifyOrderShippedEmail({
  email,
  customerName,
  orderId,
  courierName,
  trackingNumber,
  trackingLink,
}: {
  email: string
  customerName: string
  orderId: string
  courierName?: string | null
  trackingNumber?: string | null
  trackingLink?: string | null
}) {
  return sendUserEmail({
    to: email,
    subject: subjects.orderShipped,
    template: "shipping",
    data: {
      customerName,
      "Customer First Name": customerName,
      "Order ID": orderId,
      "Courier Name": courierName || "Our courier partner",
      "Tracking Number": trackingNumber || "Will be shared soon",
      "Tracking Link": trackingLink || "Will be shared soon",
    },
  })
}

export async function notifyOrderDeliveredEmail({
  email,
  customerName,
  orderId,
  deliveryDate,
}: {
  email: string
  customerName: string
  orderId: string
  deliveryDate: string
}) {
  const reviewLink = `${getBaseUrl()}/dashboard/reviews`

  return sendUserEmail({
    to: email,
    subject: subjects.orderDelivered,
    template: "delivery",
    data: {
      customerName,
      "Customer First Name": customerName,
      "Order ID": orderId,
      "Delivery Date": deliveryDate,
      "Review Link": reviewLink || "/dashboard/reviews",
    },
  })
}

export async function notifyNewsletterSignupEmail({ email }: { email: string }) {
  const customerName = email.split("@")[0] || "Customer"
  const subscriptionLink = getBaseUrl() || "/"

  return sendUserEmail({
    to: email,
    subject: subjects.newsletter,
    template: "newsletter",
    data: {
      customerName,
      "Customer First Name": customerName,
      "Subscription Link": subscriptionLink,
    },
  })
}
