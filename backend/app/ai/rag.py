import logging
from sqlalchemy.orm import Session

from app.ai.vector import get_vector_store
from app.ai.prompts import SYSTEM_PROMPTS, render_prompt

logger = logging.getLogger("ai.rag")


# =====================================================
# RAG Pipeline (Infrastructure Only)
# =====================================================

class RAGPipeline:
    """
    Retrieval-Augmented Generation pipeline.
    Retrieves relevant context from vector store, then generates response.
    """

    def __init__(self, collection: str = "medical_records"):
        self.vector_store = get_vector_store(collection)
        self.collection = collection

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        filters: dict | None = None,
    ) -> list[dict]:
        if not self.vector_store.is_ready:
            logger.warning("Vector store not initialized, returning empty results")
            return []

        return self.vector_store.search(
            query=query,
            top_k=top_k,
            filters=filters,
        )

    def build_context(self, documents: list[dict]) -> str:
        if not documents:
            return ""

        context_parts = []
        for i, doc in enumerate(documents, 1):
            content = doc.get("content", "")
            context_parts.append(f"[Document {i}]\n{content}")

        return "\n\n".join(context_parts)

    def generate_prompt(
        self,
        query: str,
        context: str,
        system_prompt_key: str = "medical_assistant",
    ) -> str:
        system = SYSTEM_PROMPTS.get(system_prompt_key, SYSTEM_PROMPTS["medical_assistant"])

        prompt = (
            f"{system}\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {query}\n\n"
            f"Answer:"
        )
        return prompt

    def run(
        self,
        query: str,
        top_k: int = 5,
        filters: dict | None = None,
        system_prompt_key: str = "medical_assistant",
    ) -> dict:
        documents = self.retrieve(query, top_k, filters)
        context = self.build_context(documents)
        prompt = self.generate_prompt(query, context, system_prompt_key)

        return {
            "prompt": prompt,
            "context_documents": len(documents),
            "collection": self.collection,
            "ready": self.vector_store.is_ready,
        }


def get_rag_pipeline(collection: str = "medical_records") -> RAGPipeline:
    return RAGPipeline(collection=collection)
