import * as Effect from "effect/Effect";
import type { NamedSSRLoadedRendererValue } from "astro";

import { isFoldkitComponent } from "./adapter.ts";

/**
 * The Astro server entrypoint: `check` claims the components this package owns,
 * `renderToStaticMarkup` draws one.
 *
 * ⚠️ `check` MATCHES ON THE MARKER AND NOTHING ELSE. Astro asks every
 * registered renderer in turn until one says yes, so a predicate that guessed
 * from shape — "a function, so probably ours" — would claim another framework's
 * components and render them as an empty page. The marker is set only by
 * `foldkitComponent`.
 *
 * There is no client entrypoint. Server-only is what this package is for: the
 * landing's whole value is that it needs no JavaScript, and a renderer that
 * cannot hydrate cannot accidentally start. Hydration is a later decision with
 * its own risk, and it needs a client entrypoint plus `isHydratable` back on.
 */
const renderer: NamedSSRLoadedRendererValue = {
  check: (Component: unknown) => Promise.resolve(isFoldkitComponent(Component)),
  name: "foldkit",
  renderToStaticMarkup: async (
    Component: unknown,
    props: unknown,
    slots: Record<string, string>,
  ) => {
    if (!isFoldkitComponent(Component)) {
      throw new Error("[foldkit-astro] renderToStaticMarkup was called for another renderer.");
    }
    const filled = Object.keys(slots).filter((slot) => slots[slot] !== "");
    if (filled.length > 0) {
      throw new Error(
        `[foldkit-astro] <${Component.name}> was given children (${filled.join(", ")}). ` +
          "A Foldkit view draws from its props; this renderer has no slot support and " +
          "would drop them silently.",
      );
    }
    return { html: await Effect.runPromise(Component.render(props)) };
  },
};

export default renderer;
