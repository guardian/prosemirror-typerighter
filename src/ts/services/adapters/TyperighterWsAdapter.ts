import { IBlockQuery } from "../../interfaces/IValidation";
import { ITypeRighterResponse } from "./interfaces/ITyperighter";
import TyperighterAdapter, { convertTyperighterResponse } from "./TyperighterAdapter";
import {
  TValidationReceivedCallback,
  TValidationErrorCallback,
  IValidationAPIAdapter
} from "../../interfaces/IValidationAPIAdapter";

const VALIDATOR_RESPONSE = "VALIDATOR_RESPONSE" as const;
const VALIDATOR_ERROR = "VALIDATOR_ERROR" as const;

interface ISocketValidatorResponse extends ITypeRighterResponse {
  type: typeof VALIDATOR_RESPONSE;
}

interface ISocketValidatorError {
  type: typeof VALIDATOR_ERROR;
  id: string | undefined;
  message: string;
}

type TSocketMessage = ISocketValidatorResponse | ISocketValidatorError;

/**
 * An adapter for the Typerighter service that uses WebSockets.
 */
class TyperighterWsAdapter extends TyperighterAdapter
  implements IValidationAPIAdapter {
  public fetchMatches = async (
    validationSetId: string,
    inputs: IBlockQuery[],
    categoryIds: string[],
    onValidationReceived: TValidationReceivedCallback,
    onValidationError: TValidationErrorCallback
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
          validationSetId,
          onValidationReceived,
          onValidationError
        )
      );
      socket.send(
        JSON.stringify({
          validationSetId,
          blocks
        })
      );
    });

    socket.addEventListener("close", closeEvent => {
      if (closeEvent.code !== 1000) {
        onValidationError({ validationSetId, message: closeEvent.reason });
      }
    });
  };

  private handleMessage = (
    message: MessageEvent,
    validationSetId: string,
    onValidationReceived: TValidationReceivedCallback,
    onValidationError: TValidationErrorCallback
  ) => {
    try {
      const socketMessage: TSocketMessage = JSON.parse(message.data);
      switch (socketMessage.type) {
        case VALIDATOR_ERROR: {
          return onValidationError({
            validationSetId,
            validationId: socketMessage.id,
            message: socketMessage.message
          });
        }
        case VALIDATOR_RESPONSE: {
          return onValidationReceived(
            convertTyperighterResponse(validationSetId, socketMessage)
          );
        }
      }
    } catch (e) {
      onValidationError({ validationSetId, message: e.message });
    }
  };
}

export default TyperighterWsAdapter;
