import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vite-plus/test";

/**
 * The end-to-end proof: `astro build` over `fixture/`, then the HTML it wrote.
 *
 * The component is the console's Workforce screen, imported from
 * `apps/app/src/robots-surface.ts` unchanged. What this file is for is the
 * constraint the landing is held to — the page renders completely with
 * JavaScript disabled — so the assertions are about what is in the document and
 * what is absent from it, rather than about the renderer's internals.
 */

const fixture = fileURLToPath(new URL("../fixture", import.meta.url));
const built = new URL("../fixture/dist/index.html", import.meta.url);
/** By path rather than by name: the test must not depend on who set PATH. */
const astro = fileURLToPath(new URL("../node_modules/.bin/astro", import.meta.url));

let html = "";

beforeAll(() => {
  execFileSync(astro, ["build"], {
    cwd: fixture,
    encoding: "utf-8",
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
  });
  html = readFileSync(built, "utf-8");
}, 180_000);

describe("the built page", () => {
  it("carries the component's markup", () => {
    expect(html).toContain(
      '<section aria-labelledby="robots-title" class="page-heading hybrid-robots-page">',
    );
    expect(html).toContain('<h1 class="hybrid-title" id="robots-title">Workforce</h1>');
  });

  it("draws every branch the model asked for", () => {
    expect(html).toContain(">Supplier ledger</span>");
    expect(html).toContain("Column `net_total` arrived empty on 14 rows.");
    expect(html).toContain(">has not run yet</span>");
  });

  it("contains no script at all, so no script is attributable to the component", () => {
    expect(html).not.toMatch(/<script/iu);
  });

  it("carries no hydration contract and no inline handler", () => {
    expect(html).not.toContain("data-foldkit-app");
    expect(html).not.toContain("data-foldkit-flags");
    expect(html).not.toMatch(/\son[a-z]+=/iu);
  });

  it("leaves no astro island element behind", () => {
    expect(html).not.toContain("astro-island");
    expect(html).not.toContain("astro-static-slot");
  });
});
