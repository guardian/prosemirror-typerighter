import { ICategory, IBlockWithIgnoredRanges, Match } from "../interfaces/IMatch";
import {
  IMatcherAdapter,
  TMatchesReceivedCallback
} from "../interfaces/IMatcherAdapter";
import Store, {
  STORE_EVENT_NEW_MATCHES,
  STORE_EVENT_NEW_DIRTIED_RANGES
} from "../state/store";
import { Commands } from "../commands";
import { selectAllBlocksInFlight } from "../state/selectors";
import { v4 } from "uuid";
import TyperighterTelemetryAdapter from "./TyperighterTelemetryAdapter";
import { removeIgnoredRanges } from "../utils/block";
import { mapMatchThroughBlocks } from "../utils/match";

/**
 * A matcher service to manage the interaction between the prosemirror-typerighter plugin
 * and the remote matching service.
 */
class MatcherService {
  // The current throttle duration, which increases during backoff.
  private currentThrottle: number;
  private currentCategories = [] as ICategory[];
  private allCategories = [] as ICategory[];
  private requestPending = false;
  private commands: Commands | undefined;

  constructor(
    private store: Store,
    private adapter: IMatcherAdapter,
    private telemetryAdapter?: TyperighterTelemetryAdapter,
    // The initial throttle duration for pending requests.
    private initialThrottle = 2000,
    private excludedCategories: string[] = []
  ) {
    this.currentThrottle = this.initialThrottle;
    this.store.on(STORE_EVENT_NEW_MATCHES, (requestId, requestsInFlight) => {
      this.fetchMatches(requestId, requestsInFlight);
    });
    this.store.on(STORE_EVENT_NEW_DIRTIED_RANGES, () => {
      this.scheduleRequest();
    });
  }
  public getCommands = () => {
    if (!this.commands){
      console.warn("[prosemirror-typerighter] Attempted to use commands before they were available")
    }
    return this.commands
  }

  private sendMatchTelemetryEvents = (matches: Match[]) => {
    matches.forEach((match: Match) =>
      this.telemetryAdapter?.matchFound(match, document.URL)
    );
  };

  /**
   * Get all of the available categories from the matcher service.
   */
  public fetchCategories = async () => {
    this.allCategories = await this.adapter.fetchCategories();
    return this.allCategories;
  };

  public getCurrentCategories = () => this.currentCategories;

  public addCategory = (categoryId: string) => {
    const category = this.allCategories.find(_ => _.id === categoryId);
    if (!category) {
      return;
    }
    this.currentCategories.push(category);
  };

  public setExcludedCategories = (excludedCategoryIds: string[]) => {
    this.excludedCategories = excludedCategoryIds;
  }

  public removeCategory = (categoryId: string) => {
    this.currentCategories = this.currentCategories.filter(
      _ => _.id !== categoryId
    );
  };

  /**
   * Fetch matches for a set of blocks.
   *
   * We transform the blocks to remove their ignored ranges before they are sent
   * to the server, and map matches back through their owner blocks' ignored ranges
   * as they return. Doing this in the MatcherService ensures that this transform
   * happens as close to the point of range egress/ingress as possible.
   */
  public async fetchMatches(requestId: string, blocks: IBlockWithIgnoredRanges[]) {
    const commands = this.getCommands();
    if (!commands) {
      return;
    }
    const applyMatcherResponse: TMatchesReceivedCallback = response => {
      // For matches, map through ignored ranges on the way in
      const transformedMatches = response.matches.map(match => mapMatchThroughBlocks(match, blocks))
      this.sendMatchTelemetryEvents(transformedMatches);
      const transformedResponse = { ...response, matches: transformedMatches }
      commands.applyMatcherResponse(transformedResponse);
    };

    // For blocks, remove ignored ranges on the way out
    const transformedBlocks = blocks.map(removeIgnoredRanges)
    this.adapter.fetchMatches({
      requestId,
      inputs: transformedBlocks,
      categoryIds: this.currentCategories.map(_ => _.id),
      excludeCategoryIds: this.excludedCategories,
      onMatchesReceived: applyMatcherResponse,
      onRequestError: commands.applyRequestError,
      onRequestComplete: commands.applyRequestComplete
    });
  }

  /**
   * Request a fetch for matches. If we already have a request in flight,
   * defer it until the next throttle window.
   */
  public requestFetchMatches() {
    const commands = this.getCommands();
    if (!commands) {
      return;
    }
    this.requestPending = false;
    const pluginState = this.store.getState();
    if (!pluginState || selectAllBlocksInFlight(pluginState).length) {
      return this.scheduleRequest();
    }
    const requestId = v4();
    commands.requestMatchesForDirtyRanges(
      requestId,
      this.getCurrentCategories().map(_ => _.id),
      this.telemetryAdapter
    );
  }

  /**
   * Request a fetch for matches as with `requestFetchMatches`, but for the entire document.
   */
  public requestFetchMatchesForDocument() {
    const commands = this.getCommands();
    if (!commands) {
      return;
    }
    this.requestPending = false;
    const pluginState = this.store.getState();
    if (!pluginState || selectAllBlocksInFlight(pluginState).length) {
      return this.scheduleRequest();
    }
    const requestId = v4();
    commands.clearMatches();
    commands.requestMatchesForDocument(
      requestId,
      this.getCurrentCategories().map(_ => _.id),
      this.telemetryAdapter
    );
  }

  /**
   * Provide the matcher service with commands, which must be
   * bound to an `EditorView` instance, and so cannot be provided
   * until the Typerighter plugin is instantiated by an `EditorView`.
   */
  public setCommands(commands: Commands) {
    this.commands = commands;
  }

  /**
   * Schedule a request for the next throttle tick.
   */
  private scheduleRequest = (): unknown => {
    if (this.requestPending) {
      return;
    }
    this.requestPending = true;
    setTimeout(() => this.requestFetchMatches(), this.currentThrottle);
  };

}

export default MatcherService;
