import cx from "../../utils/classNames";
import Icon from "./Icon";

/**
 * Table — declarative data table driven by a column config.
 *
 * columns: [{
 *   key, header, render?(row), align?: "right", sortable?: boolean,
 *   width?: string, hideOn?: "mobile", full?: boolean
 * }]
 *
 * Below 768px the table reflows into stacked label/value rows (the header text
 * is carried through `data-label`), so clinical data never needs pinch-zoom.
 */
function Table({
  columns,
  rows,
  rowKey = (row, index) => row.id ?? index,
  onRowClick,
  sort,
  onSortChange,
  selectedKey,
  caption,
  responsive = true,
  className,
}) {
  const handleSort = (key) => {
    if (!onSortChange) return;

    if (sort?.key === key) {
      onSortChange({ key, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ key, direction: "asc" });
    }
  };

  return (
    <div className="table-wrap">
      <table
        className={cx("table", responsive && "table--responsive", className)}
      >
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={cx(
                  col.align === "right" && "table__cell--num",
                  col.hideOn === "mobile" && "hide-mobile",
                )}
                aria-sort={
                  sort?.key === col.key
                    ? sort.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {col.sortable && onSortChange ? (
                  <button
                    type="button"
                    className={cx(
                      "table__sort",
                      sort?.key === col.key && "is-active",
                    )}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.header}
                    <Icon
                      name={
                        sort?.key === col.key
                          ? sort.direction === "asc"
                            ? "chevronUp"
                            : "chevronDown"
                          : "sort"
                      }
                      size={12}
                      className="table__sort-icon"
                    />
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => {
            const key = rowKey(row, index);

            return (
              <tr
                key={key}
                className={cx(
                  onRowClick && "table__row--link",
                  selectedKey === key && "is-selected",
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === "Enter") onRowClick(row);
                      }
                    : undefined
                }
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    data-label={col.stackedLabel ?? col.header}
                    className={cx(
                      col.align === "right" && "table__cell--num",
                      col.actions && "table__cell--actions",
                      col.full && "table__cell--full",
                      col.hideOn === "mobile" && "hide-mobile",
                    )}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
