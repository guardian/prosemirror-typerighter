import React from "react";
import { neutral } from "@guardian/src-foundations";

export const warningIcon = (colour: string) => (
  <svg
    width="20"
    height="16"
    viewBox="0 0 10 8"
    fill={colour}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.76426 0L0.599976 6.82286L0.867118 7.2H9.13283L9.39997 6.82286L5.23569 0H4.76426ZM4.73875 4.87111H5.26122L5.50962 2.10455L5.16701 1.81333H4.83296L4.49036 2.10455L4.73875 4.87111ZM4.99999 5.38074C5.28028 5.38074 5.50962 5.61008 5.50962 5.89037C5.50962 6.17067 5.28028 6.4 4.99999 6.4C4.71969 6.4 4.49036 6.17067 4.49036 5.89037C4.49036 5.61008 4.71969 5.38074 4.99999 5.38074Z"
      fill={colour}
    />
  </svg>
);

export const infoIcon = (colour: string) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 10 10"
    fill={colour}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4.5 6.5H5.5V7.5H4.5V6.5ZM4.5 2.5H5.5V5.5H4.5V2.5ZM4.995 0C2.235 0 0 2.24 0 5C0 7.76 2.235 10 4.995 10C7.76 10 10 7.76 10 5C10 2.24 7.76 0 4.995 0ZM5 9C2.79 9 1 7.21 1 5C1 2.79 2.79 1 5 1C7.21 1 9 2.79 9 5C9 7.21 7.21 9 5 9Z" />
  </svg>
);

export const tickIcon = (colour: string) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 8 8"
    fill={colour}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0.399999 3.90998L0 4.30998L1.99999 7.10997H2.18999L7.90997 1.18999L7.50997 0.799988L2.18999 5.61997L0.399999 3.90998Z"
      fill={colour}
    />
  </svg>
);

export const iconMap = {
  OK: {
    icon: tickIcon(neutral[100]),
    description: "OK",
    tooltip: "Typerighter thinks these matches are correct."
  },
  AMEND: {
    icon: warningIcon(neutral[100]),
    description: "Amend",
    tooltip: "Typerighter doesn’t think these matches are correct."
  },
  REVIEW: {
    icon: infoIcon(neutral[100]),
    description: "Review",
    tooltip: "Typerighter can’t figure out whether these matches are correct or not. They might be worth reviewing."
  }
};
