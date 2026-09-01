import Icon from "../ui/Icon";

/**
 * SourceCard — one retrieved document behind a grounded answer.
 *
 * Citations are a first-class part of the AI surface, not a footnote: a clinician
 * has to be able to see what the answer was derived from.
 */
function SourceCard({ source, index, onOpen, compact = false }) {
  const Element = onOpen ? "button" : "div";

  return (
    <Element
      className="source"
      type={onOpen ? "button" : undefined}
      onClick={onOpen ? () => onOpen(source) : undefined}
    >
      {index !== undefined && (
        <span className="source__index" aria-hidden="true">
          {index + 1}
        </span>
      )}

      <span className="grow" style={{ minWidth: 0 }}>
        <span className="source__title">{source.title}</span>

        <span className="row row--tight" style={{ marginTop: 2 }}>
          <span className="t-caption">{source.collection}</span>
          {source.page && <span className="t-caption">· p.{source.page}</span>}
        </span>

        {!compact && <span className="source__excerpt">{source.excerpt}</span>}
      </span>

      <span className="col col--gap-xxs" style={{ alignItems: "flex-end", flex: "none" }}>
        {source.score !== undefined && (
          <span className="source__score">{Math.round(source.score * 100)}%</span>
        )}
        {onOpen && <Icon name="chevronRight" size={13} className="t-muted" />}
      </span>
    </Element>
  );
}

export default SourceCard;
