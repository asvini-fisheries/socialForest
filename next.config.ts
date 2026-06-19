import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Explicit root — fixes Turbopack when nested inside another folder (e.g. payoutstand-dashboard) */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
