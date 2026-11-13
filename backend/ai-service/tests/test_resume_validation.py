import pytest

from app.services.resume_service import validate_resume


def test_rejects_empty_file():
    with pytest.raises(ValueError, match="empty"):
        validate_resume(b"", "resume.pdf")


def test_rejects_pdf_with_wrong_signature():
    with pytest.raises(ValueError, match="valid PDF"):
        validate_resume(b"not a pdf", "resume.pdf")


def test_rejects_docx_that_is_not_a_zip():
    with pytest.raises(ValueError, match="valid DOCX"):
        validate_resume(b"not a docx", "resume.docx")


def test_rejects_unsupported_extension():
    with pytest.raises(ValueError, match="Only PDF and DOCX"):
        validate_resume(b"some bytes", "resume.txt")


def test_rejects_file_over_5mb():
    with pytest.raises(ValueError, match="5 MB"):
        validate_resume(b"x" * (5 * 1024 * 1024 + 1), "resume.pdf")
