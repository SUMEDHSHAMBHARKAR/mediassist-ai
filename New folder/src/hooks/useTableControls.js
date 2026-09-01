import { useEffect, useMemo, useState } from "react";

import { filterBy, paginate, searchBy, sortBy } from "../utils/collection";
import useDebounce from "./useDebounce";

/**
 * useTableControls — search, filter, sort and pagination for a list page.
 *
 * Every index screen (patients, doctors, appointments, records, reports,
 * prescriptions, billing, users) uses this, so the interaction model is
 * identical everywhere and no page reimplements filtering.
 *
 * @param items          the full collection
 * @param searchFields   fields or accessors that free-text search covers
 * @param initialSort    { key, direction }
 * @param sortAccessors  { [key]: (item) => value } for computed columns
 * @param pageSize       rows per page
 */
export function useTableControls(
  items = [],
  {
    searchFields = [],
    initialSort = null,
    initialFilters = {},
    sortAccessors = {},
    pageSize = 10,
  } = {},
) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 200);

  // Any change to the query resets to the first page, otherwise a user can be
  // left staring at an empty page 4 of a 2-page result.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters, sort]);

  const processed = useMemo(() => {
    let result = items;
    if (searchFields.length > 0) result = searchBy(result, debouncedSearch, searchFields);
    result = filterBy(result, filters);
    if (sort?.key) result = sortBy(result, sort.key, sort.direction, sortAccessors);
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, debouncedSearch, filters, sort]);

  const paged = useMemo(
    () => paginate(processed, page, pageSize),
    [processed, page, pageSize],
  );

  const setFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearch("");
  };

  const isFiltered =
    Boolean(debouncedSearch) ||
    Object.entries(filters).some(
      ([key, value]) => value && value !== "all" && value !== initialFilters[key],
    );

  return {
    // query state
    search,
    setSearch,
    filters,
    setFilter,
    setFilters,
    resetFilters,
    isFiltered,
    sort,
    setSort,

    // results
    rows: paged.rows,
    filteredCount: processed.length,
    totalCount: items.length,

    // pagination
    page: paged.page,
    pageCount: paged.pageCount,
    pageSize: paged.pageSize,
    setPage,
  };
}

export default useTableControls;
