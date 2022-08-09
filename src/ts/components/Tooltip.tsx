import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { neutral } from "@guardian/src-foundations";
import { SvgInfo } from "@guardian/src-icons";
import { Options, State } from "@popperjs/core";
import React, { useState } from "react";

export type SetBoolean = (value: boolean) => void;

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
export type SetElement = (value: any) => void;
export type SetString = (value: string) => void;

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
  offsetSide: string,
  neighbourSide: string,
  borderColor: string
) => `
    ${offsetSide}: -4px;
    &::before {
        border-${neighbourSide}: 1px solid ${borderColor};
        border-${offsetSide}: 1px solid ${borderColor};
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
  &[data-popper-placement^="top"] > .arrow {
    ${props => popperPlacement("bottom", "right", props.borderColor)}
  }
  &[data-popper-placement^="bottom"] > .arrow {
    ${props => popperPlacement("top", "left", props.borderColor)}
  }
  &[data-popper-placement^="left"] > .arrow {
    ${props => popperPlacement("right", "top", props.borderColor)}
  }
  &[data-popper-placement^="right"] > .arrow {
    ${props => popperPlacement("left", "bottom", props.borderColor)}
  }
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
  setPopperElement: SetElement;
  setArrowElement: SetElement;
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
  setOpaque,
  updatePopper,
  setReferenceElement,
  updateValues
}: {
  setOpaque: SetBoolean;
  updatePopper: Update;
  setReferenceElement: SetElement;
  updateValues: () => void;
}) => {
  const makeOpaque = () => {
    setOpaque(true);
  };

  const [thisRef, setThisRef] = useState<HTMLElement | null>(null);

  const handleMouseEnter = () => {
    setReferenceElement(thisRef);
    updateValues();
    makeOpaque();
    if (updatePopper) void updatePopper();
  };

  const handleMouseLeave = () => {
    setOpaque(false);
    if (updatePopper) void updatePopper();
  };

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
