import { Fragment } from "react";

/**
 * RichText — minimal renderer for assistant output.
 *
 * Supports blank-line paragraphs, "- " bullet lists and **bold** spans. That is
 * the whole grammar: a full markdown parser is a dependency this phase does not
 * need, and rendering raw HTML from a model response would be unsafe. Everything
 * is emitted as React text nodes, so nothing from the model can inject markup.
 */

function renderInline(text, keyPrefix) {
  // Split on **bold** while keeping the delimiters' content.
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, index) => {
    if (chunk.startsWith("**") && chunk.endsWith("**") && chunk.length > 4) {
      return <strong key={`${keyPrefix}-b${index}`}>{chunk.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyPrefix}-t${index}`}>{chunk}</Fragment>;
  });
}

function RichText({ text = "" }) {
  const blocks = String(text).split(/\n{2,}/);

  return (
    <>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");
        const isList = lines.every((line) => line.trim().startsWith("- "));

        if (isList) {
          return (
            <ul key={`block-${blockIndex}`}>
              {lines.map((line, lineIndex) => (
                <li key={`li-${blockIndex}-${lineIndex}`}>
                  {renderInline(line.trim().slice(2), `li-${blockIndex}-${lineIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`block-${blockIndex}`}>
            {lines.map((line, lineIndex) => (
              <Fragment key={`line-${blockIndex}-${lineIndex}`}>
                {lineIndex > 0 && <br />}
                {renderInline(line, `p-${blockIndex}-${lineIndex}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

export default RichText;
