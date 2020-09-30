import { IPluginState } from "./reducer";
import { ArgumentTypes } from "../utils/types";
import { IBlock } from "../interfaces/IMatch";

export const STORE_EVENT_NEW_MATCHES = "STORE_EVENT_NEW_MATCHES";
export const STORE_EVENT_NEW_STATE = "STORE_EVENT_NEW_STATE";
export const STORE_EVENT_NEW_DIRTIED_RANGES = "STORE_EVENT_DOCUMENT_DIRTIED";

type STORE_EVENT_NEW_MATCHES = typeof STORE_EVENT_NEW_MATCHES;
type STORE_EVENT_NEW_STATE = typeof STORE_EVENT_NEW_STATE;
type STORE_EVENT_NEW_DIRTIED_RANGES = typeof STORE_EVENT_NEW_DIRTIED_RANGES;

export interface IStoreEvents<TPluginState extends IPluginState> {
  [STORE_EVENT_NEW_MATCHES]: (
    requestId: string,
    blocks: IBlock[]
  ) => void;
  [STORE_EVENT_NEW_STATE]: (state: TPluginState) => void;
  [STORE_EVENT_NEW_DIRTIED_RANGES]: () => void;
}

type EventNames = keyof IStoreEvents<IPluginState>;

/**
 * A store to allow consumers to subscribe to state updates.
 */
class Store<
  TPluginState extends IPluginState,
  TStoreEvents extends IStoreEvents<TPluginState> = IStoreEvents<
    TPluginState
  >
> {
  private state: TPluginState | undefined;
  private subscribers: {
    [EventName in EventNames]: Array<TStoreEvents[EventName]>
  } = {
    [STORE_EVENT_NEW_STATE]: [],
    [STORE_EVENT_NEW_MATCHES]: [],
    [STORE_EVENT_NEW_DIRTIED_RANGES]: []
  };

  constructor() {
    this.on("STORE_EVENT_NEW_STATE", _ => this.updateState(_));
  }

  /**
   * Notify our subscribers of a state change.
   */
  public emit<EventName extends EventNames>(
    eventName: EventName,
    ...args: ArgumentTypes<TStoreEvents[EventName]>
  ) {
    (this.subscribers[eventName] as Array<TStoreEvents[EventName]>).forEach(
      (_: any) => _(...args)
    );
  }

  /**
   * Unsubscribe to a store event.
   */
  public removeEventListener<EventName extends EventNames>(
    eventName: EventName,
    listener: TStoreEvents[EventName]
  ): void {
    const index = (this.subscribers[eventName] as Array<
      TStoreEvents[EventName]
    >).indexOf(listener);
    if (index === -1) {
      throw new Error(
        `[Store]: Attempted to unsubscribe, but no subscriber found for event ${eventName}`
      );
    }
    this.subscribers[eventName].splice(index, 1);
  }

  /**
   * Subscribe to a store event.
   */
  public on<EventName extends EventNames>(
    eventName: EventName,
    listener: (...args: ArgumentTypes<TStoreEvents[EventName]>) => void
  ): void {
    (this.subscribers[eventName] as Array<TStoreEvents[EventName]>).push(
      listener as TStoreEvents[EventName]
    );
  }

  /**
   * Get the current plugin state.
   */
  public getState() {
    return this.state;
  }

  /**
   * Update the store's reference to the plugin state.
   */
  private updateState(state: TPluginState) {
    this.state = state;
  }
}

export default Store;
