
import { IBlock } from "../../interfaces/IMatch";
import { ITypeRighterResponse } from "./interfaces/ITyperighter";
import TyperighterAdapter from "./TyperighterAdapter";
import {
  TMatchesReceivedCallback,
  TRequestErrorCallback,
  IMatcherAdapter,
  TRequestCompleteCallback
} from "../../interfaces/IMatcherAdapter";

const MATCHER_RESPONSE = "MATCHER_RESPONSE" as const;
const REQUEST_ERROR = "REQUEST_ERROR" as const;
const REQUEST_COMPLETE = "REQUEST_COMPLETE" as const;

interface ISocketResponse extends ITypeRighterResponse {
  type: typeof MATCHER_RESPONSE;
}

interface ISocketError {
  type: typeof REQUEST_ERROR;
  id: string | undefined;
  message: string;
}

interface ISocketWorkComplete {
  type: typeof REQUEST_COMPLETE;
}

type TSocketMessage = ISocketResponse | ISocketError | ISocketWorkComplete;

/**
 * An adapter for the Typerighter service that uses WebSockets.
 */
class TyperighterWsAdapter extends TyperighterAdapter
  implements IMatcherAdapter {

  public fetchMatches = async (
    requestId: string,
    inputs: IBlock[],
    categoryIds: string[],
    onMatchesReceived: TMatchesReceivedCallback,
    onRequestError: TRequestErrorCallback,
    onRequestComplete: TRequestCompleteCallback
  ) => {
    const url = new URL(this.url)
    const socket = new WebSocket(`ws://${url.host}/checkStream`);
    const blocks = inputs.map(input => ({
      id: input.id,
      text: input.text,
      from: input.from,
      to: input.to,
      categoryIds
    }));
    const handleRequestComplete = (id: string) => {
      socket.close();
      onRequestComplete(id)
    }

    socket.addEventListener("open", () => {
      socket.addEventListener("message", event =>
        this.handleMessage(
          event,
          requestId,
          onMatchesReceived,
          onRequestError,
          handleRequestComplete
        )
      );
      socket.send(
        JSON.stringify({
          requestId,
          blocks
        })
      );
    });

    socket.addEventListener("close", closeEvent => {
      if (closeEvent.code !== 1000) {
        onRequestError({ requestId, message: closeEvent.reason, categoryIds });
      }
    });
  };

  private handleMessage = (
    message: MessageEvent,
    requestId: string,
    onMatchesReceived: TMatchesReceivedCallback,
    onRequestError: TRequestErrorCallback,
    onRequestComplete: TRequestCompleteCallback
  ) => {
    try {
      const socketMessage: TSocketMessage = JSON.parse(message.data);
      switch (socketMessage.type) {
        case REQUEST_ERROR: {
          return onRequestError({
            requestId,
            blockId: socketMessage.id,
            message: socketMessage.message,
            categoryIds: []
          });
        }
        case MATCHER_RESPONSE: {
          this.responseBuffer.push(socketMessage);
          return this.throttledHandleResponse(requestId, onMatchesReceived);
        }
        case REQUEST_COMPLETE: {
          this.flushResponseBuffer(requestId, onMatchesReceived);
          return onRequestComplete(requestId);
        }
        default: {
          const errorMessage = `Received unknown message type: ${JSON.stringify(
            socketMessage
          )}`;
          return onRequestError({
            requestId,
            message: errorMessage,
            categoryIds: []
          });
        }
      }
    } catch (e) {
      onRequestError({ requestId, message: e.message, categoryIds: [] });
    }
  };

}

export default TyperighterWsAdapter;
