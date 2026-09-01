from typing import Any, TypeVar, Generic, Type
from sqlalchemy.orm import Session, Query
from fastapi import HTTPException, status

from app.database import Base
from app.core.query_builder import build_query

ModelType = TypeVar("ModelType", bound=Base)


class BaseCRUD(Generic[ModelType]):
    """
    Generic base CRUD class providing standard database operations.
    Inherit this in module-specific CRUD when beneficial.

    Usage:
        class PatientCRUD(BaseCRUD[Patient]):
            model = Patient
            search_fields = ["name", "mobile_no", "address"]
    """

    model: Type[ModelType] = None
    search_fields: list[str] = []

    # =====================================================
    # Create
    # =====================================================

    def create(self, db: Session, obj: ModelType) -> ModelType:
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    # =====================================================
    # Read
    # =====================================================

    def get_by_id(self, db: Session, id: int) -> ModelType | None:
        return db.query(self.model).filter(self.model.id == id).first()

    def get_or_404(self, db: Session, id: int, resource_name: str = "Resource") -> ModelType:
        obj = self.get_by_id(db, id)
        if obj is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{resource_name} with id {id} not found",
            )
        return obj

    def get_all(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "asc",
        filters: dict | None = None,
        base_query: Query | None = None,
    ) -> dict[str, Any]:
        return build_query(
            db=db,
            model=self.model,
            filters=filters,
            search=search,
            search_fields=self.search_fields,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
            base_query=base_query,
        )

    # =====================================================
    # Update
    # =====================================================

    def update(self, db: Session, obj: ModelType, update_data: dict) -> ModelType:
        for key, value in update_data.items():
            setattr(obj, key, value)
        db.commit()
        db.refresh(obj)
        return obj

    # =====================================================
    # Delete
    # =====================================================

    def delete(self, db: Session, obj: ModelType) -> None:
        db.delete(obj)
        db.commit()

    def delete_by_id(self, db: Session, id: int, resource_name: str = "Resource") -> dict:
        obj = self.get_or_404(db, id, resource_name)
        db.delete(obj)
        db.commit()
        return {"message": f"{resource_name} deleted successfully"}

    # =====================================================
    # Count
    # =====================================================

    def count(self, db: Session) -> int:
        return db.query(self.model).count()
