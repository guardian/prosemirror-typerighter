import TyperighterAdapter from "./TyperighterAdapter";
import {
  IMatcherAdapter,
  FetchMatches
} from "../../interfaces/IMatcherAdapter";

/**
 * An adapter for the Typerighter service that parses a chunked response returning
 * [`json-seq`](https://en.wikipedia.org/wiki/JSON_streaming#Record_separator-delimited_JSON).
 */
class TyperighterChunkedAdapter extends TyperighterAdapter
  implements IMatcherAdapter {
  public fetchMatches = async ({
    requestId,
    inputs,
    categoryIds,
    excludeCategoryIds,
    onMatchesReceived,
    onRequestError,
    onRequestComplete,
  }: FetchMatches) => {
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
        blocks,
        categoryIds,
        excludeCategoryIds
      })
    });

    if (response.status > 399) {
      onRequestError({
        requestId,
        blockId: inputs[0]?.id ?? "no-id",
        message: `${response.status}: ${response.statusText}`,
        categoryIds,
        type:
          response.status === 401 || response.status === 419
            ? "AUTH_ERROR"
            : "GENERAL_ERROR"
      });
      return onRequestComplete(requestId);
    }

    const reader = response.body?.getReader();

    if (!reader) {
      onRequestError({
        requestId,
        message: "Typerighter did not send a response",
        categoryIds
      });
      return onRequestComplete(requestId);
    }

    const streamReader = readJsonSeqStream(reader, message => {
      this.responseBuffer.push(message);
      this.throttledHandleResponse(requestId, onMatchesReceived);
    });

    return streamReader
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
  // window.TextDecoder will not be defined in a NodeJS context (for our tests)..
  const textDecoder = new (window.TextDecoder ?? require("util").TextDecoder)();
  const initialChunk = await reader.read();
  // Chunks do not correspond directly with lines of JSON, so we must buffer
  // partial lines.
  let buffer = "";

  const parseAndPushMessage = (json: string) => {
    const message = JSON.parse(json.trim());
    onMessage(message);
  };

  const processStringChunk = (chunk: string) => {
    const textChunks = (buffer + chunk).split(RECORD_SEPARATOR);

    // Take everything but the tail of the array. This will either be an empty
    // string, as the preceding line will have been terminated by a newline
    // character, or a partial line.
    for (const rawJson of textChunks.slice(0, -1)) {
      const json = rawJson.trim();
      if (!json.length) {
        break;
      }

      parseAndPushMessage(json);
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
        parseAndPushMessage(buffer);
      }
      return Promise.resolve();
    }

    const textChunks = textDecoder.decode(value);
    processStringChunk(textChunks);

    return reader.read().then(streamIterator);
  };

  return streamIterator(initialChunk);
};

export default TyperighterChunkedAdapter;
