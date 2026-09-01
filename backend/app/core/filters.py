from datetime import date
from sqlalchemy.orm import Query
from sqlalchemy import Column


# =====================================================
# Filter Operations
# =====================================================

def apply_equals(query: Query, column: Column, value) -> Query:
    return query.filter(column == value)


def apply_contains(query: Query, column: Column, value: str) -> Query:
    return query.filter(column.ilike(f"%{value}%"))


def apply_starts_with(query: Query, column: Column, value: str) -> Query:
    return query.filter(column.ilike(f"{value}%"))


def apply_ends_with(query: Query, column: Column, value: str) -> Query:
    return query.filter(column.ilike(f"%{value}"))


def apply_greater_than(query: Query, column: Column, value) -> Query:
    return query.filter(column > value)


def apply_less_than(query: Query, column: Column, value) -> Query:
    return query.filter(column < value)


def apply_date_range(
    query: Query,
    column: Column,
    date_from: date | None = None,
    date_to: date | None = None,
) -> Query:
    if date_from is not None:
        query = query.filter(column >= date_from)
    if date_to is not None:
        query = query.filter(column <= date_to)
    return query


# =====================================================
# Filter Mapping
# =====================================================

FILTER_OPERATIONS = {
    "equals": apply_equals,
    "contains": apply_contains,
    "starts_with": apply_starts_with,
    "ends_with": apply_ends_with,
    "greater_than": apply_greater_than,
    "less_than": apply_less_than,
}


# =====================================================
# Apply Filters
# =====================================================

def apply_filters(
    query: Query,
    model,
    filters: dict | None = None,
) -> Query:

    if not filters:
        return query

    for field, value in filters.items():
        if value is None:
            continue

        column = getattr(model, field, None)
        if column is None:
            continue

        if isinstance(value, dict):
            operation = value.get("op", "equals")
            filter_value = value.get("value")
            if filter_value is None:
                continue

            if operation == "date_range":
                date_from = value.get("from")
                date_to = value.get("to")
                query = apply_date_range(query, column, date_from, date_to)
            elif operation in FILTER_OPERATIONS:
                query = FILTER_OPERATIONS[operation](query, column, filter_value)
        else:
            query = apply_equals(query, column, value)

    return query
