import { defineConfig } from "astro/config";

import { foldkitRenderer } from "../src/index.ts";

/**
 * The proof project. `tests/build.test.ts` runs `astro build` over it and reads
 * the HTML that comes out.
 *
 * It is a fixture rather than a page on `apps/landing` on purpose: the founder's
 * ruling adds the capability and proves it on one component, and migrating the
 * landing is a separate decision. `tools/check-landing-build.ts` holds the
 * marketing site to an exact set of fifteen documents, and a proof page would
 * have had to join that set to exist.
 */
export default defineConfig({
  integrations: [foldkitRenderer()],
  outDir: "./dist",
  output: "static",
  trailingSlash: "always",
});
