import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["31.97.246.68", "app.emanuelgomes.com.br"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "minio" },
      { protocol: "https", hostname: "app.emanuelgomes.com.br" },
      { protocol: "https", hostname: "*.cdninstagram.com" },
      { protocol: "https", hostname: "*.fbcdn.net" },
    ],
  },
};

export default nextConfig;
