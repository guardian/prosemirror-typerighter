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
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"></path>
  </SvgIcon>
);
