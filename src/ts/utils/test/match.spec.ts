import { IMatch } from "../..";
import { mapThroughSkippedRanges } from "../match";

describe("Match helpers", () => {
  const getRuleMatch = (from: number, to: number): IMatch => ({
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

  describe("mapMatchThroughSkippedRanges", () => {
    it("should account for a range skipped before the given range", () => {
      const ruleMatch = getRuleMatch(10, 15);
      const skippedRange = [{ from: 0, to: 5 }];
      const mappedMatch = mapThroughSkippedRanges(ruleMatch, skippedRange);
      expect(mappedMatch.from).toBe(16);
      expect(mappedMatch.to).toBe(21);
    });

    it("should account for a range skipped within the given range", () => {
      const ruleMatch = getRuleMatch(10, 15);
      const skippedRange = [{ from: 10, to: 15 }];
      const mappedMatch = mapThroughSkippedRanges(ruleMatch, skippedRange);
      expect(mappedMatch.from).toBe(16);
      expect(mappedMatch.to).toBe(21);
    });

    it("should account for a range skipped within the given range, and extending beyond it", () => {
      const ruleMatch = getRuleMatch(8, 12);
      const skippedRange = [{ from: 8, to: 15 }];
      const mappedMatch = mapThroughSkippedRanges(ruleMatch, skippedRange);
      expect(mappedMatch.from).toBe(16);
      expect(mappedMatch.to).toBe(20);
    });

    it("should account for a range skipped partially within the given range – left hand side", () => {
      const ruleMatch = getRuleMatch(10, 15);
      const skippedRange = [{ from: 5, to: 12 }];
      const mappedMatch = mapThroughSkippedRanges(ruleMatch, skippedRange);
      expect(mappedMatch.from).toBe(18);
      expect(mappedMatch.to).toBe(23);
    });

    it("should account for a range skipped partially the given range – right hand side", () => {
      const ruleMatch = getRuleMatch(10, 15);
      const skippedRange = [{ from: 13, to: 20 }];
      const mappedMatch = mapThroughSkippedRanges(ruleMatch, skippedRange);
      expect(mappedMatch.from).toBe(10);
      expect(mappedMatch.to).toBe(23);
    });

    it("should account for multiple ranges", () => {
      // E.g. "Example [noted ]text with more [noted ]text"
      const ruleMatch = getRuleMatch(18, 22);
      const skippedRange = [
        { from: 18, to: 25 },
        { from: 40, to: 47 }
      ];
      const mappedMatch = mapThroughSkippedRanges(ruleMatch, skippedRange);
      expect(mappedMatch.from).toBe(26);
      expect(mappedMatch.to).toBe(30);
    });
  });
});
