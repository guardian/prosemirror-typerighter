import React from "react";
import { getHtmlFromMarkdown } from "../utils/dom";

const Markdown = ({ markdown }: { markdown: string }) => (
  <div
    dangerouslySetInnerHTML={{
      __html: getHtmlFromMarkdown(markdown)
    }}
  />
);

export default Markdown;
