import React, { useCallback, useContext, useState } from "react";
import { MappedMatch } from "../interfaces/IMatch";
import TelemetryContext from "../contexts/TelemetryContext";
import { MoreHoriz, Announcement, MailOutline } from "@mui/icons-material";

const responses = [
  "This doesn't match the style guide.",
  "This is a valid word."
];

const FeedbackFormStates = {
  CLOSED: "CLOSED",
  SELECT_RESPONSE: "SELECT_RESPONSE",
  ADD_DETAIL: "ADD_DETAIL",
  FEEDBACK_SENT: "FEEDBACK_SENT"
} as const;

export const Feedback = ({
  match,
  documentUrl
}: {
  match: MappedMatch;
  documentUrl: string;
}) => {
  const [formState, setFormState] = useState<keyof typeof FeedbackFormStates>(
    FeedbackFormStates.CLOSED
  );
  const [inputValue, setInputValue] = useState<string>("");
  const { telemetryAdapter } = useContext(TelemetryContext);
  const sendFeedback = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      telemetryAdapter?.feedbackReceived(match, inputValue, documentUrl);
      setFormState(FeedbackFormStates.FEEDBACK_SENT);
    },
    [setFormState, match, inputValue, documentUrl]
  );

  const getFormPanelFromState = useCallback(
    (state: keyof typeof FeedbackFormStates) => {
      switch (state) {
        case FeedbackFormStates.CLOSED: {
          return (
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                setFormState(FeedbackFormStates.SELECT_RESPONSE);
              }}
            >
              Issue with this result? Tell us!
            </a>
          );
        }
        case FeedbackFormStates.SELECT_RESPONSE: {
          return (
            <div className="Feedback__responses animation__pop-in">
              {responses.map(response => (
                <button
                  className="Feedback__response"
                  key={response}
                  onClick={() => {
                    setInputValue(response);
                    setFormState(FeedbackFormStates.ADD_DETAIL);
                  }}
                >
                  <Announcement fontSize="small" /> {response}
                </button>
              ))}
              <button
                className="Feedback__response"
                onClick={() => {
                  setFormState(FeedbackFormStates.ADD_DETAIL);
                }}
              >
                <MoreHoriz fontSize="small" /> Other
              </button>
            </div>
          );
        }
        case FeedbackFormStates.ADD_DETAIL: {
          return (
            <div className="Feedback__add-detail animation__pop-in">
              <div>
                <label htmlFor="Feedback__feedback-detail">
                  Add additional information here
                </label>
                <textarea
                  id="Feedback__feedback-detail"
                  className="Feedback__feedback-detail"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                />
              </div>
              <div
                className="Feedback__response Feedback__response-send"
                onClick={sendFeedback}
              >
                <MailOutline fontSize="small" />
                Send feedback
              </div>
            </div>
          );
        }
        case FeedbackFormStates.FEEDBACK_SENT: {
          return <div className="Feedback__feedback-sent">Thanks for your feedback – we really appreciate it.</div>
        }
      }
    },
    [inputValue, setInputValue, formState, sendFeedback]
  );

  return (
    <div className="Feedback__container">
      {getFormPanelFromState(formState)}
    </div>
  );
};
