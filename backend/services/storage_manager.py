import os
import shutil
from fastapi import UploadFile
from minio import Minio
from minio.error import S3Error

class StorageManager:
    def __init__(self):
        self.mode = os.getenv("STORAGE_MODE", "local") # local or s3
        self.upload_dir = "static/videos"
        
        # MinIO / S3 Config
        self.minio_client = None
        if self.mode == "s3":
            self.bucket_name = os.getenv("S3_BUCKET_NAME", "rezepttok-videos")
            self.minio_client = Minio(
                os.getenv("S3_ENDPOINT", "localhost:9000"),
                access_key=os.getenv("S3_ACCESS_KEY", "minioadmin"),
                secret_key=os.getenv("S3_SECRET_KEY", "minioadmin"),
                secure=os.getenv("S3_SECURE", "False").lower() == "true"
            )
            self._ensure_bucket_exists()

        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)

    def _ensure_bucket_exists(self):
        if not self.minio_client.bucket_exists(self.bucket_name):
            self.minio_client.make_bucket(self.bucket_name)

    async def save_video(self, file: UploadFile, filename: str) -> str:
        if self.mode == "s3":
            # Upload to MinIO/S3
            size = os.fstat(file.file.fileno()).st_size
            self.minio_client.put_object(
                self.bucket_name, filename, file.file, size, content_type=file.content_type
            )
            # Return URL
            public_url = os.getenv("S3_PUBLIC_URL", f"http://localhost:9000/{self.bucket_name}")
            return f"{public_url}/{filename}"
        else:
            # Local Storage
            file_path = f"{self.upload_dir}/{filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            return f"/static/videos/{filename}"

storage_manager = StorageManager()
