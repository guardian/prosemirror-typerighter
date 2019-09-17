import fetchMock from "fetch-mock";
import ValidationAPIService from "../services/ValidationAPIService";
import Store from "../store";
import TyperighterAdapter, {
  convertTyperighterResponse
} from "../services/adapters/TyperighterAdapter";
import { ITypeRighterResponse } from "../services/adapters/interfaces/ITyperighter";
import { createBlockId } from "../utils/validation";

const createResponse = (strs: string[]): ITypeRighterResponse => ({
  requestId: "set-id",
  categoryIds: ["numberCat"],
  blocks: [
    {
      id: createBlockId(0, 0, 5),
      from: 0,
      to: 5,
      text: "Some text that has been validated"
    }
  ],
  matches: strs.map(str => ({
    fromPos: 0,
    toPos: str.length,
    id: createBlockId(0, 0, 5),
    message: "It's just a bunch of numbers, mate",
    shortMessage: "It's just a bunch of numbers, mate",
    rule: {
      category: {
        id: "numberCat",
        name: "The number category",
        colour: "eee"
      },
      description: "Number things",
      id: "number-rule",
      issueType: "issue-type"
    },
    suggestions: []
  }))
});

const validationInput = {
  from: 0,
  to: 10,
  text: "1234567890",
  id: "0-from:0-to:10"
};

const commands = {
  applyValidationResult: jest.fn(),
  applyValidationError: jest.fn(),
  validateDirtyRangesCommand: jest.fn()
};

const validationSetId = "set-id";

const store = new Store();

jest.mock("uuid/v4", () => () => "id");

describe("ValidationAPIService", () => {
  afterEach(() => {
    fetchMock.reset();
    commands.applyValidationResult.mockReset();
  });
  it("should issue a fetch given a validation input, resolving with a validation output and broadcasting the correct event", done => {
    const service = new ValidationAPIService(
      store,
      commands as any,
      new TyperighterAdapter(
        "http://endpoint/check",
        "http://endpoint/categories"
      )
    );
    const response = createResponse(["1234567890"]);
    fetchMock.post("http://endpoint/check", response);

    expect.assertions(1);

    service.requestValidation();
    store.emit("STORE_EVENT_NEW_VALIDATION", validationSetId, [
      validationInput
    ]);

    setTimeout(() => {
      expect(commands.applyValidationResult.mock.calls[0]).toEqual([
        convertTyperighterResponse("set-id", response)
      ]);
      done();
    });
  });
  it("should handle validation errors", done => {
    const service = new ValidationAPIService(
      store,
      commands as any,
      new TyperighterAdapter(
        "http://endpoint/check",
        "http://endpoint/categories"
      )
    );
    fetchMock.post("http://endpoint/check", 400);

    service.requestValidation();
    store.emit("STORE_EVENT_NEW_VALIDATION", validationSetId, [
      validationInput
    ]);
    setTimeout(() => {
      expect(commands.applyValidationError.mock.calls[0][0]).toEqual({
        message:
          "Error fetching validations. The server responded with status code 400: Bad Request",
        blockId: "0-from:0-to:10",
        requestId: "set-id"
      });
      done();
    });
  });
});
