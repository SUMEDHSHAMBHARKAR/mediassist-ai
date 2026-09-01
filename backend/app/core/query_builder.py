from typing import Any
from sqlalchemy.orm import Query, Session
from sqlalchemy import asc, desc

from app.core.filters import apply_filters
from app.core.search import apply_search
from app.core.pagination import paginate


# =====================================================
# Apply Sorting
# =====================================================

def apply_sorting(
    query: Query,
    model,
    sort_by: str | None = None,
    sort_order: str = "asc",
) -> Query:

    if not sort_by:
        return query

    column = getattr(model, sort_by, None)
    if column is None:
        return query

    if sort_order == "desc":
        query = query.order_by(desc(column))
    else:
        query = query.order_by(asc(column))

    return query


# =====================================================
# Build Query
# =====================================================

def build_query(
    db: Session,
    model,
    filters: dict | None = None,
    search: str | None = None,
    search_fields: list[str] | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 20,
    base_query: Query | None = None,
) -> dict[str, Any]:

    if base_query is None:
        query = db.query(model)
    else:
        query = base_query

    query = apply_filters(
        query=query,
        model=model,
        filters=filters,
    )

    query = apply_search(
        query=query,
        model=model,
        search=search,
        search_fields=search_fields,
    )

    query = apply_sorting(
        query=query,
        model=model,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    return paginate(
        query=query,
        page=page,
        page_size=page_size,
    )
