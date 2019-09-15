import fetchMock from "fetch-mock";
import { IValidationOutput } from "../interfaces/IValidation";
import ValidationAPIService from "../services/ValidationAPIService";
import Store from "../store";
import TyperighterAdapter from "../services/adapters/TyperighterAdapter";
import { ITypeRighterResponse } from "../services/adapters/interfaces/ITyperighter";
import { createValidationId } from "../utils/validation";

const createResponse = (strs: string[]): ITypeRighterResponse => ({
  input: "input",
  id: createValidationId(0, 0, 5),
  results: strs.map(str => ({
    fromPos: 0,
    toPos: str.length,
    id: createValidationId(0, 0, 5),
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

const createOutput = (id: string, inputString: string, offset: number = 0) => {
  const from = offset;
  const to = offset + inputString.length;
  return {
    validationId: id,
    matchId: "0-from:0-to:10--match-0",
    from,
    to,
    inputString,
    suggestions: [],
    annotation: "It's just a bunch of numbers, mate",
    category: {
      id: "numberCat",
      name: "The number category",
      colour: "eee"
    }
  } as IValidationOutput;
};

const validationInput = {
  from: 0,
  to: 10,
  inputString: "1234567890",
  validationId: "0-from:0-to:10"
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
    fetchMock.post("http://endpoint/check", createResponse(["1234567890"]));

    expect.assertions(1);

    service.requestValidation();
    store.emit("STORE_EVENT_NEW_VALIDATION", validationSetId, [
      validationInput
    ]);

    setTimeout(() => {
      expect(commands.applyValidationResult.mock.calls[0]).toEqual([
        {
          validationOutputs: [
            createOutput(validationInput.validationId, "1234567890")
          ],
          validationId: validationInput.validationId,
          validationSetId
        }
      ]);
      done();
    }, 100);
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
      expect(commands.applyValidationError.mock.calls[0][0]).toMatchSnapshot();
      done();
    });
  });
});
