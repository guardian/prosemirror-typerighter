const squiggleMap = {
  VERTICAL: (colour: string) =>
    `<svg width="4" height="20" fill="none" transform="scale(-1,1)" xmlns="http://www.w3.org/2000/svg"><path stroke="${colour}" stroke-width="2" d="m2.08695,-2.80434c1.33333,1.72222 1.33333,3.44444 0,5.16667c-1.33333,1.72222 -1.33333,3.44444 0,5.16663c1.33333,1.7223 1.33333,3.4445 0,5.1667c-1.33333,1.7222 -1.33333,3.4444 0,5.1667c1.33333,1.7222 1.33333,3.4444 0,5.1666c-1.33333,1.7223 -1.33333,3.4445 0,5.1667"/></svg>`,
  HORIZONTAL: (colour: string) =>
    `<svg width="16" height="4" fill="none" xmlns="http://www.w3.org/2000/svg"><path stroke="${colour}" stroke-width="2" d="m22.65517,2c-1.37161,1.33333 -2.74333,1.33333 -4.11494,0c-1.37161,-1.33333 -2.74333,-1.33333 -4.11494,0c-1.37161,1.33333 -2.74333,1.33333 -4.11494,0c-1.37161,-1.33333 -2.74333,-1.33333 -4.11494,0c-1.37164,1.33333 -2.7433,1.33333 -4.11494,0c-1.37164,-1.33333 -2.7433,-1.33333 -4.11494,0"/></svg>`
};

export const getSquiggleAsUri = (
  colour: string,
  orientation: "HORIZONTAL" | "VERTICAL" = "HORIZONTAL"
) => {
  const svg = squiggleMap[orientation](colour);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const warningIcon = (colour: string) => (
  <svg
    width="20"
    height="16"
    viewBox="0 0 10 8"
    fill={colour}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
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
    <path
      d="M4.99998 0.599998C2.56531 0.599998 0.599976 2.56533 0.599976 5C0.599976 7.43466 2.56531 9.4 4.99998 9.4C7.43464 9.4 9.39997 7.43466 9.39997 5C9.39997 2.56533 7.43464 0.599998 4.99998 0.599998ZM5.49864 6.73066V6.94578C5.44975 6.98489 5.38131 7.01422 5.31286 7.05333C5.24442 7.08266 5.1662 7.112 5.08798 7.14133C5.00975 7.17066 4.93153 7.19022 4.85331 7.2C4.77509 7.20978 4.69686 7.21955 4.62842 7.21955C4.47198 7.21955 4.3742 7.19022 4.31553 7.13155C4.24709 7.07289 4.21775 7.00444 4.21775 6.936C4.21775 6.85778 4.22753 6.77955 4.23731 6.70133C4.24709 6.62311 4.26664 6.54489 4.2862 6.44711L4.69686 4.57955L4.31553 4.49155V4.28622C4.3742 4.26666 4.45242 4.23733 4.55998 4.208C4.65775 4.17867 4.76531 4.15911 4.88264 4.13955C4.99998 4.12 5.10753 4.10044 5.21509 4.09067C5.32264 4.08089 5.42042 4.07111 5.50842 4.07111L5.61597 4.13955L5.06842 6.73066H5.49864ZM5.68442 3.44533C5.59642 3.52355 5.46931 3.56266 5.32264 3.56266C5.18575 3.56266 5.06842 3.52355 4.97064 3.44533C4.88264 3.36711 4.83375 3.26933 4.83375 3.14222C4.83375 3.00533 4.88264 2.89778 4.97064 2.81955C5.05864 2.74133 5.17598 2.70222 5.32264 2.70222C5.47909 2.70222 5.59642 2.74133 5.68442 2.81955C5.77242 2.89778 5.82131 3.00533 5.82131 3.14222C5.81153 3.26933 5.77242 3.36711 5.68442 3.44533Z"
      fill={colour}
    />
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
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M0.399999 3.90998L0 4.30998L1.99999 7.10997H2.18999L7.90997 1.18999L7.50997 0.799988L2.18999 5.61997L0.399999 3.90998Z"
      fill={colour}
    />
  </svg>
);

export const iconMap = {
  CORRECT: {
    render: (dark = false) => tickIcon(dark ? "white" : "black"),
    description: "These matches are correct"
  },
  HAS_REPLACEMENT: {
    render: (dark = false) => warningIcon(dark ? "white" : "black"),
    description: "These matches are incorrect"
  },
  DEFAULT: {
    render: (dark = false) => infoIcon(dark ? "white" : "black"),
    description: "These matches are worth checking"
  }
};
