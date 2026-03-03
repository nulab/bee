import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { filterFields, outputResult, pickFields } from "#/output.js";

describe("pickFields", () => {
  it("指定フィールドを抽出する", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pickFields(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });

  it("存在しないフィールドを無視する", () => {
    const obj = { a: 1, b: 2 };
    expect(pickFields(obj, ["a", "x"])).toEqual({ a: 1 });
  });

  it("ネストされたオブジェクトのフィールドをそのまま保持する", () => {
    const obj = { name: "test", nested: { id: 1, value: "v" } };
    expect(pickFields(obj, ["nested"])).toEqual({ nested: { id: 1, value: "v" } });
  });

  it("非オブジェクトに対して空オブジェクトを返す", () => {
    expect(pickFields(null, ["a"])).toEqual({});
    expect(pickFields(42, ["a"])).toEqual({});
    expect(pickFields("str", ["a"])).toEqual({});
  });
});

describe("filterFields", () => {
  it("オブジェクトから指定フィールドを抽出する", () => {
    const data = { id: 1, name: "test", extra: true };
    expect(filterFields(data, ["id", "name"])).toEqual({ id: 1, name: "test" });
  });

  it("配列の各要素から指定フィールドを抽出する", () => {
    const data = [
      { id: 1, name: "a", extra: true },
      { id: 2, name: "b", extra: false },
    ];
    expect(filterFields(data, ["id", "name"])).toEqual([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ]);
  });

  it("空配列をそのまま返す", () => {
    expect(filterFields([], ["id"])).toEqual([]);
  });
});

describe("outputResult", () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    originalIsTTY = process.stdout.isTTY;
  });

  afterEach(() => {
    writeSpy.mockRestore();
    Object.defineProperty(process.stdout, "isTTY", { value: originalIsTTY, writable: true });
  });

  it("--json なしの場合 defaultFormat を呼ぶ", () => {
    const format = vi.fn();
    const data = [{ id: 1 }];

    outputResult(data, {}, format);

    expect(format).toHaveBeenCalledWith(data);
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("--json (空文字) で全フィールドを JSON 出力する", () => {
    const format = vi.fn();
    const data = [{ id: 1, name: "test" }];
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult(data, { json: "" }, format);

    expect(format).not.toHaveBeenCalled();
    expect(writeSpy).toHaveBeenCalledWith('[{"id":1,"name":"test"}]\n');
  });

  it("--json field1,field2 で指定フィールドのみ出力する", () => {
    const format = vi.fn();
    const data = [{ id: 1, name: "test", extra: true }];
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult(data, { json: "id,name" }, format);

    expect(writeSpy).toHaveBeenCalledWith('[{"id":1,"name":"test"}]\n');
  });

  it("空配列を [] として JSON 出力する", () => {
    const format = vi.fn();
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult([], { json: "" }, format);

    expect(writeSpy).toHaveBeenCalledWith("[]\n");
  });

  it("TTY 接続時に pretty-print する", () => {
    const format = vi.fn();
    const data = { id: 1 };
    Object.defineProperty(process.stdout, "isTTY", { value: true, writable: true });

    outputResult(data, { json: "" }, format);

    expect(writeSpy).toHaveBeenCalledWith('{\n  "id": 1\n}\n');
  });

  it("非 TTY 時に compact 出力する", () => {
    const format = vi.fn();
    const data = { id: 1 };
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult(data, { json: "" }, format);

    expect(writeSpy).toHaveBeenCalledWith('{"id":1}\n');
  });

  it("単一オブジェクトのフィールドフィルタリング", () => {
    const format = vi.fn();
    const data = { id: 1, name: "test", secret: "hidden" };
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult(data, { json: "id, name" }, format);

    expect(writeSpy).toHaveBeenCalledWith('{"id":1,"name":"test"}\n');
  });
});
