import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import consola from "consola";
import { printDefinitionList } from "./definition-list";

describe("printDefinitionList", () => {
  const logSpy = vi.spyOn(consola, "log").mockImplementation(() => {});

  beforeEach(() => {
    logSpy.mockClear();
  });

  afterEach(() => {
    logSpy.mockClear();
  });

  it("prints labels padded to the longest label width", () => {
    printDefinitionList([
      ["Status", "Active"],
      ["Text Formatting", "markdown"],
    ]);

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenCalledWith("    Status           Active");
    expect(logSpy).toHaveBeenCalledWith("    Text Formatting  markdown");
  });

  it("skips items with null or undefined values", () => {
    printDefinitionList([
      ["Status", "Active"],
      ["Assignee", null],
      ["Priority", undefined],
      ["Type", "Bug"],
    ]);

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenCalledWith("    Status  Active");
    expect(logSpy).toHaveBeenCalledWith("    Type    Bug");
  });

  it("skips items with empty string values", () => {
    printDefinitionList([
      ["Status", "Active"],
      ["Note", ""],
    ]);

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith("    Status  Active");
  });

  it("does nothing when all items are filtered out", () => {
    printDefinitionList([
      ["A", null],
      ["B", undefined],
    ]);

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("does nothing for empty array", () => {
    printDefinitionList([]);

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("respects custom indent", () => {
    printDefinitionList([["Name", "Test"]], 2);

    expect(logSpy).toHaveBeenCalledWith("  Name  Test");
  });
});
