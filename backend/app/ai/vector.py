import logging
from typing import Any

logger = logging.getLogger("ai.vector")


# =====================================================
# Vector Store Interface (Infrastructure Only)
# =====================================================

class VectorStore:
    """
    Abstract vector store interface for semantic search.
    Will be backed by ChromaDB, Pinecone, or pgvector when connected.
    """

    def __init__(self, collection_name: str = "default"):
        self.collection_name = collection_name
        self._initialized = False

    def initialize(self) -> None:
        logger.info(f"Vector store '{self.collection_name}' initialization pending")
        self._initialized = False

    @property
    def is_ready(self) -> bool:
        return self._initialized

    def add_documents(
        self,
        documents: list[str],
        metadatas: list[dict] | None = None,
        ids: list[str] | None = None,
    ) -> None:
        raise NotImplementedError("Vector store not connected")

    def search(
        self,
        query: str,
        top_k: int = 5,
        filters: dict | None = None,
    ) -> list[dict[str, Any]]:
        raise NotImplementedError("Vector store not connected")

    def delete(self, ids: list[str]) -> None:
        raise NotImplementedError("Vector store not connected")

    def count(self) -> int:
        raise NotImplementedError("Vector store not connected")


# =====================================================
# Collection Registry
# =====================================================

COLLECTIONS = {
    "medical_records": "Patient medical records for semantic search",
    "prescriptions": "Prescription data for drug interaction queries",
    "reports": "Medical reports for analysis",
    "knowledge_base": "General medical knowledge base",
}


def get_vector_store(collection: str = "medical_records") -> VectorStore:
    if collection not in COLLECTIONS:
        raise ValueError(f"Unknown collection: {collection}")
    return VectorStore(collection_name=collection)
