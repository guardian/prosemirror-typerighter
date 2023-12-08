import { IRange } from "../interfaces/IMatch";
import { createEditor } from "./helpers/createEditor";
import { createMatch, createMatchWithRanges } from "./helpers/fixtures";

/**
 * Applies a suggestion to a document, and returns the editor element
 * containing the document node for inspection.
 */
const applySuggestionToDoc = (
  before: string,
  ranges: IRange[],
  replacement: string
): HTMLElement => {
  const match = createMatchWithRanges(ranges, [
    { text: "N/A", type: "TEXT_SUGGESTION" }
  ]);
  const { editorElement, commands } = createEditor(before, [match]);

  commands.applySuggestions([{ text: replacement, matchId: match.matchId }]);
  commands.clearMatches();

  return editorElement.querySelector("p")!;
};

describe("Commands", () => {
  describe("General behaviour", () => {
    it("should not attempt to apply new states when the document has been destroyed", () => {
      const { view, commands } = createEditor("<p>Example document");
      view.destroy();
      expect(commands.clearMatches).not.toThrow();
    });
  })

  describe("applySuggestionsCommand", () => {
    it("should apply a suggestion to the document", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An example sentence</p>",
        [{ from: 4, to: 11 }],
        "improved"
      );

      expect(editorElement.innerHTML).toBe("An improved sentence");
    });

    it("should keep marks across the whole replaced text when suggestions are applied and additions are made to the end of the range", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An <strong>example</strong> sentence</p>",
        [{ from: 4, to: 11 }],
        "improved"
      );

      expect(editorElement.innerHTML).toBe(
        "An <strong>improved</strong> sentence"
      );
    });

    it("should keep marks within parts of the replaced text when multi-word suggestions are applied and additions are made to the end of the range", () => {
      const editorElement = applySuggestionToDoc(
        "<p>1<em>2</em>3<strong>4</strong>5</p>",
        [{ from: 1, to: 6 }],
        "1-3-5"
      );

      expect(editorElement.innerHTML).toBe(
        "1<em>-</em>3<strong>-</strong>5"
      );
    });

    it("should extend marks when the patch grows", () => {
      const editorElement = applySuggestionToDoc(
        "<p>1<em>2</em>3<strong>4</strong>5</p>",
        [{ from: 1, to: 7 }],
        "1-34-5"
      );

      expect(editorElement.innerHTML).toBe(
        "1<em>-</em>3<strong>4-</strong>5"
      );
    });

    it("should keep marks within parts of the replaced text when multi-word suggestions are applied and additions are made to the end of the range", () => {
      const editorElement = applySuggestionToDoc(
        "<p>i'm a celebrity get me <em>o</em>ut of <strong>here</strong></p>",
        [{ from: 1, to: 36 }],
        "I'm a Celebrity ... Get Me Out Of Here!"
      );

      expect(editorElement.innerHTML).toBe(
        "I'm a Celebrity ... Get Me <em>O</em>ut Of <strong>Here!</strong>"
      );
    });

    it("should keep marks across the whole replaced text when suggestions are applied and additions are made to the beginning of the range", () => {
      const editorElement = applySuggestionToDoc(
        "<p>Two <strong>eggs</strong></p>",
        [{ from: 5, to: 9 }],
        "beggars"
      );

      expect(editorElement.innerHTML).toBe("Two <strong>beggars</strong>");
    });

    it("should keep multiple marks across the whole replaced text when suggestions are applied and additions are made to the beginning of the range", () => {
      const editorElement = applySuggestionToDoc(
        "<p>Two <em><strong>eggs</strong></em></p>",
        [{ from: 5, to: 9 }],
        "beggars"
      );

      expect(editorElement.innerHTML).toBe(
        "Two <em><strong>beggars</strong></em>"
      );
    });

    it("should keep marks across parts of the replaced text when suggestions are applied with additions", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An <strong>ex</strong>a<em>mp</em>le sentence</p>",
        [{ from: 4, to: 11 }],
        "Example"
      );

      expect(editorElement.innerHTML).toBe(
        "An <strong>Ex</strong>a<em>mp</em>le sentence"
      );
    });

    it("should keep marks across parts of the replaced text when suggestions are applied with deletions", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An <strong>ex</strong>a<em>mp</em>le sentence</p>",
        [{ from: 4, to: 11 }],
        "ample"
      );

      expect(editorElement.innerHTML).toBe("An a<em>mp</em>le sentence");
    });

    it("should ignore ranges not covered by the match", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An exa-----mple sentence</p>",
        [{ from: 4, to: 7 }, { from: 12, to: 16 }],
        "ample"
      );

      expect(editorElement.innerHTML).toBe("An a-----mple sentence");
    });

    it("should ignore ranges not covered by the match, preserving position of the start of the suggestion", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An ex-a-mple sentence</p>",
        [{ from: 4, to: 6 }, { from: 7, to: 8 }, { from: 9, to: 13 }],
        "ample"
      );

      expect(editorElement.innerHTML).toBe("An -a-mple sentence");
    });

    it("should ignore ranges not covered by the match, flowing subsequent parts of the suggestion through the ranges", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An ex-aa-mple sentence</p>",
        [{ from: 4, to: 6 }, { from: 7, to: 9 }, { from: 10, to: 14 }],
        "example"
      );

      expect(editorElement.innerHTML).toBe("An ex-am-ple sentence");
    });

    it("should not consider styling of ignored and adjacent ranges when preserving marks", () => {
      const editorElement = applySuggestionToDoc(
        "<p><strong>An </strong><em>e<strong>-</strong>m<strong>-</strong>ple</em><strong> sentence</strong></p>",
        [{ from: 4, to: 5 }, { from: 6, to: 7 }, { from: 8, to: 11 }],
        "temple"
      );

      expect(editorElement.innerHTML).toBe("<strong>An </strong><em>t<strong>-</strong>e<strong>-</strong>mple</em><strong> sentence</strong>");
    });
  });

  describe("setTyperighterEnabled", () => {
    const createExampleEditor = (
      before: string,
      from: number,
      to: number,
    )  => {
      const match = createMatch(from, to, [
        { text: "N/A", type: "TEXT_SUGGESTION" }
      ]);
      const { editorElement, commands } = createEditor(before, [match]);

      return { editorElement, commands };
    };

    it("should remove any match decorations when Typerighter is disabled", () => {
      const { editorElement, commands } = createExampleEditor("<p>An example sentence</p>",
      4,
      11);

      commands.setTyperighterEnabled(false);

      const maybeMatchElement = editorElement.querySelector("span[data-match-id]")!;
      expect(maybeMatchElement).toBeFalsy()
    });

    it("should not remove match decorations when setTyperighterEnabled is set to true", () => {
      const { editorElement, commands } = createExampleEditor("<p>An example sentence</p>",
      4,
      11);

      commands.setTyperighterEnabled(true);

      const maybeMatchElement = editorElement.querySelector("span[data-match-id]")!;
      expect(maybeMatchElement).toBeTruthy()
    })
  })
});
