import { Transaction } from "prosemirror-state";
import {
  ActionSetValidateOnModifyState,
  ActionSetDebugState,
  ActionValidationRequestError,
  ActionValidationResponseReceived,
  ActionValidationRequestForDocument,
  ActionValidationRequestForDirtyRanges,
  ActionHandleNewDirtyRanges,
  ActionNewHoverIdReceived,
  ActionSelectValidation,
  NEW_HOVER_ID,
  VALIDATION_REQUEST_FOR_DIRTY_RANGES,
  VALIDATION_REQUEST_FOR_DOCUMENT,
  VALIDATION_REQUEST_SUCCESS,
  VALIDATION_REQUEST_ERROR,
  SELECT_MATCH,
  APPLY_NEW_DIRTY_RANGES,
  SET_DEBUG_STATE,
  SET_VALIDATE_ON_MODIFY_STATE,
  Action,
  ActionValidationRequestComplete,
  VALIDATION_REQUEST_COMPLETE
} from "./actions";
import { IMatches, IBlock, IRange } from "../interfaces/IValidation";
import { DecorationSet, Decoration } from "prosemirror-view";
import omit from "lodash/omit";
import {
  createDebugDecorationFromRange,
  DECORATION_DIRTY,
  DECORATION_INFLIGHT,
  removeDecorationsFromRanges,
  createDecorationForValidationRange,
  DECORATION_VALIDATION,
  createDecorationsForValidationRanges
} from "../utils/decoration";
import {
  mergeRanges,
  validationInputToRange,
  mapAndMergeRanges,
  mapRanges,
  findOverlappingRangeIndex,
  removeOverlappingRanges
} from "../utils/range";
import { ExpandRanges } from "../createValidationPlugin";
import { createValidationBlocksForDocument } from "../utils/prosemirror";
import { Node } from "prosemirror-model";
import {
  selectSingleBlockInFlightById,
  selectBlockQueriesInFlightForSet,
  selectBlockMatchesByMatchId,
  selectBlockQueriesInFlightById
} from "./selectors";
import { Mapping } from "prosemirror-transform";
import { createBlock } from "../utils/validation";

/**
 * Information about the span element the user is hovering over.
 */
export interface IStateHoverInfo {
  // The offsetLeft property of the element relative to the document container.
  // If the span covers multiple lines, this will be the point that the span
  // starts on the line - for the left position of the bounding rectangle see
  // `left`.
  offsetLeft: number;
  // The offsetTop property of the element relative to the document container.
  offsetTop: number;
  // The left property from the element's bounding rectangle.
  left: number;
  // The top property from the element's bounding rectangle.
  top: number;
  // The height of the element.
  height: number;
  // The x coordinate of the mouse position relative to the element
  mouseOffsetX: number;
  // The y coordinate of the mouse position relative to the element
  mouseOffsetY: number;
  // The height the element would have if it occupied a single line.
  // Useful when determining where to put a tooltip if the user
  // is hovering over a span that covers several lines.
  heightOfSingleLine: number;
}

export interface IBlockQueryInFlight {
  // The categories that haven't yet reported for this block.
  pendingCategoryIds: string[];
  block: IBlock;
}

export interface IBlockQueriesInFlightState {
  totalBlocks: number;
  // The category ids that were sent with the request.
  categoryIds: string[];
  pendingBlocks: IBlockQueryInFlight[];
  mapping: Mapping;
}

export interface IPluginState<TBlockMatches extends IMatches = IMatches> {
  // Is the plugin in debug mode? Debug mode adds marks to show dirtied
  // and expanded ranges.
  debug: boolean;
  // Should we trigger validations when the document is modified?
  validateOnModify: boolean;
  // The current decorations the plugin is applying to the document.
  decorations: DecorationSet;
  // The current validation outputs for the document.
  currentValidations: TBlockMatches[];
  // The current ranges that are marked as dirty, that is, have been
  // changed since the last validation pass.
  dirtiedRanges: IRange[];
  // The currently selected match.
  selectedMatch: string | undefined;
  // The id of the validation the user is currently hovering over.
  hoverId: string | undefined;
  // See StateHoverInfo.
  hoverInfo: IStateHoverInfo | undefined;
  // Are there validations pending: have ranges been dirtied but
  // not yet been expanded and sent for validation?
  validationPending: boolean;
  // The sets of blocks that have been sent to the validation service
  // and have not yet completed processing.
  blockQueriesInFlight: {
    [requestId: string]: IBlockQueriesInFlightState;
  };
  // The current error status.
  error: string | undefined;
}

// The transaction meta key that namespaces our actions.
export const VALIDATION_PLUGIN_ACTION = "VALIDATION_PLUGIN_ACTION";

/**
 * Initial state.
 */
export const createInitialState = <TValidationMeta extends IMatches>(
  doc: Node
): IPluginState<TValidationMeta> => ({
  debug: false,
  validateOnModify: false,
  decorations: DecorationSet.create(doc, []),
  dirtiedRanges: [],
  currentValidations: [],
  selectedMatch: undefined,
  hoverId: undefined,
  hoverInfo: undefined,
  blockQueriesInFlight: {},
  validationPending: false,
  error: undefined
});

export const createValidationPluginReducer = (expandRanges: ExpandRanges) => {
  const handleValidationRequestForDirtyRanges = createHandleValidationRequestForDirtyRanges(
    expandRanges
  );
  return <TValidationMeta extends IMatches>(
    tr: Transaction,
    incomingState: IPluginState<TValidationMeta>,
    action?: Action<TValidationMeta>
  ): IPluginState<TValidationMeta> => {
    // There are certain things we need to do every time a transaction is dispatched, e.g. mapping ranges.
    const state = getNewStateFromTransaction(tr, incomingState);

    if (!action) {
      return state;
    }

    switch (action.type) {
      case NEW_HOVER_ID:
        return handleNewHoverId(tr, state, action);
      case VALIDATION_REQUEST_FOR_DIRTY_RANGES:
        return handleValidationRequestForDirtyRanges(tr, state, action);
      case VALIDATION_REQUEST_FOR_DOCUMENT:
        return handleValidationRequestForDocument(tr, state, action);
      case VALIDATION_REQUEST_SUCCESS:
        return handleValidationRequestSuccess(tr, state, action);
      case VALIDATION_REQUEST_ERROR:
        return handleValidationRequestError(tr, state, action);
      case VALIDATION_REQUEST_COMPLETE:
        return handleValidationRequestComplete(tr, state, action);
      case SELECT_MATCH:
        return handleSelectValidation(tr, state, action);
      case APPLY_NEW_DIRTY_RANGES:
        return handleNewDirtyRanges(tr, state, action);
      case SET_DEBUG_STATE:
        return handleSetDebugState(tr, state, action);
      case SET_VALIDATE_ON_MODIFY_STATE:
        return handleSetValidateOnModifyState(tr, state, action);
      default:
        return state;
    }
  };
};

/**
 * Get a new plugin state from the incoming transaction.
 *
 * We need to respond to each transaction in our reducer, whether or not there's
 * an action present, in order to maintain mappings and respond to user input.
 */
const getNewStateFromTransaction = <TValidationMeta extends IMatches>(
  tr: Transaction,
  incomingState: IPluginState<TValidationMeta>
): IPluginState<TValidationMeta> => {
  const mappedblockQueriesInFlight = Object.entries(
    incomingState.blockQueriesInFlight
  ).reduce((acc, [requestId, blockQueriesInFlight]) => {
    // We create a new mapping here to preserve state immutability, as
    // appendMapping mutates an existing mapping.
    const mapping = new Mapping();
    mapping.appendMapping(blockQueriesInFlight.mapping);
    mapping.appendMapping(tr.mapping);
    return {
      ...acc,
      [requestId]: {
        ...blockQueriesInFlight,
        mapping
      }
    };
  }, {});
  return {
    ...incomingState,
    decorations: incomingState.decorations.map(tr.mapping, tr.doc),
    dirtiedRanges: mapAndMergeRanges(incomingState.dirtiedRanges, tr.mapping),
    currentValidations: mapRanges(incomingState.currentValidations, tr.mapping),
    blockQueriesInFlight: mappedblockQueriesInFlight
  };
};

/**
 * Action handlers.
 */

/**
 * Handle the selection of a hover id.
 */
const handleSelectValidation = <TValidationMeta extends IMatches>(
  _: unknown,
  state: IPluginState<TValidationMeta>,
  action: ActionSelectValidation
): IPluginState<TValidationMeta> => {
  return {
    ...state,
    selectedMatch: action.payload.matchId
  };
};

/**
 * Handle the receipt of a new hover id.
 */
const handleNewHoverId = <TValidationMeta extends IMatches>(
  tr: Transaction,
  state: IPluginState<TValidationMeta>,
  action: ActionNewHoverIdReceived
): IPluginState<TValidationMeta> => {
  let decorations = state.decorations;
  const incomingHoverId = action.payload.matchId;
  const currentHoverId = state.hoverId;

  // The current hover decorations are no longer valid -- remove them.
  const currentHoverDecorations = decorations.find(
    undefined,
    undefined,
    spec =>
      (spec.id === currentHoverId || spec.id === incomingHoverId) &&
      spec.type === DECORATION_VALIDATION
  );

  decorations = decorations.remove(currentHoverDecorations);

  // Add the new decorations for the current and incoming validations.
  const decorationData = [{ id: incomingHoverId, isSelected: true }];
  if (incomingHoverId !== currentHoverId) {
    decorationData.push({ id: currentHoverId, isSelected: false });
  }
  decorations = decorationData.reduce((acc, hoverData) => {
    const output = selectBlockMatchesByMatchId(state, hoverData.id || "");
    if (!output) {
      return acc;
    }
    return decorations.add(
      tr.doc,
      createDecorationForValidationRange(output, hoverData.isSelected, false)
    );
  }, decorations);

  return {
    ...state,
    decorations,
    hoverId: action.payload.matchId,
    hoverInfo: action.payload.hoverInfo
  };
};

const handleNewDirtyRanges = <TValidationMeta extends IMatches>(
  tr: Transaction,
  state: IPluginState<TValidationMeta>,
  { payload: { ranges: dirtiedRanges } }: ActionHandleNewDirtyRanges
) => {
  // Map our dirtied ranges through the current transaction, and append any new ranges it has dirtied.
  let newDecorations = state.debug
    ? state.decorations.add(
        tr.doc,
        dirtiedRanges.map(range => createDebugDecorationFromRange(range))
      )
    : state.decorations;

  // Remove any validations and associated decorations
  // touched by the dirtied ranges from the doc
  newDecorations = removeDecorationsFromRanges(newDecorations, dirtiedRanges);
  const currentValidations = state.currentValidations.filter(
    output => findOverlappingRangeIndex(output, dirtiedRanges) === -1
  );

  return {
    ...state,
    currentValidations,
    decorations: newDecorations,
    // We only care about storing dirtied ranges if we're validating
    // in response to user edits.
    validationPending: state.validateOnModify ? true : false,
    dirtiedRanges: state.validateOnModify
      ? state.dirtiedRanges.concat(dirtiedRanges)
      : []
  };
};

/**
 * Handle a validation request for the current set of dirty ranges.
 */
const createHandleValidationRequestForDirtyRanges = (
  expandRanges: ExpandRanges
) => <TValidationMeta extends IMatches>(
  tr: Transaction,
  state: IPluginState<TValidationMeta>,
  { payload: { requestId, categoryIds } }: ActionValidationRequestForDirtyRanges
) => {
  const ranges = expandRanges(state.dirtiedRanges, tr.doc);
  const validationInputs: IBlock[] = ranges.map(range =>
    createBlock(tr, range)
  );
  return handleValidationRequestStart(requestId, validationInputs, categoryIds)(
    tr,
    state
  );
};

/**
 * Handle a validation request for the entire document.
 */
const handleValidationRequestForDocument = <TValidationMeta extends IMatches>(
  tr: Transaction,
  state: IPluginState<TValidationMeta>,
  { payload: { requestId, categoryIds } }: ActionValidationRequestForDocument
) => {
  return handleValidationRequestStart(
    requestId,
    createValidationBlocksForDocument(tr),
    categoryIds
  )(tr, state);
};

/**
 * Handle a validation request for a given set of validation inputs.
 */
const handleValidationRequestStart = (
  requestId: string,
  blockQueries: IBlock[],
  categoryIds: string[]
) => <TValidationMeta extends IMatches>(
  tr: Transaction,
  state: IPluginState<TValidationMeta>
): IPluginState<TValidationMeta> => {
  // Replace any debug decorations, if they exist.
  const decorations = state.debug
    ? removeDecorationsFromRanges(state.decorations, blockQueries, [
        DECORATION_DIRTY
      ]).add(
        tr.doc,
        blockQueries.map(range => createDebugDecorationFromRange(range, false))
      )
    : state.decorations;

  const newBlockQueriesInFlight: IBlockQueryInFlight[] = blockQueries.map(block => ({
    block,
    pendingCategoryIds: categoryIds
  }));

  return {
    ...state,
    decorations,
    // We reset the dirty ranges, as they've been expanded and sent for validation.
    dirtiedRanges: [],
    validationPending: false,
    blockQueriesInFlight: {
      ...state.blockQueriesInFlight,
      [requestId]: {
        totalBlocks: newBlockQueriesInFlight.length,
        pendingBlocks: newBlockQueriesInFlight,
        mapping: tr.mapping,
        categoryIds
      }
    }
  };
};

const amendBlockQueriesInFlight = <TValidationOutput extends IMatches>(
  state: IPluginState<TValidationOutput>,
  requestId: string,
  blockId: string,
  categoryIds: string[]
) => {
  const currentBlockQueriesInFlight = selectBlockQueriesInFlightForSet(
    state,
    requestId
  );
  if (!currentBlockQueriesInFlight) {
    return state.blockQueriesInFlight;
  }
  const newBlockQueriesInFlight: IBlockQueriesInFlightState = {
    ...currentBlockQueriesInFlight,
    pendingBlocks: currentBlockQueriesInFlight.pendingBlocks.reduce(
      (acc, blockInFlight) => {
        // Don't modify blocks that don't match
        if (blockInFlight.block.id !== blockId) {
          return acc.concat(blockInFlight);
        }
        const newBlockInFlight = {
          ...blockInFlight,
          pendingCategoryIds: blockInFlight.pendingCategoryIds.filter(
            id => !categoryIds.includes(id)
          )
        };
        return newBlockInFlight.pendingCategoryIds.length
          ? acc.concat(newBlockInFlight)
          : acc;
      },
      [] as IBlockQueryInFlight[]
    )
  };
  if (!newBlockQueriesInFlight.pendingBlocks.length) {
    return omit(state.blockQueriesInFlight, requestId);
  }
  return {
    ...state.blockQueriesInFlight,
    [requestId]: newBlockQueriesInFlight
  };
};

/**
 * Handle a validation response, decorating the document with
 * any validations we've received.
 */
const handleValidationRequestSuccess = <TBlockMatches extends IMatches>(
  tr: Transaction,
  state: IPluginState<TBlockMatches>,
  { payload: { response } }: ActionValidationResponseReceived<TBlockMatches>
): IPluginState<TBlockMatches> => {
  if (!response) {
    return state;
  }

  const blockQueriesInFlight = selectBlockQueriesInFlightById(
    state,
    response.requestId,
    response.blocks.map(_ => _.id)
  );

  if (!blockQueriesInFlight.length) {
    return state;
  }

  // Remove validations superceded by the incoming matches.
  let currentValidations: TBlockMatches[] = removeOverlappingRanges(
    state.currentValidations,
    blockQueriesInFlight.map(_ => _.block),
    validation => !response.categoryIds.includes(validation.category.id)
  );

  // Remove decorations superceded by the incoming matches.
  const decsToRemove = blockQueriesInFlight.reduce(
    (acc, blockInFlight) =>
      acc.concat(
        state.decorations
          .find(blockInFlight.block.from, blockInFlight.block.to, spec =>
            response.categoryIds.includes(spec.categoryId)
          )
          .concat(
            state.debug
              ? // Ditch any decorations marking inflight validations.
                state.decorations.find(
                  undefined,
                  undefined,
                  _ => _.type === DECORATION_INFLIGHT
                )
              : []
          )
      ),
    [] as Decoration[]
  );

  // Add the response to the current validations
  currentValidations = currentValidations.concat(
    mapRanges(
      response.matches,
      selectBlockQueriesInFlightForSet(state, response.requestId)!.mapping
    )
  );

  // We don't apply incoming validations to ranges that have
  // been dirtied since they were requested.
  currentValidations = removeOverlappingRanges(
    currentValidations,
    state.dirtiedRanges
  );

  // Create our decorations for the newly current validations.
  const newDecorations = createDecorationsForValidationRanges(response.matches);

  // Amend the block queries in flight to
  const newBlockQueriesInFlight = blockQueriesInFlight.reduce(
    (acc, blockInFlight) =>
      amendBlockQueriesInFlight(
        { ...state, blockQueriesInFlight: acc },
        response.requestId,
        blockInFlight.block.id,
        response.categoryIds
      ),
    state.blockQueriesInFlight
  );

  return {
    ...state,
    blockQueriesInFlight: newBlockQueriesInFlight,
    currentValidations,
    decorations: state.decorations
      .remove(decsToRemove)
      .add(tr.doc, newDecorations)
  };
};

/**
 * Handle a validation request error.
 */
const handleValidationRequestError = <TValidationMeta extends IMatches>(
  tr: Transaction,
  state: IPluginState<TValidationMeta>,
  {
    payload: {
      validationError: { requestId, blockId, message }
    }
  }: ActionValidationRequestError
) => {
  if (!blockId) {
    return { ...state, message };
  }

  const blockQueriesInFlight = selectBlockQueriesInFlightForSet(
    state,
    requestId
  );

  if (!blockQueriesInFlight) {
    return state;
  }

  const blockInFlight = selectSingleBlockInFlightById(
    state,
    requestId,
    blockId
  );

  if (!blockInFlight) {
    return { ...state, message };
  }

  const dirtiedRanges = blockInFlight
    ? mapRanges(
        [validationInputToRange(blockInFlight.block)],
        blockQueriesInFlight.mapping
      )
    : [];

  const decsToRemove = dirtiedRanges.reduce(
    (acc, range) =>
      acc.concat(
        state.decorations.find(
          range.from,
          range.to,
          _ => _.type === DECORATION_INFLIGHT
        )
      ),
    [] as Decoration[]
  );

  // When we get errors, we map the ranges due to be validated back
  // through the document and add them to the dirtied ranges to be
  // validated on the next pass.
  let decorations = state.decorations.remove(decsToRemove);

  if (dirtiedRanges.length && state.debug) {
    decorations = decorations.add(
      tr.doc,
      dirtiedRanges.map(range => createDebugDecorationFromRange(range))
    );
  }

  return {
    ...state,
    dirtiedRanges: dirtiedRanges.length
      ? mergeRanges(state.dirtiedRanges.concat(dirtiedRanges))
      : state.dirtiedRanges,
    decorations,
    blockQueriesInFlight: amendBlockQueriesInFlight(
      state,
      requestId,
      blockId,
      []
    ),
    error: message
  };
};

const handleValidationRequestComplete = <TValidationMeta extends IMatches>(
  _: Transaction,
  state: IPluginState<TValidationMeta>,
  { payload: { requestId } }: ActionValidationRequestComplete
) => {
  const requestInFlight = selectBlockQueriesInFlightForSet(state, requestId);
  const hasUnfinishedWork =
    requestInFlight &&
    requestInFlight.pendingBlocks.some(
      block => block.pendingCategoryIds.length
    );
  if (requestInFlight && hasUnfinishedWork) {
    /* tslint:disable-next-line:no-console */
    console.warn(
      `Request ${requestId} was marked as complete, but there is still work remaining.`,
      requestInFlight.pendingBlocks
    );
  }
  return {
    ...state,
    blockQueriesInFlight: omit(state.blockQueriesInFlight, requestId)
  };
};

const handleSetDebugState = <TValidationMeta extends IMatches>(
  _: Transaction,
  state: IPluginState<TValidationMeta>,
  { payload: { debug } }: ActionSetDebugState
) => {
  return {
    ...state,
    debug
  };
};

const handleSetValidateOnModifyState = <TValidationMeta extends IMatches>(
  _: Transaction,
  state: IPluginState<TValidationMeta>,
  { payload: { validateOnModify } }: ActionSetValidateOnModifyState
) => {
  return {
    ...state,
    validateOnModify
  };
};
