import cx from "../../utils/classNames";

/**
 * Timeline — vertical hairline with dot markers. Used for patient history,
 * appointment activity and audit trails.
 *
 * items: [{ id, title, meta, body?, tone?: "accent"|"critical"|"success" }]
 */
function Timeline({ items, className }) {
  return (
    <ol className={cx("timeline", className)}>
      {items.map((item, index) => (
        <li className="timeline__item" key={item.id ?? index}>
          <span
            className={cx("timeline__dot", item.tone && `timeline__dot--${item.tone}`)}
            aria-hidden="true"
          />

          <div className="col col--gap-xxs">
            <div className="row row--between row--wrap" style={{ gap: "var(--s-xs)" }}>
              <span className="t-data t-ink">{item.title}</span>
              {item.meta && <span className="t-caption">{item.meta}</span>}
            </div>
            {item.body && <p className="t-body-sm">{item.body}</p>}
            {item.footer}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default Timeline;
