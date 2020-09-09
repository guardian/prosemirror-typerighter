import { createEditor } from "./helpers/createEditor";
import { createMatch } from "./helpers/fixtures";

/**
 * Applies a suggestion to a document, and returns the editor element
 * containing the document node for inspection.
 */
const applySuggestionToDoc = (
  before: string,
  from: number,
  to: number,
  replacement: string
): HTMLElement => {
  const match = createMatch(from, to, [
    { text: "N/A", type: "TEXT_SUGGESTION" }
  ]);
  const { editorElement, commands } = createEditor(before, [match]);

  commands.applySuggestions([{ text: replacement, matchId: match.matchId }]);

  return editorElement.querySelector("p")!;
};

describe("Commands", () => {
  describe("applySuggestionsCommand", () => {
    it("should apply a suggestion to the document", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An example sentence</p>",
        4,
        11,
        "improved"
      );

      expect(editorElement.innerHTML).toBe("An improved sentence");
    });

    it("should keep marks across the whole replaced text when suggestions are applied and additions are made to the end of the range", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An <strong>example</strong> sentence</p>",
        4,
        11,
        "improved"
      );

      expect(editorElement.innerHTML).toBe(
        "An <strong>improved</strong> sentence"
      );
    });

    it("should keep marks within parts of the replaced text when multi-word suggestions are applied and additions are made to the end of the range ", () => {
      const editorElement = applySuggestionToDoc(
        "<p>i'm a celebrity get me <em>out</em> of <strong>here</strong></p>",
        1,
        36,
        "I'm a Celebrity ... Get Me Out Of Here!"
      );

      expect(editorElement.innerHTML).toBe(
        "I'm a Celebrity ... Get Me <em>Out</em> Of <strong>Here!</strong>"
      );
    });

    it("should keep marks across the whole replaced text when suggestions are applied and additions are made to the beginning of the range", () => {
      const editorElement = applySuggestionToDoc(
        "<p>Two <strong>eggs</strong></p>",
        5,
        9,
        "beggars"
      );

      expect(editorElement.innerHTML).toBe("Two <strong>beggars</strong>");
    });

    it("should keep multiple marks across the whole replaced text when suggestions are applied and additions are made to the beginning of the range", () => {
      const editorElement = applySuggestionToDoc(
        "<p>Two <em><strong>eggs</strong></em></p>",
        5,
        9,
        "beggars"
      );

      expect(editorElement.innerHTML).toBe(
        "Two <em><strong>beggars</strong></em>"
      );
    });

    it("should keep marks across parts of the replaced text when suggestions are applied with additions", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An <strong>ex</strong>a<em>mp</em>le sentence</p>",
        4,
        11,
        "Example"
      );

      expect(editorElement.innerHTML).toBe(
        "An <strong>Ex</strong>a<em>mp</em>le sentence"
      );
    });

    it("should keep marks across parts of the replaced text when suggestions are applied with deletions", () => {
      const editorElement = applySuggestionToDoc(
        "<p>An <strong>ex</strong>a<em>mp</em>le sentence</p>",
        4,
        11,
        "ample"
      );

      expect(editorElement.innerHTML).toBe("An a<em>mp</em>le sentence");
    });
  });
});
