from typing import Optional


def validate_required_fields(data: dict, required: list) -> Optional[str]:
    """
    Validate that required fields exist in the request body.
    Returns an error message string, or None if all fields present.
    """
    if not data:
        return "Request body is empty or not valid JSON"

    for field in required:
        if field not in data:
            return f"Missing required field: '{field}'"
        if data[field] is None:
            return f"Field '{field}' cannot be null"

    return None


def sanitize_string(value: str, max_length: int = 50000) -> str:
    """Trim and truncate a string to prevent abuse."""
    if not isinstance(value, str):
        return ""
    return value.strip()[:max_length]
