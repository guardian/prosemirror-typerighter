import { IPluginState, IValidationInFlight } from "./state";
import { ArgumentTypes } from "./utils/types";

export const STORE_EVENT_NEW_VALIDATION = "STORE_EVENT_NEW_VALIDATION";
export const STORE_EVENT_NEW_STATE = "STORE_EVENT_NEW_STATE";

type STORE_EVENT_NEW_VALIDATION = typeof STORE_EVENT_NEW_VALIDATION;
type STORE_EVENT_NEW_STATE = typeof STORE_EVENT_NEW_STATE;

interface IStoreEvents {
  [STORE_EVENT_NEW_VALIDATION]: (v: IValidationInFlight) => void;
  [STORE_EVENT_NEW_STATE]: (state: IPluginState) => void;
}

type EventNames = keyof IStoreEvents;

/**
 * A store to allow consumers to subscribe to validator state updates.
 */
class Store {
  private subscribers: {
    [EventName in EventNames]: Array<IStoreEvents[EventName]>
  } = {
    [STORE_EVENT_NEW_STATE]: [],
    [STORE_EVENT_NEW_VALIDATION]: []
  };

  /**
   * Notify our subscribers of a state change.
   */
  public emit<EventName extends EventNames>(
    eventName: EventName,
    ...args: ArgumentTypes<IStoreEvents[EventName]>
  ) {
    (this.subscribers[eventName] as Array<IStoreEvents[EventName]>).forEach(
      (_: any) => _(...args)
    );
  }

  /**
   * Unsubscribe to a store event.
   */
  public removeEventListener<EventName extends EventNames>(
    eventName: EventName,
    listener: IStoreEvents[EventName]
  ): void {
    const index = (this.subscribers[eventName] as Array<
      IStoreEvents[EventName]
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
    listener: (...args: ArgumentTypes<IStoreEvents[EventName]>) => void
  ): void {
    (this.subscribers[eventName] as Array<IStoreEvents[EventName]>).push(
      listener as IStoreEvents[EventName]
    );
  }
}

export default Store;
