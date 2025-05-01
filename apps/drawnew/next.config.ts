import type { NextConfig } from "next";
import { webpack } from "next/dist/compiled/webpack/webpack";

const nextConfig: NextConfig = {
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_HTTP_BACKEND: process.env.NEXT_PUBLIC_HTTP_BACKEND,
    NEXT_PUBLIC_WS_BACKEND: process.env.NEXT_PUBLIC_WS_BACKEND,
  },
  webpack: (config, { isServer }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env.JWT_SECRET": JSON.stringify(process.env.JWT_SECRET),
        "process.env.DATABASE_URL": JSON.stringify(process.env.DATABASE_URL),
        "process.env.NEXT_PUBLIC_HTTP_BACKEND": JSON.stringify(process.env.NEXT_PUBLIC_HTTP_BACKEND),
        "process.env.NEXT_PUBLIC_WS_BACKEND": JSON.stringify(process.env.NEXT_PUBLIC_WS_BACKEND),
      })
    );
    return config;
  },
};

export default nextConfig;
