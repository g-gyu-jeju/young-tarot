import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // 상위 폴더에 다른 package-lock.json이 있을 때 추적 루트 고정
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Notion embed: allow iframe from any origin (CSP is the modern approach)
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          // Some proxies expect this; non-standard but requested for Notion embeds
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
    ];
  },
};

export default nextConfig;
