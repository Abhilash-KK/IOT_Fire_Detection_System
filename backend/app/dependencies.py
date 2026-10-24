from fastapi import Header, HTTPException, status
from backend.app.config import settings


def verify_device_api_key(x_api_key: str = Header(..., alias="X-API-Key")):
    """
    Validates that the incoming ingestion request contains a valid X-API-Key header.
    Rejects unauthorized requests with 401 Unauthorized.
    """
    if not settings.DEVICE_API_KEY:
        # In case it's not configured, raise 500 configuration error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DEVICE_API_KEY is not configured on the server."
        )

    if x_api_key != settings.DEVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key header."
        )
    return x_api_key
