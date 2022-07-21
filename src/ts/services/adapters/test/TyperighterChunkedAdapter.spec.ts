import { noop, partial } from "lodash";
import { ReadableStream } from "stream/web";
import { TextDecoder, TextEncoder } from "util";
import {
  readJsonSeqStream,
  RECORD_SEPARATOR
} from "../TyperighterChunkedAdapter";

describe("readJsonSeqStream", () => {
  const textDecoder = new TextDecoder();
  const textEncoder = new TextEncoder();

  const createJsonSeqArrFromRecords = (
    records: Array<Record<string, unknown>>
  ) => records.map(record => JSON.stringify(record) + RECORD_SEPARATOR);

  const createStream = (records: string[]) => {
    const stream = new ReadableStream({
      start: controller => {
        records.forEach(record =>
          controller.enqueue(textEncoder.encode(record))
        );
        controller.close();
      }
    });
    return stream.getReader();
  };

  it("should consume record-separated JSON – single record", async () => {
    const input = [{ id: 1 }];
    const jsonSeq = createJsonSeqArrFromRecords(input);
    const stream = createStream(jsonSeq);
    const outputBuffer = [] as Array<Record<string, unknown>>;

    await readJsonSeqStream(stream, textDecoder as any, message =>
      outputBuffer.push(message)
    );

    expect(outputBuffer).toEqual(input);
  });

  it("should consume record-separated JSON – multiple records", async () => {
    const input = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const jsonSeq = createJsonSeqArrFromRecords(input);
    const stream = createStream(jsonSeq);
    const outputBuffer = [] as Array<Record<string, unknown>>;

    await readJsonSeqStream(stream, textDecoder as any, message =>
      outputBuffer.push(message)
    );

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
    // recombined
    const partialMessages = longMessage
      .split('"')
      .map((msg, i) => (i > 0 ? '"' + msg : msg));
    expect(partialMessages.length).toBeGreaterThan(1);

    const stream = createStream(partialMessages);
    const outputBuffer = [] as Array<Record<string, unknown>>;

    await readJsonSeqStream(stream, textDecoder as any, message =>
      outputBuffer.push(message)
    );

    expect(outputBuffer).toEqual(input);
  });

  it("should throw when it receives invalid json", async () => {
    expect.assertions(1);
    const stream = createStream(["This is not JSON"]);

    const readInvalidStream = readJsonSeqStream(stream, textDecoder as any, noop);

    await expect(readInvalidStream).rejects.toBeInstanceOf(SyntaxError);
  });
});
