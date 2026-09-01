from typing import Any
from sqlalchemy.orm import Session


# =====================================================
# Bulk Create
# =====================================================

def bulk_create(
    db: Session,
    model,
    items: list[dict[str, Any]],
    batch_size: int = 100,
) -> list:

    created = []

    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        objects = [model(**item) for item in batch]
        db.bulk_save_objects(objects, return_defaults=True)
        created.extend(objects)

    db.commit()
    return created


# =====================================================
# Bulk Update
# =====================================================

def bulk_update(
    db: Session,
    model,
    updates: list[dict[str, Any]],
    batch_size: int = 100,
) -> int:

    updated_count = 0

    for i in range(0, len(updates), batch_size):
        batch = updates[i:i + batch_size]
        db.bulk_update_mappings(model, batch)
        updated_count += len(batch)

    db.commit()
    return updated_count


# =====================================================
# Bulk Delete
# =====================================================

def bulk_delete(
    db: Session,
    model,
    ids: list[int],
    batch_size: int = 100,
) -> int:

    deleted_count = 0

    for i in range(0, len(ids), batch_size):
        batch = ids[i:i + batch_size]
        count = (
            db.query(model)
            .filter(model.id.in_(batch))
            .delete(synchronize_session=False)
        )
        deleted_count += count

    db.commit()
    return deleted_count


# =====================================================
# Bulk Upsert (Insert or Update)
# =====================================================

def bulk_upsert(
    db: Session,
    model,
    items: list[dict[str, Any]],
    unique_field: str = "id",
    batch_size: int = 100,
) -> dict[str, int]:

    created = 0
    updated = 0

    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]

        for item in batch:
            unique_value = item.get(unique_field)
            if unique_value is None:
                obj = model(**item)
                db.add(obj)
                created += 1
            else:
                existing = (
                    db.query(model)
                    .filter(getattr(model, unique_field) == unique_value)
                    .first()
                )
                if existing:
                    for key, value in item.items():
                        if key != unique_field:
                            setattr(existing, key, value)
                    updated += 1
                else:
                    obj = model(**item)
                    db.add(obj)
                    created += 1

    db.commit()
    return {"created": created, "updated": updated}
