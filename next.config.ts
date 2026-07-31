import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "./"),
  reactCompiler: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "bufferutil", "utf-8-validate"];
    }
    return config;
  },
};

export default nextConfig;
