import { MatchFromTyperighter } from "../../interfaces/IMatch";
import { mapThroughIgnoredRanges } from "../match";

describe("Match helpers", () => {
  const getRuleMatch = (from: number, to: number): MatchFromTyperighter => ({
    ruleId: "rule-id",
    category: { id: "category-id", name: "Category", colour: "puce" },
    from,
    to,
    matchId: "match-id",
    precedingText: "",
    subsequentText: "",
    matchedText: "placeholder text",
    message: "placeholder message",
    matchContext: "[placeholder text]",
    matcherType: "regex",
    groupKey: "group-key"
  });

  describe("mapMatchThroughIgnoredRanges", () => {
    it("should account for a range ignored before the given range", () => {
      const ruleMatch = getRuleMatch(10, 15);
      const ignoredRange = [{ from: 0, to: 5 }];
      const mappedMatch = mapThroughIgnoredRanges(ruleMatch, ignoredRange);
      expect(mappedMatch.ranges).toEqual([{ from: 16, to: 21 }]);
    });

    it("should account for a range ignored within the given range", () => {
      const ruleMatch = getRuleMatch(10, 15);
      const ignoredRange = [{ from: 10, to: 15 }];
      const mappedMatch = mapThroughIgnoredRanges(ruleMatch, ignoredRange);
      expect(mappedMatch.ranges).toEqual([{ from: 16, to: 21 }]);
    });

    it("should account for a range ignored within the given range, and extending beyond it", () => {
      const ruleMatch = getRuleMatch(8, 12);
      const ignoredRange = [{ from: 8, to: 15 }];
      const mappedMatch = mapThroughIgnoredRanges(ruleMatch, ignoredRange);
      expect(mappedMatch.ranges).toEqual([{ from: 16, to: 20 }]);
    });

    it("should account for a range ignored partially within the given range – left hand side", () => {
      const ruleMatch = getRuleMatch(10, 15);
      const ignoredRange = [{ from: 5, to: 12 }];
      const mappedMatch = mapThroughIgnoredRanges(ruleMatch, ignoredRange);
      expect(mappedMatch.ranges).toEqual([{ from: 18, to: 23 }]);
    });

    it("should account for a range ignored partially the given range – right hand side", () => {
      const ruleMatch = getRuleMatch(10, 15);
      const ignoredRange = [{ from: 13, to: 20 }];
      const mappedMatch = mapThroughIgnoredRanges(ruleMatch, ignoredRange);
      expect(mappedMatch.ranges).toEqual([{ from: 10, to: 13 }, { from: 21, to: 23 }]);
    });

    it("should account for multiple ranges", () => {
      // E.g. "Example [noted ]text with more [noted ]text"
      const ruleMatch = getRuleMatch(18, 22);
      const ignoredRange = [
        { from: 18, to: 25 },
        { from: 40, to: 47 }
      ];
      const mappedMatch = mapThroughIgnoredRanges(ruleMatch, ignoredRange);
      expect(mappedMatch.ranges).toEqual([{ from: 26, to: 30 }]);
    });
  });
});
