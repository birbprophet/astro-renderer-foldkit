import * as S from "effect/Schema";
import type { Html, HtmlBuilder } from "foldkit/html";

import { foldkitComponent } from "../../../src/index.ts";
import type { FoldkitComponent } from "../../../src/index.ts";

const Robot = S.Struct({
  feedName: S.String,
  lastRefusalReason: S.NullOr(S.String),
  lastRunId: S.NullOr(S.String),
});

const WorkforceProps = S.Struct({
  locale: S.String,
  robots: S.Struct({
    _tag: S.Literal("Success"),
    data: S.Array(Robot),
  }),
});

type WorkforceModel = typeof WorkforceProps.Type;
type Node = Html;

const robotStatus = (
  h: HtmlBuilder<never>,
  robot: WorkforceModel["robots"]["data"][number],
): Node =>
  robot.lastRunId === null
    ? h.span([h.Class("hybrid-status hybrid-status-neutral")], ["has not run yet"])
    : robot.lastRefusalReason === null
      ? h.span([h.Class("hybrid-status hybrid-status-success")], ["has run successfully"])
      : h.div(
          [h.Class("hybrid-robot-outcome")],
          [
            h.span([h.Class("hybrid-status hybrid-status-refused")], ["refused"]),
            h.p([h.Class("hybrid-robot-reason")], [robot.lastRefusalReason]),
          ],
        );

const robotScreen = (model: WorkforceModel, h: HtmlBuilder<never>): Node =>
  h.section(
    [h.Class("page-heading hybrid-robots-page"), h.AriaLabelledBy("robots-title")],
    [
      h.header(
        [h.Class("listing-toolbar hybrid-surface-header")],
        [
          h.h1([h.Class("hybrid-title"), h.Id("robots-title")], ["Workforce"]),
          h.p([h.Class("hybrid-description")], ["The current robot workforce."]),
        ],
      ),
      h.div(
        [h.Class("listing robots-table-wrap hybrid-table-wrap")],
        [
          h.ul(
            [h.Class("robots hybrid-table hybrid-robots-table")],
            model.robots.data.map((robot) =>
              h.li(
                [h.Class("robot hybrid-table-row")],
                [
                  h.span([h.Class("robot-name hybrid-table-cell")], [robot.feedName]),
                  h.span([h.Class("robot-outcome hybrid-table-cell")], [robotStatus(h, robot)]),
                ],
              ),
            ),
          ),
        ],
      ),
    ],
  );

/** A self-contained proof component so the package fixture has no workspace dependency. */
const workforce: FoldkitComponent = foldkitComponent({
  Props: WorkforceProps,
  name: "robotScreen",
  view: robotScreen,
});

export default workforce;
