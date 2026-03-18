import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    // Monorepo: resolve next from workspace root node_modules
    root: path.join(__dirname, "..", ".."),
  },
  reactStrictMode: true,
  trailingSlash: true,
  transpilePackages: [
    "@visyx/encryption",
    "@visyx/supabase",
    "@visyx/ui",
    "@visyx/utils",
    "next-mdx-remote",
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    inlineCss: true,
    optimizePackageImports: [
      "react-icons",
      "motion",
      "@visyx/ui",
      "@radix-ui/react-icons",
      "lucide-react",
    ],
  },
  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
    // Limit max image size to 1200px (displayed size is ~1248px)
    // Default: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
    deviceSizes: [640, 750, 828, 1080, 1200],
    qualities: [50, 80],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/en/(.*)",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default config;
