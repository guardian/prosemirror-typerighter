import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { neutral } from "@guardian/src-foundations";
import { SvgInfo } from "@guardian/src-icons";
import { Options, State } from "@popperjs/core";
import React, { Dispatch, LegacyRef, SetStateAction, useState } from "react";

export type SetState<T> = Dispatch<SetStateAction<T>>

export type Update = (() => Promise<Partial<State>>) | null;
type Popper = {
  styles: {
    [key: string]: React.CSSProperties;
  };
  attributes: {
    [key: string]:
      | {
          [key: string]: string;
        }
      | undefined;
  };
  update: Update;
};

const fadeDuration = 300; //Milliseconds

export const getPopperConfig = (
  arrowElement: HTMLElement | null
): Partial<Options> => {
  return {
    placement: "top",
    modifiers: [
      {
        name: "arrow",
        options: {
          element: arrowElement
        }
      },
      {
        name: "offset",
        options: {
          offset: [0, 4]
        }
      },
      {
        name: "preventOverflow",
        options: {
          altAxis: true,
          padding: 10
        }
      }
    ]
  };
};

const infoIcon = css`
  height: 22px;
  width: 22px;
  margin-right: 4px;
  margin-left: -4px;
  svg {
    margin: -1px;
  }
  :hover {
    cursor: pointer;
  }
`;

const Arrow = styled.div`
  position: absolute;
  width: 8px;
  height: 8px;
  background: inherit;
  visibility: hidden;
  &[data-show] {
    ::before {
      visibility: visible;
    }
  }
  ::before {
    position: absolute;
    width: 8px;
    height: 8px;
    background: inherit;
    content: "";
    transform: rotate(45deg);
  }
`;

const popperPlacement = (
  popperSide: string,
  offsetSide: string,
  neighbourSide: string,
  borderColor: string
) => `
  &[data-popper-placement^=${popperSide}] > .arrow {
    ${offsetSide}: -4px;
    &::before {
        border-${neighbourSide}: 1px solid ${borderColor};
        border-${offsetSide}: 1px solid ${borderColor};
    }
  }
`;

const TooltipBox = styled.div<{ borderColor: string }>`
  background-color: ${neutral[100]};
  color: ${neutral[7]};
  width: 260px;
  font-weight: 300;
  font-size: 0.9rem;
  border: 1px solid ${props => props.borderColor};
  border-radius: 4px;
  line-height: 1.2rem;
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 30%));
  z-index: 10;
  p {
    margin: 10px;
  }
  opacity: 0;
  transition: opacity ${fadeDuration}ms;
  pointer-events: none;
  &[data-opaque="true"] {
    opacity: 1;
  }
  ${props => popperPlacement("top", "bottom", "right", props.borderColor)}
  ${props => popperPlacement("bottom", "top", "left", props.borderColor)}
  ${props => popperPlacement("left", "right", "top", props.borderColor)}
  ${props => popperPlacement("right", "left", "bottom", props.borderColor)}
`;

export const TooltipMessage = ({
  opaque,
  popper,
  setPopperElement,
  setArrowElement,
  borderColor,
  children
}: {
  opaque: boolean;
  popper: Popper;
  setPopperElement: LegacyRef<HTMLDivElement>;
  setArrowElement: LegacyRef<HTMLDivElement>;
  borderColor: string;
  children: React.ReactNode;
}) => {
  const { styles, attributes } = popper;
  return (
    <TooltipBox
      ref={setPopperElement}
      style={styles.popper}
      data-opaque={opaque}
      borderColor={borderColor}
      {...attributes.popper}
    >
      {children}
      <Arrow
        ref={setArrowElement}
        style={styles.arrow}
        className="arrow"
        data-show={opaque}
      />
    </TooltipBox>
  );
};

export const TooltipIcon = ({
  getMouseEnterHandler,
  handleMouseLeave
}: {
  getMouseEnterHandler: (ref: HTMLElement | null) => () => void;
  handleMouseLeave: () => void;
}) => {
  const [thisRef, setThisRef] = useState<HTMLElement | null>(null);
  const handleMouseEnter = getMouseEnterHandler(thisRef);

  return (
    <div
      css={infoIcon}
      ref={ref => {
        setThisRef(ref);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SvgInfo />
    </div>
  );
};
