import {
  diffRanges,
  findOverlappingRangeIndex,
  mergeRanges,
  removeOverlappingRanges,
  expandRangesToParentBlockNodes,
  mapRemovedRange,
  getIntersection,
  removeIgnoredRange,
  mapAddedRange
} from "../range";
import { createDoc, p } from "../../test/helpers/prosemirror";

describe("Range utils", () => {
  describe("expandRangeToParentBlockNode", () => {
    const doc = createDoc(
      p("Paragraph 1 - 1 - 21"),
      p("Paragraph 2 - 23 - 44"),
      p("Paragraph 3 - 46 - 67")
    );
    it("should get the range of the nearest ancestor block node", () => {
      expect(expandRangesToParentBlockNodes([{ from: 1, to: 2 }], doc)).toEqual([
        {
          from: 1,
          to: 21
        }
      ]);
    });
    it("should handle ranges of length 0", () => {
      expect(expandRangesToParentBlockNodes([{ from: 1, to: 1 }], doc)).toEqual([
        {
          from: 1,
          to: 21
        }
      ]);
    });
    it("should handle multiple ranges for the same node", () => {
      expect(
        expandRangesToParentBlockNodes(
          [
            { from: 1, to: 2 },
            { from: 10, to: 12 }
          ],
          doc
        )
      ).toEqual([
        {
          from: 1,
          to: 21
        }
      ]);
    });
    it("should handle multiple nodes for a single range", () => {
      expect(
        expandRangesToParentBlockNodes(
          [
            { from: 1, to: 67 }
          ],
          doc
        )
      ).toEqual([
        { from: 1, to:  21 },
        { from: 23, to:  44 },
        { from: 46, to:  67 }
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
            text: "one",
            from: 0,
            to: 2
          },
          {
            text: "two",
            from: 5,
            to: 7
          }
        ],
        [
          {
            text: "one",
            from: 1,
            to: 3
          }
        ]
      );
      expect(outputs).toEqual([
        {
          text: "two",
          from: 5,
          to: 7
        }
      ]);
    });
    it("should pass through untouched ranges", () => {
      const outputs = removeOverlappingRanges(
        [
          {
            text: "one",
            from: 0,
            to: 2
          },
          {
            text: "two",
            from: 5,
            to: 7
          }
        ],
        [
          {
            text: "three",
            from: 10,
            to: 12
          }
        ]
      );
      expect(outputs).toEqual([
        {
          text: "one",
          from: 0,
          to: 2
        },
        {
          text: "two",
          from: 5,
          to: 7
        }
      ]);
    });
    it("should apply a predicate to exempt ranges from removal if given", () => {
      const outputs = removeOverlappingRanges(
        [
          {
            text: "one",
            from: 0,
            to: 2
          },
          {
            text: "two",
            from: 5,
            to: 7
          }
        ],
        [
          {
            text: "three",
            from: 10,
            to: 12
          }
        ],
        (range: any) => range.text !== "one"
      );
      expect(outputs).toEqual([
        {
          text: "one",
          from: 0,
          to: 2
        },
        {
          text: "two",
          from: 5,
          to: 7
        }
      ]);
    });
  });
  describe("removeIgnoredRange", () => {
    it("should account for a range added before the given range", () => {
      const currentRange = { from: 10, to: 15 };
      const ignoredRange = { from: 0, to: 5 };
      expect(removeIgnoredRange(currentRange, ignoredRange)).toEqual([{
        from: 16,
        to: 21
      }]);
    });

    it("should account for a range that touches the given range – left hand side", () => {
      const currentRange = { from: 10, to: 15 };
      const ignoredRange = { from: 0, to: 10 };
      expect(removeIgnoredRange(currentRange, ignoredRange)).toEqual([{
        from: 21,
        to: 26
      }]);
    });

    it("should account for a range that touches the given range – right hand side", () => {
      const currentRange = { from: 10, to: 15 };
      const ignoredRange = { from: 15, to: 20 };
      expect(removeIgnoredRange(currentRange, ignoredRange)).toEqual([{
        from: 10,
        to: 15
      }]);
    });

    it("should account for an ignored range that begins within the match and touches right hand side", () => {
      const currentRange = { from: 5, to: 14 };
      const ignoredRange = { from: 10, to: 17 };
      expect(removeIgnoredRange(currentRange, ignoredRange)).toEqual([{
        from: 5,
        to: 10
      }, {
        from: 18,
        to: 22
      }]);
    });

    it("should account for a range added within the given range", () => {
      const currentRange = { from: 10, to: 15 };
      const ignoredRange = { from: 10, to: 15 };
      expect(removeIgnoredRange(currentRange, ignoredRange)).toEqual([{
        from: 16,
        to: 21
      }]);
    });

    it("should account for a range added partially within the given range – left hand side", () => {
      const currentRange = { from: 10, to: 15 };
      const ignoredRange = { from: 5, to: 12 };
      expect(removeIgnoredRange(currentRange, ignoredRange)).toEqual([{
        from: 18,
        to: 23
      }]);
    });

    it("should account for a range added partially the given range – right hand side", () => {
      const currentRange = { from: 10, to: 15 };
      const ignoredRange = { from: 13, to: 20 };
      expect(removeIgnoredRange(currentRange, ignoredRange)).toEqual([
        {
          from: 10,
          to: 13
        },
        {
          from: 21,
          to: 23
        }
      ]);
    });

    it("should handle ignored ranges of a single char", () => {
      const currentRange = { from: 10, to: 15 };
      const ignoredRange = { from: 13, to: 13 };
      expect(removeIgnoredRange(currentRange, ignoredRange)).toEqual([
        {
          from: 10,
          to: 13
        },
        {
          from: 14,
          to: 16
        }
      ]);
    });

    it("should handle ignored ranges when they touch a current range", () => {
      const currentRange = {from: 16, to: 22};
      const ignoredRange = {from: 6, to: 16};
      expect(removeIgnoredRange(currentRange, ignoredRange)).toEqual([
        {
          from: 27,
          to: 33
        }
      ]);
    });
  });
  describe("mapRemovedRange", () => {
    it("should account for a range removed before the given range", () => {
      const currentRange = { from: 10, to: 15 };
      const removedRange = { from: 0, to: 5 };
      expect(mapRemovedRange(currentRange, removedRange)).toEqual({
        from: 4,
        to: 9
      });
    });

    it("should account for a range completely removed within the given range", () => {
      const currentRange = { from: 10, to: 15 };
      const removedRange = { from: 10, to: 15 };
      expect(mapRemovedRange(currentRange, removedRange)).toEqual({
        from: 10,
        to: 10
      });
    });
    it("should account for a range partially removed within the given range – left hand side", () => {
      const currentRange = { from: 10, to: 15 };
      const removedRange = { from: 5, to: 12 };
      expect(mapRemovedRange(currentRange, removedRange)).toEqual({
        from: 4,
        to: 7
      });
    });

    it("should account for a range partially within the given range – right hand side", () => {
      const currentRange = { from: 10, to: 15 };
      const removedRange = { from: 13, to: 20 };
      expect(mapRemovedRange(currentRange, removedRange)).toEqual({
        from: 10,
        to: 13
      });
    });
  });

  describe("mapAddedRange", () => {
    it("should account for a range added before the given range", () => {
      const currentRange = {
        from: 4,
        to: 9
      };
      const removedRange = { from: 0, to: 5 };
      expect(mapAddedRange(currentRange, removedRange)).toEqual({ from: 10, to: 15 });
    });

    it("should account for a range completely added within the given range", () => {
      const currentRange = {
        from: 10,
        to: 10
      };
      const removedRange = { from: 10, to: 15 };
      expect(mapAddedRange(currentRange, removedRange)).toEqual({ from: 10, to: 10 });
    });
    it("should account for a range partially added within the given range – left hand side", () => {
      const currentRange = {
        from: 4,
        to: 7
      };
      const removedRange = { from: 5, to: 12 };
      expect(mapAddedRange(currentRange, removedRange)).toEqual({ from: 4, to: 14 });
    });

    it("should account for a range partially added within the given range – right hand side", () => {
      const currentRange = {
        from: 10,
        to: 13
      };
      const removedRange = { from: 13, to: 20 };
      expect(mapAddedRange(currentRange, removedRange)).toEqual({ from: 10, to: 13 });
    });

    it("should ignore ranges after the current range", () => {
      const currentRange = {
        from: 10,
        to: 13
      };
      const removedRange = { from: 14, to: 20 };
      expect(mapAddedRange(currentRange, removedRange)).toEqual(currentRange);
    });
  });

  describe("getIntersectionOfRanges", () => {
    it("should return an option containing a new range representing the intersection of two ranges", () => {
      const rangeA = { from: 0, to: 5 };
      const rangeB = { from: 4, to: 6 };
      expect(getIntersection(rangeA, rangeB)).toEqual({ from: 4, to: 5 });
    });

    it("should not return a range if there is no intersection", () => {
      const rangeA = { from: 0, to: 3 };
      const rangeB = { from: 4, to: 6 };
      expect(getIntersection(rangeA, rangeB)).toEqual(undefined);
    });
  });
});
