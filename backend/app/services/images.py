import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024


def save_property_images(property_id: int, files: list[UploadFile]) -> list[str]:
    target_dir = Path(settings.UPLOAD_DIR) / "properties" / str(property_id)
    target_dir.mkdir(parents=True, exist_ok=True)

    saved_urls = []
    for file in files:
        ext = Path(file.filename or "").suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            continue

        contents = file.file.read()
        if len(contents) > MAX_FILE_SIZE_BYTES:
            continue

        filename = f"{uuid.uuid4().hex}{ext}"
        (target_dir / filename).write_bytes(contents)
        saved_urls.append(f"/uploads/properties/{property_id}/{filename}")

    return saved_urls
