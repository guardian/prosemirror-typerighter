import { shallowEqual } from "../shallowEqual";

describe("shallowEqual", () => {
  it("returns true for the same reference", () => {
    const obj = { a: 1 };
    expect(shallowEqual(obj, obj)).toBe(true);
  });

  it("returns true for identical primitives", () => {
    expect(shallowEqual(1, 1)).toBe(true);
    expect(shallowEqual("a", "a")).toBe(true);
  });

  it("treats NaN as equal to NaN", () => {
    expect(shallowEqual(NaN, NaN)).toBe(true);
  });

  it("returns false for different primitives", () => {
    expect(shallowEqual(1, 2)).toBe(false);
  });

  it("returns false when either argument is null", () => {
    expect(shallowEqual(null as any, {})).toBe(false);
    expect(shallowEqual({}, null as any)).toBe(false);
  });

  it("returns true for distinct objects with shallowly equal values", () => {
    expect(shallowEqual({ a: 1, b: "x" }, { a: 1, b: "x" })).toBe(true);
  });

  it("returns false when key counts differ", () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("returns false when keys differ", () => {
    expect(shallowEqual({ a: 1 }, { b: 1 })).toBe(false);
  });

  it("returns false when a value differs", () => {
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("compares nested objects by reference", () => {
    const inner = {};
    expect(shallowEqual({ a: {} }, { a: {} })).toBe(false);
    expect(shallowEqual({ a: inner }, { a: inner })).toBe(true);
  });

  it("distinguishes +0 from -0", () => {
    expect(shallowEqual({ a: 0 }, { a: -0 })).toBe(false);
  });

  it("compares arrays by index", () => {
    expect(shallowEqual([1, 2], [1, 2])).toBe(true);
    expect(shallowEqual([1], [2])).toBe(false);
  });
});
