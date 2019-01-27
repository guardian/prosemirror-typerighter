import fetchMock from "fetch-mock";
import { ILTReplacement } from "../adapters/interfaces/ILanguageTool";
import createLanguageToolAdapter from "../adapters/languageTool";
import { IValidationOutput } from "../interfaces/IValidation";
import ValidationAPIService from "../services/ValidationAPIService";
import Store from "../store";
import { createValidationInput } from "./helpers/fixtures";

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

const createOutput = (str: string, offset: number = 0) => {
  const from = offset;
  const to = offset + str.length;
  return {
    id: "id",
    from,
    to,
    str,
    type: "issueType",
    suggestions: [],
    annotation: "It's just a bunch of numbers, mate"
  } as IValidationOutput;
};

const validationInput = {
  from: 0,
  to: 10,
  str: "1234567890",
  id: "0-from:0-to:10"
};

const commands = {
  applyValidationResult: jest.fn(),
  applyValidationError: jest.fn()
};

const store = new Store();

jest.mock("uuid/v4", () => () => "id");

describe("ValidationAPIService", () => {
  afterEach(() => {
    fetchMock.reset();
    commands.applyValidationResult.mockReset();
  });
  it("should issue a fetch given a validation input, resolving with a validation output and broadcasting the correct event", async () => {
    const service = new ValidationAPIService(
      store,
      commands as any,
      createLanguageToolAdapter("endpoint/check")
    );
    fetchMock.mock("endpoint/check", createResponse(["1234567890"]));

    expect.assertions(2);

    const output = await service.validate(validationInput);

    expect(commands.applyValidationResult.mock.calls[0]).toEqual([
      {
        validationOutputs: [createOutput("1234567890")],
        validationInput
      }
    ]);
    expect(output).toEqual([createOutput("1234567890")]);
  });
  it("should handle validation errors", async () => {
    const service = new ValidationAPIService(
      store,
      commands as any,
      createLanguageToolAdapter("endpoint/check")
    );
    fetchMock.once("endpoint/check", 400);

    const output = await service.validate(createValidationInput(0, 10));
    expect(output).toMatchSnapshot();
  });
});
