import { afterEach, describe, expect, it, mock } from "bun:test";
import fetchMock from "fetch-mock";
import MatcherService from "../MatcherService";
import Store from "../../state/store";
import TyperighterAdapter, {
  convertTyperighterResponse
} from "../adapters/TyperighterAdapter";
import { ITypeRighterResponse } from "../adapters/interfaces/ITyperighter";
import { createBlockId } from "../../utils/block";
import { IMatchRequestError } from "../../interfaces/IMatch";
import { getErrorMessage } from "../../utils/error";
import { noop } from "lodash";

const createResponse = (
  strs: string[],
  fromPos: number = 0
): ITypeRighterResponse => ({
  requestId: "set-id",
  categoryIds: ["numberCat"],
  blocks: [
    {
      id: createBlockId(0, 0, 5),
      from: 0,
      to: 5,
      text: "Some text that has been checked"
    }
  ],
  matches: strs.map(str => ({
    fromPos,
    toPos: fromPos + str.length,
    id: createBlockId(0, 0, 5),
    matchedText: str,
    message: "It's just a bunch of numbers, mate",
    shortMessage: "It's just a bunch of numbers, mate",
    rule: {
      matcherType: "regex",
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
    markAsCorrect: false,
    matchContext: "whatever",
    precedingText: "whatever",
    subsequentText: ""
  }))
});

const block = {
  from: 0,
  to: 10,
  text: "1234567890",
  id: "0-from:0-to:10",
  skipRanges: []
};

const requestId = "set-id";
const store = new Store();
const endpoint = "http://typerighter-service-endpoint.rad";
const createMatcherService = () => {
  const commands = {
    applyMatcherResponse: mock(noop),
    applyRequestError: mock(noop),
    checkDirtyRangesCommand: mock(noop)
  }
  const matcherService = new MatcherService(store, new TyperighterAdapter(endpoint));
  matcherService.setCommands(commands as any);
  return { matcherService, commands };
}
const getLastRequest = () => {
  try {
    const [, request] = fetchMock.lastCall()!;
    const requestBody = JSON.parse(request!.body!.toString());
    return requestBody;
  } catch (e) {
    throw new Error(
      `Error parsing last request made to fetchMock: ${getErrorMessage(e)}`
    );
  }
};


describe("MatcherService", () => {
  afterEach(() => {
    fetchMock.reset();
  });
  // it("should issue a fetch given a block, resolving with matches and broadcasting the correct event", done => {
  //   const { matcherService, commands } = createMatcherService();
  //   const response = createResponse(["1234567890"]);
  //   fetchMock.post(`${endpoint}/check`, response);

  //   matcherService.requestFetchMatches();
  //   store.emit("STORE_EVENT_NEW_MATCHES", requestId, [block]);

  //   setTimeout(() => {
  //     expect(commands.applyMatcherResponse.mock.calls[0]).toEqual([
  //       convertTyperighterResponse("set-id", response)
  //     ]);
  //     done();
  //   }, 1);
  // });
  it("should handle request errors", done => {
    const { matcherService, commands } = createMatcherService();
    fetchMock.post(`${endpoint}/check`, 400);
    matcherService.requestFetchMatches();
    store.emit("STORE_EVENT_NEW_MATCHES", requestId, [block]);
    setTimeout(() => {
      expect(commands.applyRequestError.mock.calls[0][0]).toEqual({
        message: "400: ",
        blockId: "0-from:0-to:10",
        requestId: "set-id",
        categoryIds: [],
        type: "GENERAL_ERROR"
      } as IMatchRequestError);
      done();
    }, 1);
  });

  describe("handling skipRanges", () => {
    const blockText = "ABCDEF";
    const outgoingText = "BDF";
    const blockWithSkipRanges = {
      id: "id",
      from: 0,
      to: 6,
      text: blockText,
      skipRanges: [
        { from: 0, to: 0 },
        { from: 2, to: 2 },
        { from: 4, to: 4 }
      ]
    };
    it("should remove the skipped ranges from block text as they're passed to the Typerighter service", done => {
      const { matcherService } = createMatcherService();
      fetchMock.post(`${endpoint}/check`, 400);
      matcherService.requestFetchMatches();

      store.emit("STORE_EVENT_NEW_MATCHES", requestId, [blockWithSkipRanges]);
      setTimeout(() => {
        const { blocks } = getLastRequest();
        const expectedBlocks = [
          {
            id: "id",
            from: 0,
            to: 3,
            text: outgoingText
          }
        ];
        expect(blocks).toEqual(expectedBlocks);
        done();
      }, 1);
    });

    it("On receipt of matches, map matches that succeed skipped ranges through those ranges to ensure they're correct", done => {
      const { matcherService, commands } = createMatcherService();
      // We send the text "BDF", and create a match for the "F" at position 2
      const response = createResponse(["F"], 2);
      fetchMock.post(`${endpoint}/check`, response);
      matcherService.requestFetchMatches();

      store.emit("STORE_EVENT_NEW_MATCHES", requestId, [blockWithSkipRanges]);
      setTimeout(() => {
        // We map our match (position 2) back through three skipRanges of
        // one char each, pushing range into (5, 6).
        const matches = commands.applyMatcherResponse.mock.calls[0][0].matches[0]
        expect(matches.from).toBe(5);
        expect(matches.to).toBe(6)
        done();
      }, 1);
    });
  });
});
