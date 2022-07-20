import { IBlock } from "../../interfaces/IMatch";
import TyperighterAdapter from "./TyperighterAdapter";
import {
  TMatchesReceivedCallback,
  TRequestErrorCallback,
  IMatcherAdapter,
  TRequestCompleteCallback
} from "../../interfaces/IMatcherAdapter";

/**
 * An adapter for the Typerighter service that parses a chunked response returning
 * [`json-seq`](https://en.wikipedia.org/wiki/JSON_streaming#Record_separator-delimited_JSON).
 */
class TyperighterChunkedAdapter extends TyperighterAdapter
  implements IMatcherAdapter {
  public fetchMatches = async (
    requestId: string,
    inputs: IBlock[],
    categoryIds: string[],
    onMatchesReceived: TMatchesReceivedCallback,
    onRequestError: TRequestErrorCallback,
    onRequestComplete: TRequestCompleteCallback
  ) => {
    const blocks = inputs.map(input => ({
      id: input.id,
      text: input.text,
      from: input.from,
      to: input.to,
      categoryIds
    }));

    const response = await fetch(`${this.url}/checkStream`, {
      method: "POST",
      credentials: "include",
      headers: new Headers({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        requestId,
        blocks
      })
    });

    const reader = response.body?.getReader();

    if (!reader) {
      onRequestError({
        requestId,
        message: "Typerighter did not send a response",
        categoryIds
      });
      onRequestComplete(requestId);

      return;
    }

    const streamReader = readJsonSeqStream(reader, message => {
      this.responseBuffer.push(message);
      this.throttledHandleResponse(requestId, onMatchesReceived);
    });

    streamReader
      .catch(error => {
        onRequestError({ requestId, message: error.message, categoryIds });
      })
      .finally(() => {
        this.flushResponseBuffer(requestId, onMatchesReceived);
        onRequestComplete(requestId);
      });
  };
}

export const RECORD_SEPARATOR = String.fromCharCode(31);

export const readJsonSeqStream = async (
  reader: ReadableStreamDefaultReader,
  onMessage: (message: any) => void
): Promise<void> => {
  const decoder = new TextDecoder();
  const initialChunk = await reader.read();
  // Chunks do not correspond directly with lines of JSON, so we must buffer
  // partial lines.
  let buffer = "";

  const processStringChunk = (chunk: string, includeBuffer = true) => {
    const textChunks = (includeBuffer ? buffer + chunk : chunk).split(
      RECORD_SEPARATOR
    );

    // Take everything but the tail of the array. This will either be an empty
    // string, as the preceding line will have been terminated by a newline
    // character, or a partial line.
    for (const rawJson of textChunks.slice(0, -1)) {
      const json = rawJson.trim();
      if (!json.length) {
        break;
      }

      const message = JSON.parse(json.trim());
      onMessage(message);
    }

    // Add anything that remains to the buffer.
    buffer = (textChunks.at(-1) ?? "").trim();
  };

  const streamIterator = ({
    done,
    value
  }: ReadableStreamDefaultReadResult<Uint8Array>): Promise<void> => {
    if (done) {
      if (buffer.length) {
        // Flush anything that remains in the buffer
        processStringChunk(buffer, false);
      }
      return Promise.resolve();
    }

    const textChunks = decoder.decode(value);
    processStringChunk(textChunks);

    return reader.read().then(streamIterator);
  };

  return streamIterator(initialChunk);
};

export default TyperighterChunkedAdapter;
