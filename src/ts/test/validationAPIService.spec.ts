import fetchMock from "fetch-mock";
import { ILTReplacement } from "../services/adapters/interfaces/ILanguageTool";
import createLanguageToolAdapter from "../services/adapters/languageTool";
import { IValidationOutput } from "../interfaces/IValidation";
import ValidationAPIService from "../services/ValidationAPIService";
import Store from "../store";
import { Mapping } from "prosemirror-transform";

const createResponse = (strs: string[]) => ({
  language: "",
  software: "",
  warnings: "",
  matches: strs.map(str => ({
    context: {
      text: str,
      offset: 0,
      length: str.length
    },
    length: str.length,
    message: "It's just a bunch of numbers, mate",
    offset: 0,
    replacements: [] as ILTReplacement[],
    rule: {
      category: {
        id: "numberCat",
        name: "The number category"
      },
      description: "Some type - use constants, jeez",
      id: "numbersID",
      issueType: "issueType"
    },
    sentence: str,
    shortMessage: "Bunch o' numbers",
    type: {
      typeName: "Some type - use constants, jeez"
    }
  }))
});

const createOutput = (inputString: string, offset: number = 0) => {
  const from = offset;
  const to = offset + inputString.length;
  return {
    id: "id",
    from,
    to,
    inputString,
    type: "issueType",
    suggestions: [],
    annotation: "It's just a bunch of numbers, mate"
  } as IValidationOutput;
};

const validationInput = {
  from: 0,
  to: 10,
  inputString: "1234567890",
  id: "0-from:0-to:10"
};

const commands = {
  applyValidationResult: jest.fn(),
  applyValidationError: jest.fn(),
  validateDirtyRangesCommand: jest.fn()
};

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
      createLanguageToolAdapter("endpoint/check")
    );
    fetchMock.post("endpoint/check", createResponse(["1234567890"]));

    expect.assertions(1);

    service.requestValidation();
    store.emit("STORE_EVENT_NEW_VALIDATION", {
      mapping: new Mapping(),
      validationInput
    });

    setTimeout(() => {
      expect(commands.applyValidationResult.mock.calls[0]).toEqual([
        {
          validationOutputs: [createOutput("1234567890")],
          validationInput
        }
      ]);
      done();
    });
  });
  it("should handle validation errors", done => {
    const service = new ValidationAPIService(
      store,
      commands as any,
      createLanguageToolAdapter("endpoint/check")
    );
    fetchMock.post("endpoint/check", 400);

    service.requestValidation();
    store.emit("STORE_EVENT_NEW_VALIDATION", {
      mapping: new Mapping(),
      validationInput
    });
    setTimeout(() => {
      expect(commands.applyValidationError.mock.calls[0][0]).toMatchSnapshot();
      done();
    });
  });
});
