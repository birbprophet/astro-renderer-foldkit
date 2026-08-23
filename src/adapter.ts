import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Predicate from "effect/Predicate";
import * as Schema from "effect/Schema";
import { renderToString } from "foldkit/experimental/server";
import type { RenderError } from "foldkit/experimental/server";
import type { Html, HtmlBuilder } from "foldkit/html";

/**
 * The one module in this repository that imports `foldkit/experimental/server`.
 *
 * ⚠️ THE IMPORT ABOVE IS THE WHOLE POINT OF THIS FILE, AND NOTHING ELSE MAY
 * REPEAT IT. The server surface is marked `@experimental` by its author and it
 * took a breaking change between `0.147.0` and `0.148.0` — two versions
 * published a day apart. `tests/adapter.test.ts` walks the tracked tree and
 * fails if a second file names that path, so the next breaking release is one
 * file to fix rather than a landing-wide migration. Founder ruling, 2026-08-19,
 * under the pinned-pre-release bargain in [R26-113].
 *
 * The pin `foldkit@0.149.0` is exact in this package's manifest. That matters
 * beyond version hygiene: FoldKit's render frame is module-local, so a view
 * built by a second instance of the library renders nothing.
 */

/** A Foldkit view rendered as one Astro component: props in, vnodes out. */
export type FoldkitView<Props, Message> = (props: Props, h: HtmlBuilder<Message>) => Html;

/**
 * The marker an Astro renderer recognises a Foldkit component by.
 *
 * `Symbol.for` rather than `Symbol()` because the registry is global: a page and
 * the renderer that draws it may load this module through different specifiers,
 * and two private symbols would not compare equal.
 */
const FOLDKIT_COMPONENT: unique symbol = Symbol.for("siglata/foldkit-astro/component");

/** Why a component did not draw: its props were refused, or the render failed. */
export class ComponentRenderFailed extends Data.TaggedError("ComponentRenderFailed")<{
  readonly component: string;
  readonly cause: Schema.SchemaError | RenderError;
}> {}

/**
 * One Foldkit component as Astro sees it. The type parameters are gone by
 * construction — `render` closes over the view and its Props codec — so the
 * renderer holds no generics and needs no cast at the boundary.
 */
export type FoldkitComponent = Readonly<{
  [FOLDKIT_COMPONENT]: true;
  name: string;
  render: (props: unknown) => Effect.Effect<string, ComponentRenderFailed>;
}>;

/**
 * Renders one view to markup through the experimental server surface.
 *
 * `isHydratable: false` is the default this package ships on purpose. It drops
 * the `data-foldkit-app` root stamp and the Flags payload script, so the output
 * is markup and nothing else: no script, no inline handler, no client branch.
 * A `<button>` carrying an `OnClick` arrives as a bare `<button>` — the handler
 * lives in the vnode and never reaches the HTML — which makes a component whose
 * job is to look right correct here and a component whose job is to act inert.
 */
const renderStatic = <Props, Message>(
  view: FoldkitView<Props, Message>,
  props: Props,
): Effect.Effect<string, RenderError> =>
  Effect.map(
    renderToString(
      {
        init: () => [props, []] as const,
        view: (model: Props, h: HtmlBuilder<Message>) => ({ body: view(model, h), title: "" }),
      },
      { isHydratable: false },
    ),
    (rendered) => rendered.html,
  );

/**
 * Declares a Foldkit view as an Astro component.
 *
 * Props cross the Astro boundary as plain data with no type the compiler can
 * hold, so `Props` decodes them. A page that passes the wrong shape fails the
 * build naming the component rather than drawing a page with a hole in it.
 */
export const foldkitComponent = <Props, Message>(
  definition: Readonly<{
    name: string;
    Props: Schema.Codec<Props, unknown, never>;
    view: FoldkitView<Props, Message>;
  }>,
): FoldkitComponent => ({
  [FOLDKIT_COMPONENT]: true,
  name: definition.name,
  render: (props) =>
    Effect.mapError(
      Effect.flatMap(Schema.decodeUnknownEffect(definition.Props)(props), (decoded) =>
        renderStatic(definition.view, decoded),
      ),
      (cause) => new ComponentRenderFailed({ cause, component: definition.name }),
    ),
});

/** Whether Astro handed this renderer a component it owns. */
export const isFoldkitComponent = (candidate: unknown): candidate is FoldkitComponent =>
  Predicate.hasProperty(candidate, FOLDKIT_COMPONENT);
