import fetchMock from "fetch-mock";
import MatcherService from "../MatcherService";
import Store from "../../state/store";
import TyperighterAdapter, {
  convertTyperighterResponse
} from "../adapters/TyperighterAdapter";
import { ITypeRighterResponse } from "../adapters/interfaces/ITyperighter";
import { createBlockId } from "../../utils/block";

const createResponse = (strs: string[]): ITypeRighterResponse => ({
  requestId: "set-id",
  categoryIds: ["numberCat"],
  blocks: [
    {
      id: createBlockId(0, 0, 5),
      from: 0,
      to: 5,
      text: "Some text that has been checkd"
    }
  ],
  matches: strs.map(str => ({
    fromPos: 0,
    toPos: str.length,
    id: createBlockId(0, 0, 5),
    matchedText: str,
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
      issueType: "issue-type",
      suggestions: []
    },
    suggestions: [],
    markAsCorrect: false
  }))
});

const block = {
  from: 0,
  to: 10,
  text: "1234567890",
  id: "0-from:0-to:10"
};

const commands = {
  applyMatcherResponse: jest.fn(),
  applyRequestError: jest.fn(),
  checkDirtyRangesCommand: jest.fn()
};

const requestId = "set-id";

const store = new Store();

jest.mock("uuid/v4", () => () => "id");

describe("MatcherService", () => {
  afterEach(() => {
    fetchMock.reset();
    commands.applyMatcherResponse.mockReset();
  });
  it("should issue a fetch given a block, resolving with matches and broadcasting the correct event", done => {
    const service = new MatcherService(
      store,
      commands as any,
      new TyperighterAdapter("http://endpoint")
    );
    const response = createResponse(["1234567890"]);
    fetchMock.post("http://endpoint/check", response);

    expect.assertions(1);

    service.requestFetchMatches();
    store.emit("STORE_EVENT_NEW_MATCHES", requestId, [block]);

    setTimeout(() => {
      expect(commands.applyMatcherResponse.mock.calls[0]).toEqual([
        convertTyperighterResponse("set-id", response)
      ]);
      done();
    });
  });
  it("should handle request errors", done => {
    const service = new MatcherService(
      store,
      commands as any,
      new TyperighterAdapter("http://endpoint")
    );
    fetchMock.post("http://endpoint/check", 400);

    service.requestFetchMatches();
    store.emit("STORE_EVENT_NEW_MATCHES", requestId, [block]);
    setTimeout(() => {
      expect(commands.applyRequestError.mock.calls[0][0]).toEqual({
        message:
          "Error fetching matches. The server responded with status code 400: Bad Request",
        blockId: "0-from:0-to:10",
        requestId: "set-id"
      });
      done();
    });
  });
});
