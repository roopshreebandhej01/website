"use server";

import fs from "fs";
import path from "path";
import { sendTemplateEmail } from "@/lib/email";
import { userSubjects } from "@/email-templates/userSubjects";

type TemplateData = Record<string, string | number | null | undefined>;

function injectTemplate(html: string, data: TemplateData) {
  return html.replace(/{{(.*?)}}/g, (_, key) => {
    const value = data[key.trim()];

    return value === null || value === undefined ? "" : String(value);
  });
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
}

// function getLogoUrl() {
//   const baseUrl = getBaseUrl().replace(/\/$/, "");

//   return process.env.EMAIL_LOGO_URL || (baseUrl ? `${baseUrl}/header-logo.png` : "");
// }

function sendUserTemplateEmail({
  to,
  subject,
  template,
  data,
}: {
  to: string;
  subject: string;
  template: string;
  data?: TemplateData;
}) {
  return sendTemplateEmail({
    to,
    subject,
    type: "user",
    template,
    data: {
      baseUrl: getBaseUrl(),
     // logoUrl: getLogoUrl(),
      email: to,
      "Customer First Name": data?.customerName || data?.userName || "",
      ...data,
    },
  });
}

function sendGenericTemplateEmail({
  to,
  subject,
  template,
  data,
}: {
  to: string;
  subject: string;
  template: string;
  data?: TemplateData;
}) {
  return sendTemplateEmail({
    to,
    subject,
    type: "generic",
    template,
    data: {
      baseUrl: getBaseUrl(),
      //logoUrl: getLogoUrl(),
      email: to,
      "Customer First Name": data?.customerName || data?.userName || "",
      ...data,
    },
  });
}

function getDeliveryDateValue() {
  const date = new Date();
  date.setDate(date.getDate() + 7);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function getDeliveryDate() {
  return getDeliveryDateValue();
}

export async function getWelcomeTemplate(name: string) {
  const filePath = path.join(
    process.cwd(),
    "email-templates",
    "user",
    "welcome.html",
  );
  const html = fs.readFileSync(filePath, "utf-8");

  return injectTemplate(html, {
    name,
    //logoUrl: getLogoUrl(),
    "Customer First Name": name,
  });
}

export async function getOrderTemplate(data: {
  orderId: string;
  customerName: string;
  amount: string;
  email: string;
  baseUrl: string;
  paymentMethod: string;
}) {
  const filePath = path.join(
    process.cwd(),
    "email-templates",
    "user",
    "order.html",
  );
  const html = fs.readFileSync(filePath, "utf-8");

  return injectTemplate(html, {
    ...data,
   // logoUrl: getLogoUrl(),
    "Customer First Name": data.customerName,
    "Order ID": data.orderId,
    "Order Date": getDeliveryDateValue(),
    "Order Total": data.amount,
    deliveryDate: getDeliveryDateValue(),
  });
}

export async function sendWelcomeEmail(name: string, email: string) {
  try {
    const result = await sendUserTemplateEmail({
      to: email,
      subject: userSubjects.signUp,
      template: "welcome",
      data: { name, "Customer First Name": name },
    });

    return { success: true, result };
  } catch (error) {
    console.error("SES Email Error:", error);
    return { success: false, error };
  }
}

export async function sendResetPasswordEmail(email: string) {
  try {
    const result = await sendGenericTemplateEmail({
      to: email,
      subject: userSubjects.passwordReset,
      template: "resetpass",
    });

    return { success: true, result };
  } catch (error) {
    console.error("SES Email Error:", error);
    return { success: false, error };
  }
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderId: string,
  orderDate: string,
  orderTime: string,
  paymentMethod: string,
  deliveryEstimate: string,
  amount: string,
  deliveryAddress: string,
) {
  try {
    const result = await sendUserTemplateEmail({
      to: email,
      subject: userSubjects.orderConfirmation,
      template: "order",
      data: {
        orderId,
        orderDate,
        orderTime,
        paymentMethod,
        deliveryDate: deliveryEstimate,
        deliveryEstimate,
        amount,
        deliveryAddress,
        "Order ID": orderId,
        "Order Date": orderDate,
        "Order Total": amount,
      },
    });

    return { success: true, result };
  } catch (error) {
    console.error("SES Email Error:", error);
    return { success: false, error };
  }
}

export async function sendOrderCancellationEmail(
  email: string,
  orderId: string,
) {
  try {
    const result = await sendUserTemplateEmail({
      to: email,
      subject: userSubjects.orderCancellation,
      template: "orderCancellation",
      data: { orderId },
    });

    return { success: true, result };
  } catch (error) {
    console.error("SES Email Error:", error);
    return { success: false, error };
  }
}

export async function sendOrderShippedEmail(
  email: string,
  orderId: string,
  courierPartner: string,
  trackingId: string,
) {
  try {
    const result = await sendUserTemplateEmail({
      to: email,
      subject: userSubjects.orderShipped,
      template: "shipping",
      data: {
        orderId,
        courierPartner,
        trackingId,
        "Order ID": orderId,
        "Courier Name": courierPartner,
        "Tracking Number": trackingId,
        "Tracking Link": trackingId,
      },
    });

    return { success: true, result };
  } catch (error) {
    console.error("SES Email Error:", error);
    return { success: false, error };
  }
}

export async function sendOrderStatusEmail(email: string, orderId: string) {
  try {
    const result = await sendUserTemplateEmail({
      to: email,
      subject: userSubjects.orderDelivered,
      template: "delivery",
      data: {
        orderId,
        deliveryDate: getDeliveryDateValue(),
        "Order ID": orderId,
        "Delivery Date": getDeliveryDateValue(),
      },
    });

    return { success: true, result };
  } catch (error) {
    console.error("SES Email Error:", error);
    return { success: false, error };
  }
}

export async function sendOutForDeliveryEmail(
  email: string,
  orderId: string,
  estimatedArrival: string,
) {
  try {
    const result = await sendUserTemplateEmail({
      to: email,
      subject: userSubjects.outForDelivery,
      template: "outForDelivery",
      data: {
        orderId,
        estimatedArrival,
      },
    });

    return { success: true, result };
  } catch (error) {
    console.error("SES Email Error:", error);
    return { success: false, error };
  }
}

export async function sendPaymentReceivedEmail(
  email: string,
  userName: string,
  orderId: string,
  amount: string,
  paymentMethod: string,
  deliveryDate: string,
) {
  try {
    const result = await sendUserTemplateEmail({
      to: email,
      subject: userSubjects.paymentSuccess,
      template: "paymentReceived",
      data: {
        customerName: userName,
        orderId,
        amount,
        paymentMethod,
        deliveryDate,
      },
    });

    return { success: true, result };
  } catch (error) {
    console.error("SES Email Error:", error);
    return { success: false, error };
  }
}

export async function sendRefundEmail(
  email: string,
  amount: string,
  orderId: string,
) {
  try {
    const result = await sendUserTemplateEmail({
      to: email,
      subject: userSubjects.refundProcessed,
      template: "refund",
      data: {
        Amount: amount,
        "Order ID": orderId,
        amount,
        orderId,
      },
    });

    return { success: true, result };
  } catch (error) {
    console.error("SES Email Error:", error);
    return { success: false, error };
  }
}
