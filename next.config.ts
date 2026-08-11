import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Content-Type, Authorization, X-Requested-With, x-razorpay-signature",
          },
        ],
      },
    ];
  },
  images: {
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
