/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal. Unlike the
 * original, distinct empty arrays (or empty plain objects) are considered equal.
 *
 * Vendored from https://github.com/facebook/fbjs/blob/main/packages/fbjs/src/core/shallowEqual.js
 */
const isEmptyArray = (value: unknown): boolean =>
  Array.isArray(value) && value.length === 0;

const isEmptyPlainObject = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return (
    (proto === Object.prototype || proto === null) &&
    Object.keys(value).length === 0
  );
};

const valuesEqual = (a: unknown, b: unknown): boolean =>
  Object.is(a, b) ||
  (isEmptyArray(a) && isEmptyArray(b)) ||
  (isEmptyPlainObject(a) && isEmptyPlainObject(b));

export function shallowEqual(objA: Object, objB: Object): boolean {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
      !valuesEqual(
        objA[keysA[i] as keyof typeof objA],
        objB[keysA[i] as keyof typeof objB]
      )
    ) {
      return false;
    }
  }

  return true;
}
