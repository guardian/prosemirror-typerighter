import { IBlock, IMatch, ICategory } from "../interfaces/IMatch";
import { IMatcherAdapter } from "../interfaces/IMatcherAdapter";
import Store, {
  STORE_EVENT_NEW_MATCHES,
  STORE_EVENT_NEW_DIRTIED_RANGES
} from "../store";
import { Commands } from "../commands";
import { selectAllBlockQueriesInFlight } from "../state/selectors";
import v4 from "uuid/v4";

/**
 * An example matcher service. Calls to fetchMatches() submit blocks
 * for processing via the supplied adapter. Matches and errors dispatch
 * the appropriate Prosemirror commands.
 */
class MatcherService<TMatch extends IMatch> {
  // The current throttle duration, which increases during backoff.
  private currentThrottle: number;
  private currentCategories = [] as ICategory[];
  private allCategories = [] as ICategory[];
  private requestPending = false;
  constructor(
    private store: Store<TMatch>,
    private commands: Commands,
    private adapter: IMatcherAdapter<TMatch>,
    // The initial throttle duration for pending requests.
    private initialThrottle = 2000,
    // The maximum possible throttle duration on backoff.
    private maxThrottle = 16000
  ) {
    this.currentThrottle = initialThrottle;
    this.store.on(STORE_EVENT_NEW_MATCHES, (requestId, requestsInFlight) => {
      this.fetchMatches(requestId, requestsInFlight);
    });
    this.store.on(STORE_EVENT_NEW_DIRTIED_RANGES, () => {
      this.scheduleRequest();
    });
  }

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

  public removeCategory = (categoryId: string) => {
    this.currentCategories = this.currentCategories.filter(
      _ => _.id !== categoryId
    );
  };

  /**
   * Fetch matches for a set of blocks.
   */
  public async fetchMatches(requestId: string, blocks: IBlock[]) {
    this.adapter.fetchMatches(
      requestId,
      blocks,
      this.currentCategories.map(_ => _.id),
      this.commands.applyMatcherResponse,
      this.commands.applyRequestError,
      this.commands.applyRequestComplete
    );
  }

  /**
   * Request a fetch for matches. If we already have a request in flight,
   * defer it until the next throttle window.
   */
  public requestFetchMatches() {
    this.requestPending = false;
    const pluginState = this.store.getState();
    if (!pluginState || selectAllBlockQueriesInFlight(pluginState).length) {
      return this.scheduleRequest();
    }
    const requestId = v4();
    this.commands.requestMatchesForDirtyRanges(
      requestId,
      this.getCurrentCategories().map(_ => _.id)
    );
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
