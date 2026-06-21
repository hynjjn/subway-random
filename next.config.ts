import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 폴더에 다른 lockfile이 있어 워크스페이스 루트가 잘못 추론되는 것을 방지
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
