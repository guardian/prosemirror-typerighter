import { noop } from "lodash";
import { ReadableStream } from "stream/web";
import { TextEncoder } from "util";
import { IMatcherResponse } from "../../../interfaces/IMatch";
import TyperighterChunkedAdapter, {
  readJsonSeqStream,
  RECORD_SEPARATOR
} from "../TyperighterChunkedAdapter";

const textEncoder = new TextEncoder();

const createJsonSeqArrFromRecords = (records: any[]) =>
  records.map(record => JSON.stringify(record) + RECORD_SEPARATOR);

const createStream = (records: string[]) =>
  new ReadableStream({
    start: controller => {
      records.forEach(record => controller.enqueue(textEncoder.encode(record)));
      controller.close();
    }
  });

describe("TyperighterChunkedAdapter", () => {
  const localFetch = global.fetch;
  const onReceived = jest.fn();
  const onError = jest.fn();
  const onComplete = jest.fn();

  const mockFetchBody = (partialRequest: Partial<Response>) =>
    (global.fetch = jest.fn(() => Promise.resolve(partialRequest) as any));

  afterAll(() => {
    global.fetch = localFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call `onMatchesReceived` for each record in a successful response, and finally call `onRequestComplete`", async () => {
    const adapter = new TyperighterChunkedAdapter("https://example.com");
    const input: IMatcherResponse[] = [
      {
        blocks: [],
        categoryIds: ["1"],
        matches: [],
        requestId: "request-id"
      },
      {
        blocks: [],
        categoryIds: ["2"],
        matches: [],
        requestId: "request-id"
      }
    ];
    const jsonSeq = createJsonSeqArrFromRecords(input);
    const stream = createStream(jsonSeq);
    mockFetchBody({ body: stream });

    await adapter.fetchMatches(
      "request-id",
      [],
      [],
      onReceived,
      onError,
      onComplete
    );

    expect(onReceived).toHaveBeenCalledWith(input[0]);
    expect(onReceived).toHaveBeenCalledWith(input[1]);
    expect(onComplete).toHaveBeenCalled();
  });

  it("should call `onRequestError` for an empty response, and finally call `onRequestComplete`", async () => {
    const adapter = new TyperighterChunkedAdapter("https://example.com");
    mockFetchBody({ body: undefined });

    await adapter.fetchMatches(
      "request-id",
      [],
      [],
      onReceived,
      onError,
      onComplete
    );

    expect(onError.mock.calls[0][0]).toMatchObject({
      message: "Typerighter did not send a response"
    });
    expect(onComplete).toHaveBeenCalled();
  });

  it("it should call `onRequestError` for an non-2XX response, and finally call `onRequestComplete`", async () => {
    const adapter = new TyperighterChunkedAdapter("https://example.com");
    mockFetchBody({ status: 500, statusText: "Server error" });

    await adapter.fetchMatches(
      "request-id",
      [],
      [],
      onReceived,
      onError,
      onComplete
    );

    expect(onError.mock.calls[0][0]).toMatchObject({
      message: "Typerighter did not send a response"
    });
    expect(onComplete).toHaveBeenCalled();
  });
});

describe("readJsonSeqStream", () => {
  it("should consume record-separated JSON – single record", async () => {
    const input = [{ id: 1 }];
    const jsonSeq = createJsonSeqArrFromRecords(input);
    const stream = createStream(jsonSeq).getReader();
    const outputBuffer = [] as Array<Record<string, unknown>>;

    await readJsonSeqStream(stream, message => outputBuffer.push(message));

    expect(outputBuffer).toEqual(input);
  });

  it("should consume record-separated JSON – multiple records", async () => {
    const input = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const jsonSeq = createJsonSeqArrFromRecords(input);
    const stream = createStream(jsonSeq).getReader();
    const outputBuffer = [] as Array<Record<string, unknown>>;

    await readJsonSeqStream(stream, message => outputBuffer.push(message));

    expect(outputBuffer).toEqual(input);
  });

  it("should buffer incomplete records", async () => {
    const input = [
      {
        id: 1,
        type: "LONG_RECORD",
        description:
          "This is a long record that will be split into multiple parts"
      }
    ];
    const [longMessage] = createJsonSeqArrFromRecords(input);

    // Split a single record into multiple strings that are only valid when
    // recombined. By splitting on a double quote, we have lots of little records
    const partialMessages = longMessage
      .split('"')
      .map((msg, i) => (i > 0 ? '"' + msg : msg));
    expect(partialMessages.length).toBeGreaterThan(1);

    const stream = createStream(partialMessages).getReader();
    const outputBuffer = [] as Array<Record<string, unknown>>;

    await readJsonSeqStream(stream, message => outputBuffer.push(message));

    expect(outputBuffer).toEqual(input);
  });

  it("should throw when it receives invalid json", async () => {
    expect.assertions(1);
    const stream = createStream(["This is not JSON"]).getReader();

    const readInvalidStream = readJsonSeqStream(stream, noop);

    await expect(readInvalidStream).rejects.toBeInstanceOf(SyntaxError);
  });
});
