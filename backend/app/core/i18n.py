from fastapi import Request, Query
from app.core.config import settings

def get_language(request: Request = None, lang: str = Query(None)) -> str:
    """
    Get language from query parameter or Accept-Language header.
    Defaults to 'tr' if not specified or not supported.
    """
    # First check query parameter
    if lang and lang in settings.SUPPORTED_LANGUAGES:
        return lang
    
    # Then check Accept-Language header
    if request:
        accept_language = request.headers.get("Accept-Language", "")
        # Parse Accept-Language header (e.g., "en-US,en;q=0.9,tr;q=0.8")
        if accept_language:
            # Extract language codes
            languages = []
            for part in accept_language.split(","):
                lang_code = part.split(";")[0].strip().lower()[:2]  # Get first 2 chars (en, tr)
                languages.append(lang_code)
            
            # Return first supported language
            for lang_code in languages:
                if lang_code in settings.SUPPORTED_LANGUAGES:
                    return lang_code
    
    # Default to Turkish
    return settings.DEFAULT_LANGUAGE

def get_template_field(obj, field_name: str, lang: str = "tr") -> str:
    """
    Get template field value based on language.
    Returns English field if lang is 'en' and English field exists, otherwise returns Turkish field.
    """
    if lang == "en":
        en_field = f"{field_name}_en"
        if hasattr(obj, en_field):
            en_value = getattr(obj, en_field)
            # Check if en_value is not None and not empty string
            if en_value is not None and str(en_value).strip():
                return str(en_value).strip()
    # Fallback to Turkish or original field
    value = getattr(obj, field_name, None)
    return str(value).strip() if value and str(value).strip() else ""

