import os
import shutil
from fastapi import UploadFile
import boto3
from botocore.client import Config

class StorageManager:
    def __init__(self):
        self.mode = os.getenv("STORAGE_MODE", "local") # local or s3
        self.upload_dir = "static/videos"
        
        # S3 Config (Boto3)
        self.s3_client = None
        if self.mode == "s3":
            self.bucket_name = os.getenv("S3_BUCKET_NAME", "rezepttok-videos")
            
            # Construct Supabase compatible endpoint
            # User provides: abcdef.supabase.co
            # We need: https://abcdef.supabase.co/storage/v1/s3
            endpoint_raw = os.getenv("S3_ENDPOINT", "localhost:9000")
            
            if "localhost" in endpoint_raw:
                self.endpoint_url = os.getenv("S3_ENDPOINT_URL", f"http://{endpoint_raw}")
            else:
                # Assume Supabase if not localhost
                # Remove protocol if present
                clean_host = endpoint_raw.replace("https://", "").replace("http://", "")
                self.endpoint_url = f"https://{clean_host}/storage/v1/s3"
                
            self.s3_client = boto3.client(
                's3',
                endpoint_url=self.endpoint_url,
                aws_access_key_id=os.getenv("S3_ACCESS_KEY", "minioadmin"),
                aws_secret_access_key=os.getenv("S3_SECRET_KEY", "minioadmin"),
                config=Config(signature_version='s3v4'),
                region_name=os.getenv("S3_REGION", "us-east-1") # Supabase uses 'us-east-1' or ignored
            )
            # Cannot easily check bucket existence on Supabase without special perms, assume it exists.

        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)

from boto3.s3.transfer import TransferConfig

    async def save_video(self, file: UploadFile, filename: str) -> str:
        if self.mode == "s3":
            # Upload to S3 (Boto3)
            # Reset file pointer
            file.file.seek(0)
            
            # Configure transfer settings
            # Force standard PUT for files < 50MB (avoids multipart issues on strict S3 gateways)
            transfer_config = TransferConfig(multipart_threshold=50 * 1024 * 1024)

            self.s3_client.upload_fileobj(
                file.file,
                self.bucket_name,
                filename,
                ExtraArgs={'ContentType': file.content_type, 'ACL': 'public-read'},
                Config=transfer_config
            )
            
            # Return URL
            # Boto3 doesn't magically know the public URL structure, we must construct it.
            # S3_PUBLIC_URL should be set in environment: https://<project>.supabase.co/storage/v1/object/public/rezepttok-videos
            base_public_url = os.getenv("S3_PUBLIC_URL", "")
            if not base_public_url:
                # Fallback construction (risky but better than nothing)
                base_public_url = self.endpoint_url.replace("/s3", "/object/public") + f"/{self.bucket_name}"
            
            # Ensure no double slashes
            if base_public_url.endswith("/"): base_public_url = base_public_url[:-1]
                
            return f"{base_public_url}/{filename}"
        else:
            # Local Storage
            file_path = f"{self.upload_dir}/{filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            return f"/static/videos/{filename}"

storage_manager = StorageManager()
