/**
 * Collection helpers for list pages: search, filter, sort, paginate.
 *
 * These run client-side against mock data today. When the FastAPI endpoints are
 * wired up, the same shapes map onto query parameters, so the pages calling them
 * do not have to change.
 */

/** Case-insensitive substring match across the given fields. */
export function searchBy(items, query, fields) {
  const term = String(query || "").trim().toLowerCase();
  if (!term) return items;

  return items.filter((item) =>
    fields.some((field) => {
      const value = typeof field === "function" ? field(item) : item[field];
      if (value === null || value === undefined) return false;

      if (Array.isArray(value)) {
        return value.some((entry) => String(entry).toLowerCase().includes(term));
      }

      return String(value).toLowerCase().includes(term);
    }),
  );
}

/**
 * Apply an object of equality filters. Entries whose value is falsy or "all"
 * are ignored, which is what an unset <Select> produces.
 */
export function filterBy(items, filters = {}) {
  const active = Object.entries(filters).filter(
    ([, value]) => value !== "" && value !== null && value !== undefined && value !== "all",
  );

  if (active.length === 0) return items;

  return items.filter((item) =>
    active.every(([key, value]) => {
      const itemValue = item[key];
      if (Array.isArray(itemValue)) return itemValue.includes(value);
      return String(itemValue) === String(value);
    }),
  );
}

/**
 * Sort by key or accessor. Numbers and dates compare numerically; everything
 * else compares as a locale string so names order naturally.
 */
export function sortBy(items, key, direction = "asc", accessors = {}) {
  if (!key) return items;

  const accessor = accessors[key] || ((item) => item[key]);
  const factor = direction === "desc" ? -1 : 1;

  return [...items].sort((a, b) => {
    const left = accessor(a);
    const right = accessor(b);

    // Absent values always sink to the bottom regardless of direction.
    if (left === null || left === undefined) return 1;
    if (right === null || right === undefined) return -1;

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * factor;
    }

    const leftDate = Date.parse(left);
    const rightDate = Date.parse(right);
    if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
      return (leftDate - rightDate) * factor;
    }

    return String(left).localeCompare(String(right), undefined, { numeric: true }) * factor;
  });
}

/** Slice a page out of a list and report the totals a Pagination needs. */
export function paginate(items, page = 1, pageSize = 10) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    rows: items.slice(start, start + pageSize),
    page: safePage,
    pageCount,
    pageSize,
    total,
  };
}

/** Group a list into a Map keyed by an accessor result. */
export function groupBy(items, accessor) {
  return items.reduce((map, item) => {
    const key = typeof accessor === "function" ? accessor(item) : item[accessor];
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
    return map;
  }, new Map());
}

/** Sum a numeric field across a list. */
export function sumBy(items, accessor) {
  return items.reduce((total, item) => {
    const value = typeof accessor === "function" ? accessor(item) : item[accessor];
    return total + (Number(value) || 0);
  }, 0);
}

/** True when two dates fall on the same calendar day. */
export function isSameDay(a, b = new Date()) {
  const left = a instanceof Date ? a : new Date(a);
  const right = b instanceof Date ? b : new Date(b);

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isFuture(value) {
  return new Date(value).getTime() > Date.now();
}

export function isPast(value) {
  return new Date(value).getTime() < Date.now();
}
