import { IBlock } from "../../interfaces/IValidation";
import { ITypeRighterResponse } from "./interfaces/ITyperighter";
import TyperighterAdapter, {
  convertTyperighterResponse
} from "./TyperighterAdapter";
import {
  TValidationReceivedCallback,
  TValidationErrorCallback,
  IValidationAPIAdapter,
  TValidationWorkCompleteCallback
} from "../../interfaces/IValidationAPIAdapter";

const VALIDATOR_RESPONSE = "VALIDATOR_RESPONSE" as const;
const VALIDATOR_ERROR = "VALIDATOR_ERROR" as const;
const VALIDATOR_WORK_COMPLETE = "VALIDATOR_WORK_COMPLETE" as const;

interface ISocketValidatorResponse extends ITypeRighterResponse {
  type: typeof VALIDATOR_RESPONSE;
}

interface ISocketValidatorError {
  type: typeof VALIDATOR_ERROR;
  id: string | undefined;
  message: string;
}

interface ISocketValidatorWorkComplete {
  type: typeof VALIDATOR_WORK_COMPLETE;
}

type TSocketMessage =
  | ISocketValidatorResponse
  | ISocketValidatorError
  | ISocketValidatorWorkComplete;

/**
 * An adapter for the Typerighter service that uses WebSockets.
 */
class TyperighterWsAdapter extends TyperighterAdapter
  implements IValidationAPIAdapter {

  public fetchMatches = async (
    requestId: string,
    inputs: IBlock[],
    categoryIds: string[],
    onValidationReceived: TValidationReceivedCallback,
    onValidationError: TValidationErrorCallback,
    onValidationComplete: TValidationWorkCompleteCallback
  ) => {
    const socket = new WebSocket(this.checkUrl);
    const blocks = inputs.map(input => ({
      id: input.id,
      text: input.text,
      from: input.from,
      to: input.to,
      categoryIds
    }));

    socket.addEventListener("open", () => {
      socket.addEventListener("message", event =>
        this.handleMessage(
          event,
          requestId,
          onValidationReceived,
          onValidationError,
          onValidationComplete
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
        onValidationError({ requestId, message: closeEvent.reason });
      }
    });
  };

  private handleMessage = (
    message: MessageEvent,
    requestId: string,
    onValidationReceived: TValidationReceivedCallback,
    onValidationError: TValidationErrorCallback,
    onValidationComplete: TValidationWorkCompleteCallback
  ) => {
    try {
      const socketMessage: TSocketMessage = JSON.parse(message.data);
      switch (socketMessage.type) {
        case VALIDATOR_ERROR: {
          return onValidationError({
            requestId,
            blockId: socketMessage.id,
            message: socketMessage.message
          });
        }
        case VALIDATOR_RESPONSE: {
          return onValidationReceived(
            convertTyperighterResponse(requestId, socketMessage)
          );
        }
        case VALIDATOR_WORK_COMPLETE: {
          return onValidationComplete(requestId);
        }
        default: {
          return onValidationError({
            requestId,
            message: `Received unknown message type: ${JSON.stringify(
              socketMessage
            )}`
          });
        }
      }
    } catch (e) {
      onValidationError({ requestId, message: e.message });
    }
  };
}

export default TyperighterWsAdapter;
