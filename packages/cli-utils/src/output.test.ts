import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { filterFields, outputResult, pickFields } from "./output";

describe("pickFields", () => {
  it("picks specified fields from an object", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pickFields(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });

  it("ignores non-existent fields", () => {
    const obj = { a: 1, b: 2 };
    expect(pickFields(obj, ["a", "x"])).toEqual({ a: 1 });
  });

  it("preserves nested object fields as-is", () => {
    const obj = { name: "test", nested: { id: 1, value: "v" } };
    expect(pickFields(obj, ["nested"])).toEqual({ nested: { id: 1, value: "v" } });
  });

  it("returns empty object for non-object values", () => {
    expect(pickFields(null, ["a"])).toEqual({});
    expect(pickFields(42, ["a"])).toEqual({});
    expect(pickFields("str", ["a"])).toEqual({});
  });
});

describe("filterFields", () => {
  it("filters specified fields from an object", () => {
    const data = { id: 1, name: "test", extra: true };
    expect(filterFields(data, ["id", "name"])).toEqual({ id: 1, name: "test" });
  });

  it("filters specified fields from each element in an array", () => {
    const data = [
      { id: 1, name: "a", extra: true },
      { id: 2, name: "b", extra: false },
    ];
    expect(filterFields(data, ["id", "name"])).toEqual([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ]);
  });

  it("returns empty array as-is", () => {
    expect(filterFields([], ["id"])).toEqual([]);
  });
});

describe("outputResult", () => {
  let writeSpy: MockInstance;
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    originalIsTTY = process.stdout.isTTY;
  });

  afterEach(() => {
    writeSpy.mockRestore();
    Object.defineProperty(process.stdout, "isTTY", { value: originalIsTTY, writable: true });
  });

  it("calls defaultFormat when --json is not specified", () => {
    const format = vi.fn();
    const data = [{ id: 1 }];

    outputResult(data, {}, format);

    expect(format).toHaveBeenCalledWith(data);
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("outputs all fields as JSON when --json is empty string", () => {
    const format = vi.fn();
    const data = [{ id: 1, name: "test" }];
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult(data, { json: "" }, format);

    expect(format).not.toHaveBeenCalled();
    expect(writeSpy).toHaveBeenCalledWith('[{"id":1,"name":"test"}]\n');
  });

  it("outputs only specified fields with --json field1,field2", () => {
    const format = vi.fn();
    const data = [{ id: 1, name: "test", extra: true }];
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult(data, { json: "id,name" }, format);

    expect(writeSpy).toHaveBeenCalledWith('[{"id":1,"name":"test"}]\n');
  });

  it("outputs empty array as [] in JSON", () => {
    const format = vi.fn();
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult([], { json: "" }, format);

    expect(writeSpy).toHaveBeenCalledWith("[]\n");
  });

  it("pretty-prints JSON when connected to TTY", () => {
    const format = vi.fn();
    const data = { id: 1 };
    Object.defineProperty(process.stdout, "isTTY", { value: true, writable: true });

    outputResult(data, { json: "" }, format);

    expect(writeSpy).toHaveBeenCalledWith('{\n  "id": 1\n}\n');
  });

  it("outputs compact JSON when not connected to TTY", () => {
    const format = vi.fn();
    const data = { id: 1 };
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult(data, { json: "" }, format);

    expect(writeSpy).toHaveBeenCalledWith('{"id":1}\n');
  });

  it("filters fields from a single object", () => {
    const format = vi.fn();
    const data = { id: 1, name: "test", secret: "hidden" };
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult(data, { json: "id, name" }, format);

    expect(writeSpy).toHaveBeenCalledWith('{"id":1,"name":"test"}\n');
  });

  it("handles null data", () => {
    const format = vi.fn();
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult(null, { json: "" }, format);

    expect(writeSpy).toHaveBeenCalledWith("null\n");
  });

  it("handles undefined data", () => {
    const format = vi.fn();
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult(undefined, { json: "" }, format);

    expect(writeSpy).toHaveBeenCalled();
  });

  it("handles --json with non-existent field names", () => {
    const format = vi.fn();
    const data = { id: 1 };
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult(data, { json: "nonexistent" }, format);

    expect(writeSpy).toHaveBeenCalledWith("{}\n");
  });

  it("handles --json with spaces around field names", () => {
    const format = vi.fn();
    const data = { id: 1, name: "test" };
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });

    outputResult(data, { json: "id , name" }, format);

    expect(writeSpy).toHaveBeenCalledWith('{"id":1,"name":"test"}\n');
  });
});
