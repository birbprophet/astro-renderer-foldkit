# astro-renderer-foldkit

A server-only [Astro](https://astro.build/) renderer for [FoldKit](https://github.com/siglata/foldkit) views. It validates Astro props with Effect Schema, renders the view through FoldKit's server surface, and returns static markup through Astro's SSR renderer hook.

## Targets

- Astro `7.2.7`
- FoldKit `0.153.0`
- Effect `4.0.0-rc.112`

The versions are exact pins. FoldKit's experimental server import is isolated in `src/adapter.ts`, so its compatibility boundary is one file and its behavior is covered by the adapter tests.

## Install from Git

This package is intentionally not published to npm. It exports its TypeScript source for direct
use by Vite and Astro. Install a known repository commit instead of a moving branch:

```sh
npm install github:birbprophet/astro-renderer-foldkit#<reviewed-commit>
```

When upgrading, choose and review a new commit explicitly.

## Use

Register the renderer in Astro and declare FoldKit views with an Effect Schema codec:

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { foldkitRenderer } from "astro-renderer-foldkit";

export default defineConfig({
  integrations: [foldkitRenderer()],
});
```

```ts
import * as S from "effect/Schema";
import { foldkitComponent } from "astro-renderer-foldkit";

const Greeting = foldkitComponent({
  Props: S.Struct({ name: S.String }),
  name: "Greeting",
  view: (props, h) => h.p([], [`Hello, ${props.name}!`]),
});
```

Use `Greeting` from an Astro page like any other registered server component.

## Limits

- This is server-only and deliberately non-hydratable. There is no client entrypoint, generated script, hydration stamp, or inline event handler.
- A FoldKit `OnClick` is rendered as a bare element such as `<button>`; the handler remains in the view graph and does not become browser behavior. Use a client renderer when interaction is required.
- Slots are not supported. Passing non-empty Astro children throws instead of silently dropping them.
- Props must decode through the component's Effect Schema codec. Invalid props and FoldKit render failures reject the Astro render with the component name.
- The renderer targets the exact Astro and FoldKit versions above and keeps the experimental FoldKit server API behind the adapter.

The static constraints follow the server-rendering proof used for this package: FoldKit renders without a DOM or window, and a button carrying `OnClick` serializes as a bare button.

## Development

```sh
bun install
bun run test
bun run check
bun run build
```

The single CI workflow runs these checks on `depot-ubuntu-24.04`.
