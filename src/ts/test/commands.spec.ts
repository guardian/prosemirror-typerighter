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

      const element = getByText(editorElement, "An sentence")
      expect(element.innerHTML).toBe("An <strong>improved</strong> sentence")
    });

    it("should keep marks within parts of the replaced text when multi-word suggestions are applied and additions are made to the end of the range ", () => {
      const match = createMatch(1, 36, [
        { text: "I'm a Celebrity ... Get Me Out Of Here!", type: "TEXT_SUGGESTION" }
      ]);
      const {
        editorElement,
        commands
      } = createEditor("<p>i'm a celebrity get me <em>out</em> of <strong>here</strong></p>", [match]);

      commands.applySuggestions([{ text: "I'm a Celebrity ... Get Me Out Of Here!", matchId: match.matchId }]);

      const element = getByText(editorElement, "I'm a Celebrity ... Get Me Of")
      expect(element.innerHTML).toBe("I'm a Celebrity ... Get Me <em>Out</em> Of <strong>Here!</strong>")
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

      const element = getByText(editorElement, "Two")
      expect(element.innerHTML).toBe("Two <strong>beggars</strong>")
    });

    it("should keep multiple marks across the whole replaced text when suggestions are applied and additions are made to the beginning of the range", () => {
      const match = createMatch(5, 9, [
        { text: "beggar", type: "TEXT_SUGGESTION" }
      ]);
      const {
        editorElement,
        commands
      } = createEditor("<p>Two <em><strong>eggs</strong></em></p>", [match]);

      commands.applySuggestions([{ text: "beggars", matchId: match.matchId }]);

      const element = getByText(editorElement, "Two")
      expect(element.innerHTML).toBe("Two <em><strong>beggars</strong></em>")
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

      const element = getByText(editorElement, "An ale sentence")
      expect(element.innerHTML).toBe("An a<em>mp</em>le sentence")
    });
  });
});
