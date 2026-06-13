"""
Image processing utilities for EcoBridge backend Lambda functions.

Provides helpers for handling base64-encoded image data from the frontend,
including stripping data URI prefixes before decoding.
"""


def strip_base64_prefix(image_data: str) -> str:
    """Safely remove data URI prefix from a base64 image string.

    Strips the ``data:image/{format};base64,`` prefix if present, returning
    only the raw base64 payload. If no prefix is detected, the input is
    returned unchanged.

    This function never raises an exception for any string input.

    Args:
        image_data: A base64-encoded image string, optionally prefixed with
            a data URI scheme (e.g. ``data:image/jpeg;base64,/9j/4AAQ...``).

    Returns:
        The raw base64 string with any data URI prefix removed.

    Examples:
        >>> strip_base64_prefix("data:image/jpeg;base64,/9j/4AAQ")
        '/9j/4AAQ'
        >>> strip_base64_prefix("/9j/4AAQ")
        '/9j/4AAQ'
        >>> strip_base64_prefix("")
        ''
    """
    if "base64," in image_data:
        return image_data.split("base64,", 1)[1]
    return image_data
