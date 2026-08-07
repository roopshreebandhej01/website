import { SendEmailCommand } from "@aws-sdk/client-ses";
import { sesClient } from "@/lib/aws";
import fs from "fs";
import path from "path";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

type TemplateData = Record<string, string | number | null | undefined>;
type TemplateType = "generic" | "user";

type SendTemplateEmailParams = {
  to: string;
  subject: string;
  template: string;
  type: TemplateType;
  data?: TemplateData;
};

function getBaseUrl() {
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "";

  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    vercelUrl
  ).replace(/\/$/, "");
}

function getDefaultTemplateData(): TemplateData {
  const baseUrl = getBaseUrl();
  const logoUrl =
    process.env.EMAIL_LOGO_URL || (baseUrl ? `${baseUrl}/header-logo.png` : "");

  return {
    baseUrl,
    logoUrl,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadTemplate(template: string, type: TemplateType) {
  const templatePath = path.join(
    process.cwd(),
    "email-templates",
    type,
    `${template}.html`,
  );

  return fs.readFileSync(templatePath, "utf-8");
}

function renderTemplate(template: string, data: TemplateData = {}) {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key: string) => {
    const value = data[key.trim()];

    if (value === null || value === undefined) {
      return "";
    }

    return escapeHtml(String(value));
  });
}

export const sendEmail = async ({
  to,
  subject,
  html,
}: SendEmailParams) => {
  const command = new SendEmailCommand({
    Source: 'roopshreebandhej@avtechnosys.com',
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Html: {
          Data: html,
        },
      },
    },
  });

  return await sesClient.send(command);
};

export const sendTemplateEmail = async ({
  to,
  subject,
  template,
  type,
  data,
}: SendTemplateEmailParams) => {
  const html = renderTemplate(loadTemplate(template, type), {
    ...getDefaultTemplateData(),
    ...data,
  });

  return sendEmail({
    to,
    subject,
    html,
  });
};
