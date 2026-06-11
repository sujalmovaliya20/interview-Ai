import pytest
from app.docs.extractor import DocumentExtractor
from app.docs.exceptions import EmptyDocumentError, UnsupportedMimeTypeError

@pytest.mark.asyncio
async def test_extract_txt_utf8():
    text = "Hello World! This is a test."
    file_bytes = text.encode('utf-8')
    extracted = await DocumentExtractor.extract(file_bytes, 'text/plain', 'test.txt')
    assert extracted == text

@pytest.mark.asyncio
async def test_extract_txt_latin1():
    text = "Röyksopp"
    file_bytes = text.encode('latin-1')
    extracted = await DocumentExtractor.extract(file_bytes, 'text/plain', 'test.txt')
    assert extracted == text

@pytest.mark.asyncio
async def test_extract_txt_empty():
    file_bytes = b""
    with pytest.raises(EmptyDocumentError):
        await DocumentExtractor.extract(file_bytes, 'text/plain', 'test.txt')

@pytest.mark.asyncio
async def test_unsupported_mime():
    with pytest.raises(UnsupportedMimeTypeError):
        await DocumentExtractor.extract(b"123", 'image/png', 'test.png')

def test_clean_text_removes_null_bytes():
    text = "Hello\x00 World"
    cleaned = DocumentExtractor._clean_text(text)
    assert cleaned == "Hello World"

def test_clean_text_normalises_whitespace():
    text = "Hello     World  \n\n\n\n Test"
    cleaned = DocumentExtractor._clean_text(text)
    assert cleaned == "Hello World\n\nTest"
