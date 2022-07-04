import React, { useEffect, useState } from "react";
import { IWikiSuggestion } from "../interfaces/IMatch";
import { getErrorMessage } from "../utils/error";

type IProps = IWikiSuggestion & {
  applySuggestion?: () => void;
};

interface IWikiThumbnail {
  source: string;
  width: number;
  height: number;
}

interface IWikiResponse {
  query: {
    pages: {
      [pageid: string]: IWikiArticleSummary;
    };
  };
}

interface IWikiArticleSummary {
  extract: string;
  ns: number;
  pageid: number;
  title: string;
  thumbnail?: IWikiThumbnail;
}

const WikiSuggestion = ({
  text,
  title,
  applySuggestion
}: IProps) => {
  const [article, setArticle] = useState(undefined as
    | IWikiArticleSummary
    | undefined);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(undefined as undefined | string);

  useEffect(
    () => {
      (async () => {
        setLoading(true);
        try {
          setArticle(await fetchWikiData(title));
        } catch (e) {
          setError(getErrorMessage(e));
        } finally {
          setLoading(false);
        }
      })();
    },
    [text]
  );

  return (
    <div className="WikiSuggestion__container">
      <div className="WikiSuggestion__text">
        <div className="WikiSuggestion__suggestion" onClick={applySuggestion}>
          {text}
        </div>
        {article && (
          <>
            <div className="WikiSuggestion__extract">
              {article.extract.slice(0, 220)}...
              <a
                className="WikiSuggestion__link"
                href={getWikiUrl(title)}
                target="_blank"
              />
            </div>
          </>
        )}
        {!article && isLoading && (
          <div className="WikiSuggestion__extract--placeholder" />
        )}
      </div>
      <div
        className={`WikiSuggestion__thumbnail ${isLoading &&
          "WikiSuggestion__thumbnail--placeholder"}`}
        style={{
          backgroundImage:
            article && article.thumbnail
              ? `url(${article.thumbnail.source})`
              : ""
        }}
      />
      {error ? <p>Error: {error}</p> : null}
    </div>
  );
};

const fetchWikiData = async (title: string) => {
  try {
    const response = await fetch(getWikiApiUrl(title), {
      headers: new Headers([
        ["Origin", window.location.origin],
        ["Content-Type", "application/json; charset=UTF-8"]
      ])
    });
    const wikiResponse = await response.json();
    const article = getArticleFromResponse(wikiResponse);
    if (!article) {
      throw new Error(`No articles found for resource with title ${title}`);
    }
    return article;
  } catch (e) {
    throw new Error(`Error parsing data from wikipedia: ${getErrorMessage(e)}`);
  }
};

const getArticleFromResponse = (
  wikiResponse: IWikiResponse
): IWikiArticleSummary | undefined => {
  return Object.values(wikiResponse.query.pages)[0] as
    | IWikiArticleSummary
    | undefined;
};

const getWikiUrl = (resourceName: string) =>
  `https://wikipedia.com/wiki/${resourceName}`;

const getWikiApiUrl = (resourceName: string) =>
  `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=pageimages|extracts&exintro&explaintext&piprop=thumbnail&pithumbsize=200&redirects=1&titles=${resourceName}&origin=*`;

export default WikiSuggestion;
