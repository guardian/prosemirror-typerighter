import Store from "../store";
import { createInitialState } from "../reducer";
import { createDoc, p } from "../../test/helpers/prosemirror";

describe("store", () => {
  it("should allow consumers to subscribe to all store events, and trigger subscriptions when those events are emitted", () => {
    const store = new Store();
    const newStateSub = jest.fn();
    const newSub = jest.fn();
    const state = createInitialState(createDoc(p("Example doc")));
    store.on("STORE_EVENT_NEW_STATE", newStateSub);
    store.on("STORE_EVENT_NEW_MATCHES", newSub);

    store.emit("STORE_EVENT_NEW_STATE", state);
    expect(newStateSub.mock.calls[0]).toEqual([state]);

    const notABlockInFlight = { exampleBlockInFlight: "" } as any;
    store.emit("STORE_EVENT_NEW_MATCHES", notABlockInFlight, []);
    expect(newSub.mock.calls[0]).toEqual([notABlockInFlight, []]);
  });
  it("should allow consumers to remove subscriptions", () => {
    const store = new Store();
    const newStateSub = jest.fn();
    store.on("STORE_EVENT_NEW_STATE", newStateSub);
    store.removeEventListener("STORE_EVENT_NEW_STATE", newStateSub);
    store.emit(
      "STORE_EVENT_NEW_STATE",
      createInitialState(createDoc(p("Example doc")))
    );
    expect(newStateSub.mock.calls.length).toBe(0);
  });
  it("should throw if a sub doesn't exist on removal", () => {
    const store = new Store();
    expect(
      store.removeEventListener.bind(store, "STORE_EVENT_NEW_STATE", () => ({}))
    ).toThrowError();
  });
});
