import math
from typing import Any, Generic, TypeVar
from pydantic import BaseModel
from sqlalchemy.orm import Query


T = TypeVar("T")


# =====================================================
# Paginated Response Schema
# =====================================================

class PaginatedResponse(BaseModel, Generic[T]):
    page: int
    page_size: int
    total_records: int
    total_pages: int
    next_page: int | None
    previous_page: int | None
    items: list[T]


# =====================================================
# Paginate Function
# =====================================================

def paginate(
    query: Query,
    page: int = 1,
    page_size: int = 20,
) -> dict[str, Any]:

    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20
    if page_size > 100:
        page_size = 100

    total_records = query.count()
    total_pages = math.ceil(total_records / page_size) if total_records > 0 else 0

    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    next_page = page + 1 if page < total_pages else None
    previous_page = page - 1 if page > 1 else None

    return {
        "page": page,
        "page_size": page_size,
        "total_records": total_records,
        "total_pages": total_pages,
        "next_page": next_page,
        "previous_page": previous_page,
        "items": items,
    }
