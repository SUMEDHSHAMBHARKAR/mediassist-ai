import cx from "../../utils/classNames";
import SearchInput from "./SearchInput";

/**
 * Toolbar — the list-page control strip: search on the left, filters and view
 * switches on the right. Used by every index page so filters sit in one place.
 */
function Toolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search",
  filters,
  trailing,
  className,
}) {
  return (
    <div className={cx("toolbar", className)}>
      {onSearchChange && (
        <div className="toolbar__search">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            size="sm"
          />
        </div>
      )}

      {filters && <div className="toolbar__filters">{filters}</div>}
      {trailing}
    </div>
  );
}

export default Toolbar;
