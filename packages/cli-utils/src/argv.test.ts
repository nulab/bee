import { afterEach, describe, expect, it } from "vitest";
import { extractGlobalArgs, isNoInput } from "#/argv.js";

describe("extractGlobalArgs", () => {
  it("--space value 形式でスペースを抽出する", () => {
    const result = extractGlobalArgs(["--space", "example.backlog.com", "issue", "list"]);
    expect(result.space).toBe("example.backlog.com");
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("--space=value 形式でスペースを抽出する", () => {
    const result = extractGlobalArgs(["--space=example.backlog.com", "issue", "list"]);
    expect(result.space).toBe("example.backlog.com");
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("-s value 形式でスペースを抽出する", () => {
    const result = extractGlobalArgs(["-s", "example.backlog.com", "issue", "list"]);
    expect(result.space).toBe("example.backlog.com");
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("-s=value 形式でスペースを抽出する", () => {
    const result = extractGlobalArgs(["-s=example.backlog.com", "issue", "list"]);
    expect(result.space).toBe("example.backlog.com");
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("--space がない場合は undefined を返す", () => {
    const result = extractGlobalArgs(["issue", "list", "--project", "PROJ"]);
    expect(result.space).toBeUndefined();
    expect(result.argv).toEqual(["issue", "list", "--project", "PROJ"]);
  });

  it("空の argv を渡すと undefined と空配列を返す", () => {
    const result = extractGlobalArgs([]);
    expect(result.space).toBeUndefined();
    expect(result.noInput).toBeFalsy();
    expect(result.argv).toEqual([]);
  });

  it("複数の --space が指定された場合は最後の値が優先される", () => {
    const result = extractGlobalArgs([
      "--space",
      "first.backlog.com",
      "--space",
      "last.backlog.com",
    ]);
    expect(result.space).toBe("last.backlog.com");
    expect(result.argv).toEqual([]);
  });

  it("--space が argv の末尾にあり値がない場合は undefined を返す", () => {
    const result = extractGlobalArgs(["issue", "list", "--space"]);
    expect(result.space).toBeUndefined();
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("-s が argv の末尾にあり値がない場合は undefined を返す", () => {
    const result = extractGlobalArgs(["issue", "list", "-s"]);
    expect(result.space).toBeUndefined();
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("他の引数の順序を保持する", () => {
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

  it("--space と -s が混在する場合は最後の値が優先される", () => {
    const result = extractGlobalArgs(["--space", "first.backlog.com", "-s", "last.backlog.com"]);
    expect(result.space).toBe("last.backlog.com");
    expect(result.argv).toEqual([]);
  });

  it("--space= で空文字列を指定すると空文字列を返す", () => {
    const result = extractGlobalArgs(["--space=", "issue", "list"]);
    expect(result.space).toBe("");
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("--no-input を抽出して noInput を true にする", () => {
    const result = extractGlobalArgs(["--no-input", "issue", "list"]);
    expect(result.noInput).toBeTruthy();
    expect(result.argv).toEqual(["issue", "list"]);
  });

  it("--no-input がない場合は noInput が false になる", () => {
    const result = extractGlobalArgs(["issue", "list"]);
    expect(result.noInput).toBeFalsy();
  });

  it("--space と --no-input を同時に抽出する", () => {
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
    delete process.env["BACKLOG_NO_INPUT"];
  });

  it("BACKLOG_NO_INPUT が '1' のとき true を返す", () => {
    process.env["BACKLOG_NO_INPUT"] = "1";
    expect(isNoInput()).toBeTruthy();
  });

  it("BACKLOG_NO_INPUT が未設定のとき false を返す", () => {
    delete process.env["BACKLOG_NO_INPUT"];
    expect(isNoInput()).toBeFalsy();
  });

  it("BACKLOG_NO_INPUT が '0' のとき false を返す", () => {
    process.env["BACKLOG_NO_INPUT"] = "0";
    expect(isNoInput()).toBeFalsy();
  });
});
