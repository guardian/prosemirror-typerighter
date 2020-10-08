import React from "react";

interface IProps {
  isSelected?: boolean;
  className?: string;
}

const SidebarMatchContainer = ({
  isSelected,
  className,
  children,
  ...rest
}: IProps & React.HTMLProps<HTMLDivElement>) => (
  <div
    className={`SidebarMatch__container ${className || ""} ${
      isSelected ? "SidebarMatch__container--is-selected" : ""
    }`}
    {...rest}
  >
    {children}
  </div>
);

export default SidebarMatchContainer;
