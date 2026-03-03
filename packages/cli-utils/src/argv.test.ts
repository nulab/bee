import { afterEach, describe, expect, it } from "vitest";
import { extractGlobalArgs, isNoInput } from "#/argv.js";

describe("extractGlobalArgs", () => {
  it("extracts space with --space value format", () => {
    const result = extractGlobalArgs(["--space", "example.backlog.com", "issue", "list"]);
    expect(result.space).toBe("example.backlog.com");
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("extracts space with --space=value format", () => {
    const result = extractGlobalArgs(["--space=example.backlog.com", "issue", "list"]);
    expect(result.space).toBe("example.backlog.com");
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("returns undefined when --space is not provided", () => {
    const result = extractGlobalArgs(["issue", "list", "--project", "PROJ"]);
    expect(result.space).toBeUndefined();
    expect(result.argv).toEqual(["issue", "list", "--project", "PROJ"]);
  });

  it("returns undefined and empty array for empty argv", () => {
    const result = extractGlobalArgs([]);
    expect(result.space).toBeUndefined();
    expect(result.noInput).toBeFalsy();
    expect(result.argv).toEqual([]);
  });

  it("uses the last value when multiple --space flags are provided", () => {
    const result = extractGlobalArgs([
      "--space",
      "first.backlog.com",
      "--space",
      "last.backlog.com",
    ]);
    expect(result.space).toBe("last.backlog.com");
    expect(result.argv).toEqual([]);
  });

  it("returns undefined when --space is at the end of argv without a value", () => {
    const result = extractGlobalArgs(["issue", "list", "--space"]);
    expect(result.space).toBeUndefined();
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("preserves the order of other arguments", () => {
    const result = extractGlobalArgs([
      "issue",
      "--space",
      "example.backlog.com",
      "create",
      "--project",
      "PROJ",
      "--title",
      "test",
    ]);
    expect(result.space).toBe("example.backlog.com");
    expect(result.argv).toEqual(["issue", "create", "--project", "PROJ", "--title", "test"]);
  });

  it("returns empty string when --space= is specified with empty value", () => {
    const result = extractGlobalArgs(["--space=", "issue", "list"]);
    expect(result.space).toBe("");
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("extracts --no-input and sets noInput to true", () => {
    const result = extractGlobalArgs(["--no-input", "issue", "list"]);
    expect(result.noInput).toBeTruthy();
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("sets noInput to false when --no-input is absent", () => {
    const result = extractGlobalArgs(["issue", "list"]);
    expect(result.noInput).toBeFalsy();
  });

  it("extracts both --space and --no-input simultaneously", () => {
    const result = extractGlobalArgs([
      "--space",
      "example.backlog.com",
      "--no-input",
      "issue",
      "create",
    ]);
    expect(result.space).toBe("example.backlog.com");
    expect(result.noInput).toBeTruthy();
    expect(result.argv).toEqual(["issue", "create"]);
  });
});

describe("isNoInput", () => {
  afterEach(() => {
    delete process.env.BACKLOG_NO_INPUT;
  });

  it("returns true when BACKLOG_NO_INPUT is '1'", () => {
    process.env.BACKLOG_NO_INPUT = "1";
    expect(isNoInput()).toBeTruthy();
  });

  it("returns false when BACKLOG_NO_INPUT is not set", () => {
    delete process.env.BACKLOG_NO_INPUT;
    expect(isNoInput()).toBeFalsy();
  });

  it("returns false when BACKLOG_NO_INPUT is '0'", () => {
    process.env.BACKLOG_NO_INPUT = "0";
    expect(isNoInput()).toBeFalsy();
  });
});
