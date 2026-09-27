import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Turbopack scoped to upright/ — not the parent coding/ folder with dozens of repos.
  turbopack: {
    root: projectRoot,
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/items", permanent: false },
      { source: "/inventory", destination: "/items/inventory", permanent: false },
    ];
  },
};

export default nextConfig;
