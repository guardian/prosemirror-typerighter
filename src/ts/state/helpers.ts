import { IPluginState, IIgnoreMatchPredicate, includeAllMatches } from "./reducer";
import { IMatch } from "../interfaces/IMatch";
import { createDecorationsForMatch } from "../utils/decoration";
import { DecorationSet } from "prosemirror-view";

export const addMatchesToState = <TFilterState, TMatch extends IMatch>(
  state: IPluginState<TFilterState, TMatch>,
  doc: any,
  matches: TMatch[],
  ignoreMatch: IIgnoreMatchPredicate = includeAllMatches
) => {
  const matchesToApply = matches.filter(match => !ignoreMatch(match));
  const decorations = matchesToApply.reduce(
    (set, output) => set.add(doc, createDecorationsForMatch(output)),
    new DecorationSet()
  );
  return {
    ...state,
    currentMatches: matchesToApply,
    decorations
  };
};
