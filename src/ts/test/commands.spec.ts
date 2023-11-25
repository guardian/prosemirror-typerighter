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
        "<p>i'm a celebrity get me <em>out</em> of <strong>here</strong></p>",
        [{ from: 1, to: 36 }],
        "I'm a Celebrity ... Get Me Out Of Here!"
      );

      expect(editorElement.innerHTML).toBe(
        "I'm a Celebrity ... Get Me <em>Out</em> Of <strong>Here!</strong>"
      );
    });

    it("should keep overlapping marks within parts of the replaced text when multi-word suggestions are applied and additions are made to the end of the range", () => {
      const editorElement = applySuggestionToDoc(
        "<p>i'm a celebrity get me <em>out of <strong>here</em></strong></p>",
        [{ from: 1, to: 36 }],
        "I'm a Celebrity ... Get Me Out Of Here!"
      );

      expect(editorElement.innerHTML).toBe(
        "I'm a Celebrity ... Get Me <em>Out Of <strong>Here!</strong></em>"
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

    it("should ignore ranges not covered by the match – 1", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An exa-----mple sentence</p>",
        [{ from: 4, to: 7 }, { from: 12, to: 16 }],
        "ample"
      );

      expect(editorElement.textContent).toBe("An a-----mple sentence");
    });

    it("should ignore ranges not covered by the match – 2", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An ex-a-mple sentence</p>",
        [{ from: 4, to: 6 }, { from: 7, to: 8 }, { from: 9, to: 13 }],
        "ample"
      );

      expect(editorElement.textContent).toBe("An -a-mple sentence");
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
    })

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
