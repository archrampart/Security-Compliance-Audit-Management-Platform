from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union
import json

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://archrampart:archrampart_pass@localhost:5432/archrampart_audit"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Application
    DEBUG: bool = True
    # Lokal network erişimi için tüm origin'lere izin ver (development)
    # Production'da sadece belirli domain'leri ekleyin
    ALLOWED_ORIGINS: List[str] = ["*"]  # Development için tüm origin'lere izin
    
    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    ALLOWED_FILE_EXTENSIONS: List[str] = [
        # Images
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
        # Documents
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        # Text
        ".txt", ".csv", ".md",
        # Archives (read-only, no extraction needed)
        ".zip", ".rar", ".7z"
    ]
    # Dangerous extensions that should never be allowed
    BLOCKED_FILE_EXTENSIONS: List[str] = [
        ".exe", ".bat", ".cmd", ".com", ".scr", ".vbs", ".js", ".jar",
        ".sh", ".bash", ".ps1", ".py", ".rb", ".pl", ".php", ".asp", ".aspx",
        ".html", ".htm", ".xhtml", ".dll", ".so", ".dylib"
    ]
    
    # i18n
    DEFAULT_LANGUAGE: str = "tr"
    SUPPORTED_LANGUAGES: List[str] = ["tr", "en"]
    
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            # Eğer "*" ise direkt list'e çevir (JSON parse hatasından kaçın)
            if v == "*":
                return ["*"]
            # JSON string ise parse et
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except (json.JSONDecodeError, ValueError):
                    # JSON parse hatası durumunda, string olarak devam et
                    pass
            # Comma-separated string ise split et
            if "," in v:
                return [origin.strip() for origin in v.split(",")]
            # Tek string ise list'e çevir
            return [v]
        return v
    
    @field_validator("SUPPORTED_LANGUAGES", mode="before")
    @classmethod
    def parse_supported_languages(cls, v):
        if isinstance(v, str):
            # JSON string ise parse et
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except:
                    pass
            # Comma-separated string ise split et
            if "," in v:
                return [lang.strip() for lang in v.split(",")]
            # Tek string ise list'e çevir
            return [v]
        return v
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        env_ignore_empty=True,
    )

settings = Settings()

