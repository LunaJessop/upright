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
      // Main: legacy URLs.
      { source: "/dashboard", destination: "/items", permanent: false },
      { source: "/inventory", destination: "/items/inventory", permanent: false },
      // Style-Changes: inventory page folded into the items catalog.
      {
        source: "/items/inventory",
        destination: "/items",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
