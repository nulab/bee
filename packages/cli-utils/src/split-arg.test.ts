import { describe, expect, it } from "vitest";
import * as v from "valibot";
import { splitArg } from "./split-arg";

describe("splitArg", () => {
  it("returns empty array when input is undefined", () => {
    expect(splitArg(undefined, v.string())).toEqual([]);
  });

  it("splits comma-separated string values with a string schema", () => {
    expect(splitArg("a,b,c", v.string())).toEqual(["a", "b", "c"]);
  });

  it("trims whitespace from each element", () => {
    expect(splitArg(" a , b , c ", v.string())).toEqual(["a", "b", "c"]);
  });

  it("drops empty strings after splitting", () => {
    expect(splitArg("a,,b,", v.string())).toEqual(["a", "b"]);
  });

  it("validates each element against a picklist and drops invalid values", () => {
    const schema = v.picklist(["open", "closed", "all"]);
    expect(splitArg("open,invalid,closed", schema)).toEqual(["open", "closed"]);
  });

  it("returns empty array when all values are invalid for picklist", () => {
    const schema = v.picklist(["open", "closed"]);
    expect(splitArg("foo,bar", schema)).toEqual([]);
  });

  it("coerces string to number when schema expects a number", () => {
    expect(splitArg("1,2,3", v.number())).toEqual([1, 2, 3]);
  });

  it("drops elements that cannot be coerced to a valid number", () => {
    expect(splitArg("1,abc,3", v.number())).toEqual([1, 3]);
  });

  it("works with pipe schemas that accept string input", () => {
    const schema = v.pipe(v.union([v.number(), v.string()]), v.transform(Number), v.number());
    expect(splitArg("1,2,3", schema)).toEqual([1, 2, 3]);
  });

  it("returns single element array for non-comma value", () => {
    expect(splitArg("hello", v.string())).toEqual(["hello"]);
  });

  it("returns empty array for empty string input", () => {
    expect(splitArg("", v.string())).toEqual([]);
  });

  it("returns empty array for whitespace-only input", () => {
    expect(splitArg("   ", v.string())).toEqual([]);
  });

  it("returns empty array for only commas", () => {
    expect(splitArg(",,,", v.string())).toEqual([]);
  });

  it("handles consecutive commas in the middle", () => {
    const schema = v.picklist(["open", "closed"]);
    expect(splitArg("open,,closed", schema)).toEqual(["open", "closed"]);
  });

  it("trims whitespace around picklist values", () => {
    const schema = v.picklist(["open", "closed"]);
    expect(splitArg(" open , closed ", schema)).toEqual(["open", "closed"]);
  });

  it("handles leading and trailing commas", () => {
    expect(splitArg(",a,b,", v.string())).toEqual(["a", "b"]);
  });

  it("handles single whitespace-padded value", () => {
    expect(splitArg("  hello  ", v.string())).toEqual(["hello"]);
  });

  it("drops NaN for number schema", () => {
    expect(splitArg("NaN", v.number())).toEqual([]);
  });
});
