import { describe, expect, it, vi } from "vitest";
import consola from "consola";
import { printDefinitionList } from "./definition-list";

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("printDefinitionList", () => {
  it("prints labels padded to the longest label width", () => {
    printDefinitionList([
      ["Status", "Active"],
      ["Text Formatting", "markdown"],
    ]);

    expect(consola.log).toHaveBeenCalledTimes(2);
    expect(consola.log).toHaveBeenCalledWith("    Status           Active");
    expect(consola.log).toHaveBeenCalledWith("    Text Formatting  markdown");
  });

  it("skips items with null or undefined values", () => {
    printDefinitionList([
      ["Status", "Active"],
      ["Assignee", null],
      ["Priority", undefined],
      ["Type", "Bug"],
    ]);

    expect(consola.log).toHaveBeenCalledTimes(2);
    expect(consola.log).toHaveBeenCalledWith("    Status  Active");
    expect(consola.log).toHaveBeenCalledWith("    Type    Bug");
  });

  it("skips items with empty string values", () => {
    printDefinitionList([
      ["Status", "Active"],
      ["Note", ""],
    ]);

    expect(consola.log).toHaveBeenCalledTimes(1);
    expect(consola.log).toHaveBeenCalledWith("    Status  Active");
  });

  it("does nothing when all items are filtered out", () => {
    printDefinitionList([
      ["A", null],
      ["B", undefined],
    ]);

    expect(consola.log).not.toHaveBeenCalled();
  });

  it("does nothing for empty array", () => {
    printDefinitionList([]);

    expect(consola.log).not.toHaveBeenCalled();
  });

  it("respects custom indent", () => {
    printDefinitionList([["Name", "Test"]], 2);

    expect(consola.log).toHaveBeenCalledWith("  Name  Test");
  });
});
