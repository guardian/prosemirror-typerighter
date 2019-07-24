import { h } from "preact";
import sortBy from "lodash/sortBy";
import { IWikiSuggestion } from "../interfaces/IValidation";
import { ApplySuggestionOptions } from "../commands";

type IProps = IWikiSuggestion & {
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
};

const WikiSuggestion = ({ replacements }: IProps) => (
  <div class="WikiSuggestion__container">
    {sortBy(replacements, "relevance").map(
      ({ title, description, thumbnail, relevance }) => (
        <div class="WikiSuggestionAbstract">
          <div class="WikiSuggestionAbstract__title">{title}</div>
          <div class="WikiSuggestionAbstract__description">{description}</div>
          <div class="WikiSuggestionAbstract__thumbnail">{thumbnail}</div>
          <div class="WikiSuggestionAbstract__relevance">{relevance}</div>
        </div>
      )
    )}
  </div>
);

export default WikiSuggestion;
