import Store from "../store";
import { createInitialState } from "../state/reducer";
import { createDoc, p } from "./helpers/prosemirror";

describe("store", () => {
  it("should allow consumers to subscribe to all store events, and trigger subscriptions when those events are emitted", () => {
    const store = new Store();
    const newStateSub = jest.fn();
    const newValidationSub = jest.fn();
    const state = createInitialState(createDoc(p("Example doc")));
    store.on("STORE_EVENT_NEW_STATE", newStateSub);
    store.on("STORE_EVENT_NEW_VALIDATION", newValidationSub);

    store.emit("STORE_EVENT_NEW_STATE", state);
    expect(newStateSub.mock.calls[0]).toEqual([state]);

    const notAValidationInFlight = { exampleValidationInFlight: "" } as any;
    store.emit("STORE_EVENT_NEW_VALIDATION", notAValidationInFlight, []);
    expect(newValidationSub.mock.calls[0]).toEqual([notAValidationInFlight, []]);
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
