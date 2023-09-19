import {
  createDecorationsForMatch,
  getMatchType,
  MatchType
} from "../decoration";
import { createMatch } from "../../utils/createTestFixtures";
import { IMatch } from "../../interfaces/IMatch";

describe("Decoration utils", () => {
  describe("createDecorationsForMatch", () => {
    // We us matchObject to compare a subset of properties here, rather than
    // using isEqual, because the toDOM property of decorations is a pain to reproduce.
    it("should create decorations for a match", () => {
      const match = createMatch(0, 5);
      const decorations = createDecorationsForMatch(match);
      expect(decorations).toMatchObject([
        {
          from: 0,
          to: 5,
          type: {
            attrs: {
              class: "MatchDecoration MatchDecoration--default",
              "data-match-id": "0-from:0-to:5--match-0"
            },
            spec: {
              categoryId: "1",
              id: "0-from:0-to:5--match-0",
              inclusiveStart: false,
              type: "DECORATION_MATCH"
            }
          }
        }
      ]);
    });
    it("should add an 'is correct' marker if markAsCorrect is set", () => {
      const match = { ...createMatch(0, 5), markAsCorrect: true } as IMatch;
      const decorations = createDecorationsForMatch(match);
      expect(decorations).toMatchObject([
        {
          from: 0,
          to: 5,
          type: {
            attrs: {
              class: "MatchDecoration MatchDecoration--is-correct",
              "data-match-id": "0-from:0-to:5--match-0"
            },
            spec: {
              categoryId: "1",
              id: "0-from:0-to:5--match-0",
              inclusiveEnd: false,
              inclusiveStart: false,
              type: "DECORATION_MATCH"
            }
          }
        }
      ]);
    });
  });
  describe("getMatchType", () => {
    const defaultMatch = createMatch(0, 5);
    it("gives a MatchType of OK when markAsCorrect is set", () => {
      const match = { ...defaultMatch, markAsCorrect: true };
      expect(getMatchType(match)).toBe(MatchType.OK);
    });
    it("gives a matchType of AMEND when a replacement is available", () => {
      const match = {
        ...defaultMatch,
        replacement: { text: "u r wrong", type: "TEXT_SUGGESTION" as const }
      };
      expect(getMatchType(match)).toBe(MatchType.AMEND);
    });
    it("gives a match type of REVIEW when none of the above apply", () => {
      expect(getMatchType(defaultMatch)).toBe(MatchType.REVIEW);
    });
  });
});
