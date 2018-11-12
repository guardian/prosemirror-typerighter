import chunk from "lodash/chunk";
import { MarkTypes } from "./prosemirror";
import { Range } from "..";
import { ValidationLibrary, Operations } from "../interfaces/Validation";

// A temporary validation library
const withoutIndex = <T>(arr: Array<T>, index: number) =>
  arr.slice(0, index).concat(arr.slice(index + 1));

const permutations: <T>(seq: Array<T>) => T[][] = seq =>
  seq.reduce((acc, el, index, arr) => {
    if (!arr.length) return [[]];
    if (arr.length === 1) return [arr];
    return [
      ...acc,
      ...permutations(withoutIndex(arr, index)).map(perms => [el, ...perms], [])
    ];
  }, []);

export const validationLibrary: ValidationLibrary = chunk(
  permutations(Array.from("qwer")).map(perm => {
    const str = perm.join("");
    return {
      regExp: new RegExp(str, "g"),
      annotation: `You used the word ${str}`,
      operation: Operations.ANNOTATE,
      type: MarkTypes.legal
    };
  }),
  500
);
