import {
  diffRanges,
  findOverlappingRangeIndex,
  mergeRanges,
  removeOverlappingRanges
  } from '../utils/range';

describe("Range utils", () => {
  describe("expandRange", () => {
    it("should get the range of the nearest ancestor block node", () => {
      // @todo
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
            str: "one",
            from: 0,
            to: 2
          },
          {
            str: "two",
            from: 5,
            to: 7
          }
        ],
        [
          {
            str: "one",
            from: 1,
            to: 3
          }
        ]
      );
      expect(outputs).toEqual([
        {
          str: "two",
          from: 5,
          to: 7
        }
      ]);
    });
    it("should pass through untouched ranges", () => {
      const outputs = removeOverlappingRanges(
        [
          {
            str: "one",
            from: 0,
            to: 2
          },
          {
            str: "two",
            from: 5,
            to: 7
          }
        ],
        [
          {
            str: "three",
            from: 10,
            to: 12
          }
        ]
      );
      expect(outputs).toEqual([
        {
          str: "one",
          from: 0,
          to: 2
        },
        {
          str: "two",
          from: 5,
          to: 7
        }
      ]);
    });
  });
});
