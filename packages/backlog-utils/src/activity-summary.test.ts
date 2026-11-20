import { type Entity } from "backlog-js";
import { describe, expect, it } from "vite-plus/test";
import { getActivitySummary } from "./activity-summary";

type ActivityContent = Entity.Activity.Activity["content"];

const summarize = (type: number, content: unknown) =>
  getActivitySummary({ type, content: content as ActivityContent });

describe("getActivitySummary", () => {
  it("summarizes a document activity by the document title", () => {
    expect(summarize(36, { id: "doc-1", title: "Release notes" })).toBe("Release notes");
  });

  it("summarizes a bulk document activity by every document title", () => {
    expect(
      summarize(48, {
        documents: [
          { id: "doc-1", title: "Spec" },
          { id: "doc-2", title: "FAQ" },
        ],
      }),
    ).toBe("Spec, FAQ");
  });

  it("prefers the issue summary over any other field", () => {
    expect(summarize(1, { id: 1, key_id: 5, summary: "Fix login" })).toBe("Fix login");
  });
});
