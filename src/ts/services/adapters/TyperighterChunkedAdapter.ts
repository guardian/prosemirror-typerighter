import { IBlock } from "../../interfaces/IMatch";
import TyperighterAdapter from "./TyperighterAdapter";
import {
  TMatchesReceivedCallback,
  TRequestErrorCallback,
  IMatcherAdapter,
  TRequestCompleteCallback
} from "../../interfaces/IMatcherAdapter";

/**
 * An adapter for the Typerighter service that uses a chunked response.
 */
class TyperighterChunkedAdapter extends TyperighterAdapter
  implements IMatcherAdapter {
  private decoder = new TextDecoder();

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

    const readStream = reader.read().then(initialChunk => {
      const RECORD_SEPARATOR = String.fromCharCode(31);
      let buffer = "";

      const processStringChunk = (chunk: string, includeBuffer = true) => {
        const textChunks = (includeBuffer ? buffer + chunk : chunk).split(RECORD_SEPARATOR);

        for (const rawJson of textChunks) {
          const json = rawJson.trim();
          if (!json.length) {
            break;
          }

          try {
            const message = JSON.parse(json.trim());
            this.responseBuffer.push(message);
            this.throttledHandleResponse(requestId, onMatchesReceived);
          } catch (e) {
            console.error(e);
          }
        }

        buffer = textChunks[textChunks.length - 1].trim();
      };

      const streamIterator = ({
        done,
        value
      }: ReadableStreamDefaultReadResult<Uint8Array>): Promise<void> => {
        if (done) {
          if (buffer.length) {
            processStringChunk(buffer, false);
          }
          return Promise.resolve();
        }

        const textChunks = this.decoder.decode(value);
        processStringChunk(textChunks);

        // Read some more, and call this function again
        return reader.read().then(streamIterator);
      };

      return streamIterator(initialChunk);
    });

    readStream
      .catch(error => {
        onRequestError({ requestId, message: error.message, categoryIds });
      })
      .finally(() => {
        onRequestComplete(requestId);
      });
  };
}

export default TyperighterChunkedAdapter;
