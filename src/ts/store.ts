import { IPluginState } from "./state/reducer";
import { ArgumentTypes } from "./utils/types";
import { IBlockMatches, IBlockQuery } from "./interfaces/IValidation";

export const STORE_EVENT_NEW_VALIDATION = "STORE_EVENT_NEW_VALIDATION";
export const STORE_EVENT_NEW_STATE = "STORE_EVENT_NEW_STATE";
export const STORE_EVENT_NEW_DIRTIED_RANGES = "STORE_EVENT_DOCUMENT_DIRTIED";

type STORE_EVENT_NEW_VALIDATION = typeof STORE_EVENT_NEW_VALIDATION;
type STORE_EVENT_NEW_STATE = typeof STORE_EVENT_NEW_STATE;
type STORE_EVENT_NEW_DIRTIED_RANGES = typeof STORE_EVENT_NEW_DIRTIED_RANGES;

export interface IStoreEvents<TValidationMeta extends IBlockMatches> {
  [STORE_EVENT_NEW_VALIDATION]: (
    validationSetId: string,
    v: IBlockQuery[]
  ) => void;
  [STORE_EVENT_NEW_STATE]: (state: IPluginState<TValidationMeta>) => void;
  [STORE_EVENT_NEW_DIRTIED_RANGES]: () => void;
}

type EventNames = keyof IStoreEvents<IBlockMatches>;

/**
 * A store to allow consumers to subscribe to validator state updates.
 */
class Store<
  TValidationOutput extends IBlockMatches,
  TStoreEvents extends IStoreEvents<TValidationOutput> = IStoreEvents<
    TValidationOutput
  >
> {
  private state: IPluginState<TValidationOutput> | undefined;
  private subscribers: {
    [EventName in EventNames]: Array<TStoreEvents[EventName]>
  } = {
    [STORE_EVENT_NEW_STATE]: [],
    [STORE_EVENT_NEW_VALIDATION]: [],
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
  private updateState(state: IPluginState<TValidationOutput>) {
    this.state = state;
  }
}

export default Store;
