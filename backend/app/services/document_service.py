from __future__ import annotations

import asyncio
from io import BytesIO
from typing import Any


class DocumentServiceError(Exception):
    """Base error for document extraction failures."""


class EmptyDocumentError(DocumentServiceError, ValueError):
    """Raised when PDF input bytes are empty."""


class InvalidPDFError(DocumentServiceError, ValueError):
    """Raised when the provided bytes do not appear to be a PDF document."""


class DocumentProcessingError(DocumentServiceError, RuntimeError):
    """Raised when Docling fails to extract text from a PDF."""


class DocumentService:
    """Extract readable text from PDF bytes using Docling."""

    def __init__(self) -> None:
        self._converter: Any | None = None

    async def extract_text(self, pdf_bytes: bytes) -> str:
        """Extract structured text from PDF bytes.

        Args:
            pdf_bytes: Raw PDF document bytes.

        Returns:
            A normalized UTF-8 string containing the extracted document text.

        Raises:
            EmptyDocumentError: If `pdf_bytes` is empty.
            InvalidPDFError: If the input does not look like a PDF.
            DocumentProcessingError: If Docling cannot process the PDF.
        """

        self._validate_input(pdf_bytes)

        try:
            return await asyncio.to_thread(self._extract_text_sync, pdf_bytes)
        except DocumentServiceError:
            raise
        except Exception as exc:
            raise DocumentProcessingError(
                "Unexpected failure while extracting text from the PDF."
            ) from exc

    def _validate_input(self, pdf_bytes: bytes) -> None:
        if not pdf_bytes:
            raise EmptyDocumentError("PDF input cannot be empty.")

        if not pdf_bytes.lstrip().startswith(b"%PDF-"):
            raise InvalidPDFError("Input does not appear to be a valid PDF file.")

    def _extract_text_sync(self, pdf_bytes: bytes) -> str:
        converter = self._get_converter()
        document_stream = self._create_document_stream(pdf_bytes)

        try:
            conversion_result = converter.convert(document_stream)
        except Exception as exc:
            raise DocumentProcessingError(
                "Docling failed to extract text from the provided PDF."
            ) from exc

        document = getattr(conversion_result, "document", None)
        if document is None:
            raise DocumentProcessingError(
                "Docling returned no document for the provided PDF."
            )

        extracted_text = document.export_to_markdown()
        text = self._normalize_text(extracted_text)

        if not text:
             raise DocumentProcessingError(
                "No readable text could be extracted from the PDF."
            )

        return text
       

    def _get_converter(self) -> Any:
        if self._converter is not None:
            return self._converter

        try:
            from docling.datamodel.base_models import InputFormat
            from docling.document_converter import (
                DocumentConverter as DoclingDocumentConverter,
            )
        except ModuleNotFoundError as exc:
            raise DocumentProcessingError(
                "Docling is not installed or is unavailable in the current environment."
            ) from exc

        self._converter = DoclingDocumentConverter(allowed_formats=[InputFormat.PDF])
        return self._converter

    def _create_document_stream(self, pdf_bytes: bytes) -> Any:
        try:
            from docling.datamodel.base_models import DocumentStream
        except ModuleNotFoundError as exc:
            raise DocumentProcessingError(
                "Docling is not installed or is unavailable in the current environment."
            ) from exc

        return DocumentStream(name="document.pdf", stream=BytesIO(pdf_bytes))

    def _normalize_text(self, text: str) -> str:
        return text.replace("\r\n", "\n").replace("\r", "\n").strip()