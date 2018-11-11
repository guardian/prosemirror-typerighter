import {
  getExpandedRange,
  getPositionOfNthWord,
  createStringFromValidationInputs
} from "../utils/string";

describe("expandTextSelection", () => {
  it("should give a range that includes the selection plus x words", () => {
    const str = "This is some example text to search ";

    let range = getExpandedRange(14, str);
    expect(str.slice(range.from, range.to)).toBe("some example text");
    expect(range.diffFrom).toBe(-6);
    expect(range.diffTo).toBe(11);

    range = getExpandedRange(14, str, 2);
    expect(str.slice(range.from, range.to)).toBe("is some example text to");
    expect(range.diffFrom).toBe(-9);
    expect(range.diffTo).toBe(14);

    range = getExpandedRange(14, str, 3);
    expect(str.slice(range.from, range.to)).toBe(
      "This is some example text to search"
    );
    expect(range.diffFrom).toBe(-14);
    expect(range.diffTo).toBe(21);

    range = getExpandedRange(0, str, 1);
    expect(str.slice(range.from, range.to)).toBe("This is");
    expect(range.diffFrom).toBe(0);
    expect(range.diffTo).toBe(7);

    range = getExpandedRange(35, str, 1);
    expect(str.slice(range.from, range.to)).toBe("to search");
    expect(range.diffFrom).toBe(-9);
    expect(range.diffTo).toBe(0);
  });

  it("should get the last position of the next nth word", () => {
    let str = "example string to search along";
    expect(str.slice(0, getPositionOfNthWord(str, 1))).toBe("example string");

    str = "example string to search along";
    expect(str.slice(0, getPositionOfNthWord(str, 2))).toBe(
      "example string to"
    );

    str = "e string to search along";
    expect(str.slice(0, getPositionOfNthWord(str, 2))).toBe("e string to");
  });

  it("should get the first position of last nth word", () => {
    let str = "example string to search along";
    expect(str.slice(getPositionOfNthWord(str, 2, false))).toBe(
      "to search along"
    );

    str = "example string to search along ";
    expect(str.slice(getPositionOfNthWord(str, 2, false))).toBe(
      "to search along "
    );

    str = "example string to s";
    expect(str.slice(getPositionOfNthWord(str, 2, false))).toBe("string to s");
    expect(str.slice(getPositionOfNthWord(str, 1, false))).toBe("to s");
  });
  it("should get a single string from a series of validation inputs", () => {
    expect(
      createStringFromValidationInputs([
        { str: "An example", from: 0, to: 10 },
        { str: "sentence", from: 11, to: 19 }
      ])
    ).toEqual("An example sentence");
  });
});
