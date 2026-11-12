
import io
import zipfile

from pypdf import PdfReader
from docx import Document


MAX_RESUME_SIZE = 5 * 1024 * 1024


def validate_resume(file_bytes: bytes, filename: str) -> str:
    """
    Validate the actual file content, not just its extension.
    Returns: pdf or docx
    """

    if not file_bytes:
        raise ValueError("The uploaded resume is empty.")

    if len(file_bytes) > MAX_RESUME_SIZE:
        raise ValueError("Resume must not exceed 5 MB.")

    extension = filename.lower().rsplit(".", 1)[-1]

    if extension == "pdf":
        if not file_bytes.startswith(b"%PDF-"):
            raise ValueError("The uploaded file is not a valid PDF.")

        return "pdf"

    if extension == "docx":
        if not zipfile.is_zipfile(io.BytesIO(file_bytes)):
            raise ValueError("The uploaded file is not a valid DOCX.")

        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as archive:
                if "word/document.xml" not in archive.namelist():
                    raise ValueError("Invalid DOCX document structure.")

                if archive.testzip() is not None:
                    raise ValueError("The DOCX file is corrupted.")

        except zipfile.BadZipFile as error:
            raise ValueError("Invalid DOCX file.") from error

        return "docx"

    raise ValueError("Only PDF and DOCX files are supported.")


def extract_pdf_text(file_bytes: bytes) -> str:
    """Extract text from a PDF document."""

    reader = PdfReader(io.BytesIO(file_bytes), strict=True)

    if reader.is_encrypted:
        raise ValueError("Password-protected PDFs are not supported.")

    extracted_pages = []

    for page in reader.pages:
        page_text = page.extract_text() or ""
        extracted_pages.append(page_text)

    return "\n\n".join(extracted_pages).strip()


def extract_docx_text(file_bytes: bytes) -> str:
    """Extract paragraphs and table content from a DOCX document."""

    document = Document(io.BytesIO(file_bytes))

    extracted_content = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()

        if text:
            extracted_content.append(text)

    for table in document.tables:
        for row in table.rows:
            cells = [
                cell.text.strip().replace("\n", " ")
                for cell in row.cells
            ]

            extracted_content.append(" | ".join(cells))

    return "\n".join(extracted_content).strip()


def extract_resume_text(file_bytes: bytes, filename: str) -> dict:
    """
    Validate and extract resume content.
    The original file is processed in memory only.
    """

    file_type = validate_resume(file_bytes, filename)

    try:
        if file_type == "pdf":
            extracted_text = extract_pdf_text(file_bytes)
        else:
            extracted_text = extract_docx_text(file_bytes)

    except Exception as error:
        if isinstance(error, ValueError):
            raise

        raise ValueError(
            "Unable to read the uploaded resume. "
            "Please upload a valid PDF or DOCX file."
        ) from error

    if not extracted_text.strip():
        raise ValueError(
            "No readable text was found in the resume. "
            "Scanned PDFs are not supported yet."
        )

    return {
        "file_type": file_type,
        "extracted_text": extracted_text,
        "character_count": len(extracted_text),
    }
