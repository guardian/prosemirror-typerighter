import fetchMock from "fetch-mock";
import ValidationAPIService, {
  ValidationEvents
} from "../ValidationAPIService";
import { ValidationOutput } from "../interfaces/Validation";
import { LTResponse, LTReplacement } from "../interfaces/LanguageTool";

const service = new ValidationAPIService("endpoint/check");

describe("ValidationAPIService", () => {
  it("should issue a fetch given a validation input, resolving with a validation output and broadcasting the correct event", async () => {
    fetchMock.once("endpoint/check", {
      language: "",
      software: "",
      warnings: "",
      matches: [
        {
          context: {
            text: "1234567890",
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
name:				"The number category"
			},
            description: "Check if things are bunches of numbers",
            id: "numbersID",
            issueType: "issueType"
          },
          sentence: "1234567890",
          shortMessage: "Bunch o' numbers",
          type: {
            typeName: "Validation"
          }
        }
      ]
    } as LTResponse);
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
    fetchMock.once("endpoint/check", {
      headers: {
        contentType: "application/json"
      }
    });
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
