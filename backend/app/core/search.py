from sqlalchemy.orm import Query
from sqlalchemy import or_, Column


# =====================================================
# Apply Search
# =====================================================

def apply_search(
    query: Query,
    model,
    search: str | None = None,
    search_fields: list[str] | None = None,
) -> Query:

    if not search or not search_fields:
        return query

    search_term = f"%{search}%"
    conditions = []

    for field in search_fields:
        column = getattr(model, field, None)
        if column is None:
            continue
        conditions.append(column.ilike(search_term))

    if conditions:
        query = query.filter(or_(*conditions))

    return query
