import logging
from pathlib import Path

logger = logging.getLogger("ai.ocr")


# =====================================================
# OCR Service Interface (Infrastructure Only)
# =====================================================

class OCRService:
    """
    OCR service for extracting text from medical documents.
    Will be backed by Tesseract, AWS Textract, or Google Vision when connected.
    """

    SUPPORTED_FORMATS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff"}

    def __init__(self):
        self._initialized = False

    @property
    def is_ready(self) -> bool:
        return self._initialized

    def validate_file(self, file_path: str) -> bool:
        path = Path(file_path)
        if not path.exists():
            return False
        if path.suffix.lower() not in self.SUPPORTED_FORMATS:
            return False
        return True

    def extract_text(self, file_path: str) -> dict:
        if not self.validate_file(file_path):
            raise ValueError(f"Invalid file for OCR: {file_path}")

        raise NotImplementedError(
            "OCR service not connected. Configure OCR_PROVIDER environment variable."
        )

    def extract_structured_data(
        self,
        file_path: str,
        fields: list[str] | None = None,
    ) -> dict:
        raise NotImplementedError(
            "Structured extraction not available. Configure OCR provider."
        )


# =====================================================
# Document Chunking Utilities
# =====================================================

def chunk_text(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 200,
) -> list[str]:
    if not text:
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]

        if end < len(text):
            last_period = chunk.rfind(".")
            last_newline = chunk.rfind("\n")
            break_point = max(last_period, last_newline)
            if break_point > chunk_size * 0.5:
                end = start + break_point + 1
                chunk = text[start:end]

        chunks.append(chunk.strip())
        start = end - overlap

    return chunks


def get_ocr_service() -> OCRService:
    return OCRService()
