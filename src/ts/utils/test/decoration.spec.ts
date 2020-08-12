import { createDecorationsForMatch, defaultMatchColours } from "../decoration";
import { createMatch } from "../../test/helpers/fixtures";
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
              class: "MatchDecoration",
              "data-match-id": "0-from:0-to:5--match-0",
              style:
                `background-color: ${defaultMatchColours.ambiguous}07; border-bottom: 2px solid ${defaultMatchColours.ambiguous}`
            },
            spec: {
              categoryId: "1",
              id: "0-from:0-to:5--match-0",
              inclusiveStart: false,
              type: "DECORATION_MATCH"
            }
          }
        },
        {
          from: 0,
          to: 0,
          type: {
            side: 0,
            spec: {
              categoryId: "1",
              id: "0-from:0-to:5--match-0",
              type: "DECORATION_MATCH_HEIGHT_MARKER"
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
              class: "MatchDecoration",
              "data-match-id": "0-from:0-to:5--match-0",
              style:
                `background-color: ${defaultMatchColours.correct}07; border-bottom: 2px solid ${defaultMatchColours.correct}`
            },
            spec: {
              categoryId: "1",
              id: "0-from:0-to:5--match-0",
              inclusiveEnd: false,
              inclusiveStart: false,
              type: "DECORATION_MATCH"
            }
          }
        },
        {
          from: 0,
          to: 0,
          type: {
            side: 0,
            spec: {
              categoryId: "1",
              id: "0-from:0-to:5--match-0",
              type: "DECORATION_MATCH_HEIGHT_MARKER"
            }
          }
        }
      ]);
    });
  });
});
