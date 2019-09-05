import { IValidationInput } from "../../interfaces/IValidation";
import { ITypeRighterResponse } from "./interfaces/ITyperighter";
import TyperighterAdapter from "./TyperighterAdapter";
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

  public fetchValidationOutputs = async (
    validationSetId: string,
    inputs: IValidationInput[],
    categoryIds: string[],
    onValidationReceived: TValidationReceivedCallback,
    onValidationError: TValidationErrorCallback
  ) => {
    const socket = new WebSocket(this.checkUrl);
    const requests = inputs.map(input => ({
      validationId: input.validationId,
      text: input.inputString,
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
          inputs: requests
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
          return onValidationReceived({
            validationSetId,
            validationId: socketMessage.id,
            validationOutputs: socketMessage.results.map(match => ({
              validationId: socketMessage.id,
              inputString: socketMessage.input,
              from: match.fromPos,
              to: match.toPos,
              annotation: match.shortMessage,
              category: match.rule.category,
              suggestions: match.suggestions
            }))
          });
        }
      }
    } catch (e) {
      onValidationError({ validationSetId, message: e.message });
    }
  };
}

export default TyperighterWsAdapter;
