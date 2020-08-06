import { h } from "preact";
import { JSXInternal } from "preact/src/jsx";

export default (el: h.JSX.Element) => (props: JSXInternal.HTMLAttributes<HTMLSpanElement>) => (
  <span {...props} class="Icon__container">
    {el}
  </span>
)
