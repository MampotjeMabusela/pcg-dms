import os
from ..config import settings

def save_file_local(file_bytes: bytes, filename: str) -> str:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    path = os.path.join(settings.UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return path
