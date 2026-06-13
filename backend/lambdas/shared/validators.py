"""
Input validation helpers for EcoBridge backend Lambda functions.

Provides validation for incoming request bodies to ensure required fields
are present, non-empty, and conform to expected formats before processing.
"""

import re

# Compiled regex for 6-digit numeric zip code validation
_ZIP_CODE_PATTERN = re.compile(r"^\d{6}$")


def _validate_zip_code(zip_code: str) -> tuple[bool, str]:
    """Validate that zip_code is exactly 6 numeric digits.

    Args:
        zip_code: The zip code string to validate.

    Returns:
        (True, "") if valid, (False, error_message) if invalid.
    """
    if not _ZIP_CODE_PATTERN.match(zip_code):
        return False, "Invalid zip_code format. Must be a 6-digit numeric string."
    return True, ""


def validate_grader_input(body: dict) -> tuple[bool, str]:
    """Validate input for the EcoBridge_AI_Grader Lambda.

    Checks that 'image' and 'zip_code' fields are present, non-empty,
    and that zip_code is a 6-digit numeric string.

    Args:
        body: The parsed request body dictionary.

    Returns:
        (True, "") if all validations pass.
        (False, error_message) if any validation fails.
    """
    # Check image field
    image = body.get("image")
    if not image:
        return False, "Missing required field: image"

    # Check zip_code field
    zip_code = body.get("zip_code")
    if not zip_code:
        return False, "Missing required field: zip_code"

    # Validate zip_code format
    return _validate_zip_code(zip_code)


def validate_intercept_input(body: dict) -> tuple[bool, str]:
    """Validate input for the EcoBridge_Checkout_Intercept Lambda.

    Checks that 'zip_code' and 'cart_item_name' fields are present, non-empty,
    and that zip_code is a 6-digit numeric string.

    Args:
        body: The parsed request body dictionary.

    Returns:
        (True, "") if all validations pass.
        (False, error_message) if any validation fails.
    """
    # Check zip_code field
    zip_code = body.get("zip_code")
    if not zip_code:
        return False, "Missing required field: zip_code"

    # Check cart_item_name field
    cart_item_name = body.get("cart_item_name")
    if not cart_item_name:
        return False, "Missing required field: cart_item_name"

    # Validate zip_code format
    return _validate_zip_code(zip_code)
