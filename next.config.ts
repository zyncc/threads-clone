import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dz659x1g35zt2.cloudfront.net",
      },
    ],
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^cloudflare:workers$/,
      }),
    );
    return config;
  },
};

export default nextConfig;
