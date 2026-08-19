import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

export { foldkitComponent } from "./adapter.ts";
export type { FoldkitComponent, FoldkitView } from "./adapter.ts";

/**
 * Registers the Foldkit renderer with an Astro project.
 *
 * Astro keeps routing, content, the sitemap and the build; Foldkit components
 * render inside it. Add it to `integrations` and any component declared with
 * `foldkitComponent` draws in a page.
 *
 * ⚠️ THE ENTRYPOINT IS AN ABSOLUTE PATH RATHER THAN THE PACKAGE'S OWN NAME.
 * Astro writes `import _renderer0 from <serverEntrypoint>` into a virtual
 * module that Vite resolves from the consuming project's root, so a bare
 * specifier resolves only for a consumer that declares this package as a
 * dependency — which the fixture in `fixture/` deliberately is not. Resolving
 * from `import.meta.url` works for both and needs no exports subpath.
 */
export const foldkitRenderer = (): AstroIntegration => ({
  hooks: {
    "astro:config:setup": ({ addRenderer }) => {
      addRenderer({
        name: "foldkit",
        serverEntrypoint: fileURLToPath(new URL("renderer.ts", import.meta.url)),
      });
    },
  },
  name: "foldkit",
});
