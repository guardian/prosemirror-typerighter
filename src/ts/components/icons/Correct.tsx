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
   <SvgIcon {...props} xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
   <path d="M128 19.275l-7.5-6.225-85.24 68.36-25.043-24.87L0 62.95l33.397 51.158h3.13z" />
 </SvgIcon>
);
