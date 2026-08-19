import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as Effect from "effect/Effect";
import * as Result from "effect/Result";
import * as S from "effect/Schema";
import type { Html, HtmlBuilder } from "foldkit/html";
import { m } from "foldkit/message";
import { describe, expect, it } from "vite-plus/test";

import { foldkitComponent, isFoldkitComponent } from "../src/adapter.ts";

/**
 * The half of R26-113's bargain that an exact pin does not cover.
 *
 * `foldkit/experimental/server` is marked `@experimental` by its author and took
 * a breaking change between `0.147.0` and `0.148.0`, one day apart. The ruling
 * permits the pin because the surface is adapter-isolated and conformance-passed;
 * this file is both halves of that sentence. The first case walks the tracked
 * tree and fails if a second module imports the experimental path. The rest
 * assert what `0.147.0` actually does, so a version bump that changes it fails
 * here rather than in a rendered page.
 */

const repoRoot = new URL("../", import.meta.url);

/** The pinned version, exact. A range would defeat the whole arrangement. */
const PINNED = "0.147.0";

const Pressed = m("Pressed");
type Message = ReturnType<typeof Pressed>;

const Props = S.Struct({ label: S.String });

const button = foldkitComponent({
  Props,
  name: "button",
  view: (props: typeof Props.Type, h: HtmlBuilder<Message>): Html =>
    h.button([h.Class("story-action"), h.OnClick(Pressed())], [props.label]),
});

const drawn = (props: unknown): Promise<Result.Result<string, unknown>> =>
  Effect.runPromise(Effect.result(button.render(props)));

describe("the experimental surface stays behind one module", () => {
  it("is imported by src/adapter.ts and nothing else", () => {
    const found = execFileSync(
      "git",
      [
        "grep",
        "-l",
        "--fixed-strings",
        "--untracked",
        "foldkit/experimental/server",
        "--",
        "*.ts",
        "*.tsx",
        "*.astro",
        "*.js",
        "*.mjs",
      ],
      { cwd: repoRoot, encoding: "utf-8" },
    )
      .split("\n")
      .filter((line) => line !== "");

    expect(found.toSorted()).toStrictEqual(["src/adapter.ts", "tests/adapter.test.ts"]);
  });

  it("pins foldkit exactly, and to the version this package was proven against", () => {
    const manifest: unknown = JSON.parse(readFileSync(new URL("package.json", repoRoot), "utf-8"));
    const installed: unknown = JSON.parse(
      readFileSync(new URL("node_modules/foldkit/package.json", repoRoot), "utf-8"),
    );

    expect(manifest).toMatchObject({ dependencies: { foldkit: PINNED } });
    expect(installed).toMatchObject({ version: PINNED });
  });
});

describe("what foldkit 0.147.0 renders, and what it leaves out", () => {
  it("draws a button carrying an OnClick as a bare button", async () => {
    const outcome = await drawn({ label: "Send file" });

    expect(Result.getOrElse(outcome, () => "")).toBe(
      '<button class="story-action">Send file</button>',
    );
  });

  it("injects no script and no hydration stamp", async () => {
    const html = Result.getOrElse(await drawn({ label: "Send file" }), () => "");

    expect(html).not.toMatch(/<script/iu);
    expect(html).not.toContain("data-foldkit-app");
    expect(html).not.toContain("data-foldkit-flags");
  });

  it("refuses props the component's codec does not accept, naming the component", async () => {
    const outcome = await drawn({ label: 7 });

    expect(Result.isFailure(outcome)).toBe(true);
    expect(outcome).toMatchObject({
      failure: { _tag: "ComponentRenderFailed", component: "button" },
    });
  });
});

describe("the renderer claims only its own components", () => {
  it("recognises a declared component", () => {
    expect(isFoldkitComponent(button)).toBe(true);
  });

  it("declines anything else Astro might hand it", () => {
    const candidates = [() => "a react component", { render: () => "" }, "div", null, undefined];

    expect(candidates.filter((candidate) => isFoldkitComponent(candidate))).toStrictEqual([]);
  });
});
