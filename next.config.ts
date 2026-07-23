import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d2co0ksrpuk490.cloudfront.net", // CloudFront CDN
      },
      {
        protocol: "https",
        hostname: "d209jjsil73ccf.cloudfront.net", // CloudFront CDN
      },
      {
        protocol: "https",
        hostname: "roopshree.s3.ap-south-1.amazonaws.com", // S3 Bucket fallback
      },
    ],
  },
};

export default nextConfig;