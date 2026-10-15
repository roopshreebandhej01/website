import {
  AWS_REGION,
  ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  SES_ACCESS_KEY_ID,
  SES_AWS_SECRET_ACCESS_KEY,
} from "@/config/env";
import { SESClient } from "@aws-sdk/client-ses";

export const sesClient = new SESClient({
  region: AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: ACCESS_KEY_ID || SES_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY || SES_AWS_SECRET_ACCESS_KEY,
  },
});