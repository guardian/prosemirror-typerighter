import { getByText} from '@testing-library/dom';

import { createEditor } from "./helpers/createEditor";
import { createMatch } from "./helpers/fixtures";

describe("Commands", () => {
  describe("applySuggestionsCommand", () => {
    it("should apply a suggestion to the document", () => {
      const match = createMatch(4, 11, [
        { text: "Example", type: "TEXT_SUGGESTION" }
      ]);
      const {
        editorElement,
        commands
      } = createEditor("<p>An example sentence</p>", [match]);

      commands.applySuggestions([{ text: "improved", matchId: match.matchId }]);

      expect(getByText(editorElement, "An improved sentence")).toBeTruthy();
    });

    it("should keep marks across the whole replaced text when suggestions are applied and additions are made to the end of the range", () => {
      const match = createMatch(4, 11, [
        { text: "Example", type: "TEXT_SUGGESTION" }
      ]);
      const {
        editorElement,
        commands
      } = createEditor("<p>An <strong>example</strong> sentence</p>", [match]);

      commands.applySuggestions([{ text: "improved", matchId: match.matchId }]);

      // The found element's text node is missing 'improved', as that text is nested
      const element = getByText(editorElement, "An sentence")
      expect(element.innerHTML).toBe("An <strong>improved</strong> sentence")
    });

    it("should keep marks across the whole replaced text when suggestions are applied and additions are made to the beginning of the range", () => {
      const match = createMatch(5, 9, [
        { text: "beggar", type: "TEXT_SUGGESTION" }
      ]);
      const {
        editorElement,
        commands
      } = createEditor("<p>Two <strong>eggs</strong></p>", [match]);

      commands.applySuggestions([{ text: "beggars", matchId: match.matchId }]);

      // The found element's text node is missing 'improved', as that text is nested
      const element = getByText(editorElement, "Two")
      expect(element.innerHTML).toBe("Two <strong>beggars</strong>")
    });

    it("should keep marks across parts of the replaced text when suggestions are applied with additions", () => {
      const match = createMatch(4, 11, [
        { text: "Example", type: "TEXT_SUGGESTION" }
      ]);
      const {
        editorElement,
        commands
      } = createEditor("<p>An <strong>ex</strong>a<em>mp</em>le sentence</p>", [match]);

      commands.applySuggestions([{ text: "Example", matchId: match.matchId }]);

      // Again, we only match with the text directly contained by the element. It's a bit awkward.
      const element = getByText(editorElement, "An ale sentence")
      expect(element.innerHTML).toBe("An <strong>Ex</strong>a<em>mp</em>le sentence")
    });

    it("should keep marks across parts of the replaced text when suggestions are applied with deletions", () => {
      const match = createMatch(4, 11, [
        { text: "ample", type: "TEXT_SUGGESTION" }
      ]);
      const {
        editorElement,
        commands
      } = createEditor("<p>An <strong>ex</strong>a<em>mp</em>le sentence</p>", [match]);

      commands.applySuggestions([{ text: "ample", matchId: match.matchId }]);

      // Again, we only match with the text directly contained by the element. It's a bit awkward.
      const element = getByText(editorElement, "An ale sentence")
      expect(element.innerHTML).toBe("An a<em>mp</em>le sentence")
    });
  });
});
