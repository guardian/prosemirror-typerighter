import { IPluginState } from "./state";

type Subscriber = (state: IPluginState) => void;

/**
 * A store to allow consumers to subscribe to validator state updates.
 */
class Store {
  private subscribers: Subscriber[] = [];
  private state: IPluginState;

  /**
   * Notify our subscribers of a state change.
   */
  public notify(state: IPluginState) {
    this.state = state;
    this.subscribers.forEach(_ => _(state));
  }

  /**
   * Get the currently held state.
   */
  public getState() {
    return this.state;
  }

  /**
   * 
   * Subscribe to state updates.
   */
  public subscribe(subscriber: Subscriber) {
    this.subscribers.push(subscriber);
  }

  /**
   * Unsubscribe to state updates.
   */
  public unsubscribe(subscriber: Subscriber) {
    const index = this.subscribers.indexOf(subscriber);
    if (index === -1) {
      throw new Error(
        "[Store]: Attempted to unsubscribe, but no subscriber found"
      );
    }
    this.subscribers.splice(index, 1);
  }
}

export default Store;
