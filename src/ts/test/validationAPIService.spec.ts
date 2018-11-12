import fetchMock from "fetch-mock";
import ValidationAPIService, {
  ValidationEvents
} from "../ValidationAPIService";
import { ValidationOutput } from "../interfaces/Validation";
import { LTResponse, LTReplacement } from "../interfaces/LanguageTool";

const service = new ValidationAPIService("endpoint/check");
const createResponse = (strs: string[]) =>
  strs.map(str => ({
    language: "",
    software: "",
    warnings: "",
    matches: [
      {
        context: {
          text: str,
          offset: 0,
          length: 10
        },
        length: 10,
        message: "It's just a bunch of numbers, mate",
        offset: 0,
        replacements: [] as LTReplacement[],
        rule: {
          category: {
            id: "numberCat",
            name: "The number category"
          },
          description: "Check if things are bunches of numbers",
          id: "numbersID",
          issueType: "issueType"
        },
        sentence: str,
        shortMessage: "Bunch o' numbers",
        type: {
          typeName: "Validation"
        }
      }
    ]
  }));

describe("ValidationAPIService", () => {
  it("should issue a fetch given a validation input, resolving with a validation output and broadcasting the correct event", async () => {
    fetchMock.once("endpoint/check", createResponse(["1234567890"]));
    expect.assertions(2);
    const expectedOutput = [
      {
        from: 0,
        to: 10,
        str: "1234567890",
        type: "Some type - use constants, jeez",
        annotation: "It's just a bunch of numbers, mate"
      }
    ] as ValidationOutput[];
    service.on(ValidationEvents.VALIDATION_SUCCESS, output =>
      expect(output).toEqual(expectedOutput)
    );
    const output = await service.validate(
      [
        {
          from: 0,
          to: 10,
          str: "1234567890"
        }
      ],
      "id"
    );
    expect(output).toEqual(expectedOutput);
  });
  it("should handle multiple validation inputs", async () => {
    fetchMock.once(
      "endpoint/check",
      createResponse(["1234567890", "1234567890"])
    );
    const output = await service.validate(
      [
        {
          from: 0,
          to: 10,
          str: "1234567890"
        }
      ],
      "id"
    );
    expect(output).toEqual([
      {
        from: 0,
        to: 10,
        str: "1234567890",
        type: "Some type - use constants, jeez",
        annotation: "It's just a bunch of numbers, mate"
      }
    ] as ValidationOutput[]);
  });
  it("should handle validation errors", () => {});
});
