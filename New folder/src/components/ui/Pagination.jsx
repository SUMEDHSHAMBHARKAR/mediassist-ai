import cx from "../../utils/classNames";
import Icon from "./Icon";

/** Windowed page numbers with ellipses: 1 … 4 5 6 … 20 */
function buildPages(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [1];

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("gap-start");

  for (let page = start; page <= end; page += 1) pages.push(page);

  if (end < total - 1) pages.push("gap-end");

  pages.push(total);
  return pages;
}

/**
 * Pagination — page controls plus a result-range read-out.
 * Hidden entirely when there is a single page of results.
 */
function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onChange,
  itemLabel = "results",
  className,
}) {
  if (pageCount <= 1) {
    return total ? (
      <div className={cx("pagination", className)}>
        <span className="pagination__info">
          {total} {itemLabel}
        </span>
      </div>
    ) : null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav className={cx("pagination", className)} aria-label="Pagination">
      <span className="pagination__info">
        {from}–{to} of {total} {itemLabel}
      </span>

      <div className="pagination__pages">
        <button
          type="button"
          className="pagination__page"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <Icon name="chevronLeft" size={14} />
        </button>

        {buildPages(page, pageCount).map((entry) =>
          typeof entry === "number" ? (
            <button
              key={entry}
              type="button"
              className={cx("pagination__page", entry === page && "is-active")}
              onClick={() => onChange(entry)}
              aria-current={entry === page ? "page" : undefined}
            >
              {entry}
            </button>
          ) : (
            <span key={entry} className="pagination__ellipsis" aria-hidden="true">
              …
            </span>
          ),
        )}

        <button
          type="button"
          className="pagination__page"
          onClick={() => onChange(page + 1)}
          disabled={page === pageCount}
          aria-label="Next page"
        >
          <Icon name="chevronRight" size={14} />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
