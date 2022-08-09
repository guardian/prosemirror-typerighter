import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { brand, neutral } from "@guardian/src-foundations";
import { SvgInfo } from "@guardian/src-icons";
import { State } from "@popperjs/core";
import React, { useEffect, useState } from "react";

export type SetBoolean = (value: boolean) => void;

export type Update = (() => Promise<Partial<State>>) | null;
type Popper = {
    styles: {
        [key: string]: React.CSSProperties;
    };
    attributes: {
        [key: string]: {
            [key: string]: string;
        } | undefined;
    };
    update: Update
}
export type SetElement = (value: any) => void;
export type SetString = (value: string) => void;

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

const fadeDuration = 300; //Milliseconds

const timeouts: number[] = [];

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
  &[data-popper-reference-hidden] {
    ::before {
      visibility: hidden;
      pointer-events: none;
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
  a {
    color: ${brand[800]};
  }
  opacity: 0;
  transition: opacity ${fadeDuration}ms;
  visibility: hidden;
  &[data-show] {
    visibility: visible;
  }
  pointer-events: none;
  &[data-opaque] {
    opacity: 1;
  }
  [data-popper-reference-hidden] {
    visibility: hidden;
    pointer-events: none;
  }
  &[data-popper-placement^="top"] > .arrow {
    bottom: -4px;
    &::before {
        border-right: 1px solid ${props => props.borderColor};
        border-bottom: 1px solid ${props => props.borderColor};
    }
  }
  &[data-popper-placement^="bottom"] > .arrow {
    top: -5px;
    &::before {
        border-left: 1px solid ${props => props.borderColor};
        border-top: 1px solid ${props => props.borderColor};
    }
  }
  &[data-popper-placement^="left"] > .arrow {
    right: -4px;
    &::before {
        border-right: 1px solid ${props => props.borderColor};
        border-top: 1px solid ${props => props.borderColor};
    }
  }
  &[data-popper-placement^="right"] > .arrow {
    left: -4px;
    &::before {
        border-left: 1px solid ${props => props.borderColor};
        border-bottom: 1px solid ${props => props.borderColor};
    }
  }
`;


export const TooltipMessage = ({ opaque, setVisible, visible, popper,  setPopperElement, setArrowElement, borderColor, children }: 
    { opaque: boolean, setVisible: SetBoolean, visible: Boolean, popper: Popper, setPopperElement: SetElement, setArrowElement: SetElement, borderColor: string; children: React.ReactNode }) => {
    const { styles, attributes } = popper;
    useEffect(() => {
        if (!opaque) {
        const timeout = setTimeout(() => {
            setVisible(false);
        }, fadeDuration);
        timeouts.push(timeout as unknown as number);
        }
    }, [opaque]);

    return (
        <TooltipBox
            ref={setPopperElement}
            style={styles.popper}
            data-show={visible || null}
            data-opaque={opaque || null}
            borderColor={borderColor}
            {...attributes.popper}
        >
            {children}
            <Arrow
            ref={setArrowElement}
            style={styles.arrow}
            className="arrow"
            data-show={visible || null}
            />
        </TooltipBox>
    );
};

export const TooltipIcon = ({setOpaque, setVisible, update, setReferenceElement, updateValues}: {setOpaque: SetBoolean, setVisible: SetBoolean, update: Update, setReferenceElement: SetElement, updateValues: () => void}) => {
    const makeOpaque = () => {
        setOpaque(true);
        setVisible(true);
        timeouts.forEach((timeout) => clearTimeout(timeout));
    };

    const [thisRef, setThisRef] = useState<HTMLElement | null>(null);

    const handleMouseEnter = () => {
        setReferenceElement(thisRef);
        updateValues();
        makeOpaque();
        if (update) void update();
    };

    const handleMouseLeave = () => {
        setOpaque(false);
        if (update) void update();
    };
    return <div
        css={infoIcon}
        ref={(ref) => {
            setThisRef(ref)
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
    >
        <SvgInfo />
    </div>
}