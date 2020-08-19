import React from "react";

import SvgIcon, { SvgIconTypeMap } from "@material-ui/core/SvgIcon";
import { DefaultComponentProps } from "@material-ui/core/OverridableComponent";

/**
 * We'd prefer to source this icon directly from material-ui, but
 * a problem with the preact integration prevents this for now. In
 * the mean time, we can wrap icons in the `SvgIcon` wrapper and
 * copy their paths manually.
 */
export default (props: DefaultComponentProps<SvgIconTypeMap<{}, "svg">>) => (
  <SvgIcon {...props} width="100%" height="100%" viewBox="0 0 24 24">
    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
  </SvgIcon>
);
