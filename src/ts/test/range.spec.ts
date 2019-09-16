import {
  diffRanges,
  findOverlappingRangeIndex,
  mergeRanges,
  removeOverlappingRanges,
  getRangesOfParentBlockNodes
} from "../utils/range";
import { createDoc, p } from "./helpers/prosemirror";

describe("Range utils", () => {
  describe("expandRangeToParentBlockNode", () => {
    const doc = createDoc(
      p("Paragraph 1 - 1 - 21"),
      p("Paragraph 2 - 23 - 44"),
      p("Paragraph 3 - 46 - 67")
    );
    it("should get the range of the nearest ancestor block node", () => {
      expect(getRangesOfParentBlockNodes([{ from: 1, to: 2 }], doc)).toEqual([
        {
          from: 1,
          to: 21
        }
      ]);
    });
    it("should handle ranges of length 0", () => {
      expect(getRangesOfParentBlockNodes([{ from: 1, to: 1 }], doc)).toEqual([
        {
          from: 1,
          to: 21
        }
      ]);
    });
    it("should handle multiple ranges for the same node", () => {
      expect(
        getRangesOfParentBlockNodes(
          [{ from: 1, to: 2 }, { from: 10, to: 12 }],
          doc
        )
      ).toEqual([
        {
          from: 1,
          to: 21
        }
      ]);
    });
    it("should handle multiple ranges for different nodes", () => {
      expect(
        getRangesOfParentBlockNodes(
          [{ from: 1, to: 2 }, { from: 30, to: 32 }, { from: 50, to: 55 }],
          doc
        )
      ).toEqual([
        {
          from: 1,
          to: 21
        },
        {
          from: 23,
          to: 44
        },
        {
          from: 46,
          to: 67
        }
      ]);
    });
  });
  describe("findOverlappingRangeIndex", () => {
    it("should find overlapping ranges", () => {
      const ranges = [{ from: 5, to: 10 }];
      expect(
        findOverlappingRangeIndex(
          {
            from: 0,
            to: 4
          },
          ranges
        )
      ).toBe(-1);
      expect(
        findOverlappingRangeIndex(
          {
            from: 0,
            to: 6
          },
          ranges
        )
      ).toEqual(0);
      expect(
        findOverlappingRangeIndex(
          {
            from: 6,
            to: 8
          },
          ranges
        )
      ).toEqual(0);
      expect(
        findOverlappingRangeIndex(
          {
            from: 5,
            to: 10
          },
          ranges
        )
      ).toEqual(0);
      expect(
        findOverlappingRangeIndex(
          {
            from: 8,
            to: 15
          },
          ranges
        )
      ).toEqual(0);
      expect(
        findOverlappingRangeIndex(
          {
            from: 11,
            to: 15
          },
          ranges
        )
      ).toEqual(-1);
    });
  });
  describe("mergeRanges", () => {
    it("merges overlapping ranges", () => {
      const ranges = [
        {
          from: 0,
          to: 10
        },
        {
          from: 5,
          to: 15
        },
        {
          from: 5,
          to: 20
        }
      ];
      expect(mergeRanges(ranges)).toEqual([
        {
          from: 0,
          to: 20
        }
      ]);
    });
  });
  describe("diffRanges", () => {
    it("should remove the second set of ranges from the first range", () => {
      expect(
        diffRanges(
          [
            {
              from: 0,
              to: 10
            }
          ],
          [
            {
              from: 5,
              to: 10
            }
          ]
        )
      ).toEqual([
        {
          from: 0,
          to: 5
        }
      ]);
      expect(
        diffRanges(
          [
            {
              from: 0,
              to: 10
            },
            {
              from: 5,
              to: 15
            }
          ],
          [
            {
              from: 5,
              to: 10
            }
          ]
        )
      ).toEqual([
        {
          from: 0,
          to: 5
        },
        {
          from: 11,
          to: 15
        }
      ]);
      expect(
        diffRanges(
          [
            {
              from: 0,
              to: 20
            }
          ],
          [
            {
              from: 5,
              to: 10
            },
            {
              from: 13,
              to: 17
            }
          ]
        )
      ).toEqual([
        {
          from: 0,
          to: 5
        },
        {
          from: 11,
          to: 13
        },
        {
          from: 18,
          to: 20
        }
      ]);
    });
  });
  describe("removeOverlappingRanges", () => {
    it("should remove overlaps in the second set of ranges from the first set", () => {
      const outputs = removeOverlappingRanges(
        [
          {
            inputString: "one",
            from: 0,
            to: 2
          },
          {
            inputString: "two",
            from: 5,
            to: 7
          }
        ],
        [
          {
            inputString: "one",
            from: 1,
            to: 3
          }
        ]
      );
      expect(outputs).toEqual([
        {
          inputString: "two",
          from: 5,
          to: 7
        }
      ]);
    });
    it("should pass through untouched ranges", () => {
      const outputs = removeOverlappingRanges(
        [
          {
            inputString: "one",
            from: 0,
            to: 2
          },
          {
            inputString: "two",
            from: 5,
            to: 7
          }
        ],
        [
          {
            inputString: "three",
            from: 10,
            to: 12
          }
        ]
      );
      expect(outputs).toEqual([
        {
          inputString: "one",
          from: 0,
          to: 2
        },
        {
          inputString: "two",
          from: 5,
          to: 7
        }
      ]);
    });
    it("should apply a predicate to exempt ranges from removal if given", () => {
      const outputs = removeOverlappingRanges(
        [
          {
            inputString: "one",
            from: 0,
            to: 2
          },
          {
            inputString: "two",
            from: 5,
            to: 7
          }
        ],
        [
          {
            inputString: "three",
            from: 10,
            to: 12
          }
        ],
        (range: any) => range.inputString !== "one"
      );
      expect(outputs).toEqual([
        {
          inputString: "one",
          from: 0,
          to: 2
        },
        {
          inputString: "two",
          from: 5,
          to: 7
        }
      ]);
    });
  });
});
