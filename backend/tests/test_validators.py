"""
Unit tests for shared.validators module.

Tests validate_grader_input and validate_intercept_input against
Requirements 8.1, 8.2, 8.3, 8.5, 8.6, and 11.1.
"""

import pytest

from shared.validators import validate_grader_input, validate_intercept_input


# ---------------------------------------------------------------------------
# validate_grader_input tests
# ---------------------------------------------------------------------------


class TestValidateGraderInput:
    """Tests for validate_grader_input."""

    def test_valid_input(self):
        """Valid image and 6-digit zip_code returns (True, '')."""
        body = {"image": "base64encodeddata", "zip_code": "110001"}
        valid, error = validate_grader_input(body)
        assert valid is True
        assert error == ""

    def test_image_absent(self):
        """Missing image field returns (False, error mentioning 'image')."""
        body = {"zip_code": "110001"}
        valid, error = validate_grader_input(body)
        assert valid is False
        assert "image" in error.lower()

    def test_image_null(self):
        """Null image field returns (False, error mentioning 'image')."""
        body = {"image": None, "zip_code": "110001"}
        valid, error = validate_grader_input(body)
        assert valid is False
        assert "image" in error.lower()

    def test_image_empty_string(self):
        """Empty string image returns (False, error mentioning 'image')."""
        body = {"image": "", "zip_code": "110001"}
        valid, error = validate_grader_input(body)
        assert valid is False
        assert "image" in error.lower()

    def test_zip_code_absent(self):
        """Missing zip_code field returns (False, error mentioning 'zip_code')."""
        body = {"image": "base64data"}
        valid, error = validate_grader_input(body)
        assert valid is False
        assert "zip_code" in error.lower()

    def test_zip_code_null(self):
        """Null zip_code returns (False, error mentioning 'zip_code')."""
        body = {"image": "base64data", "zip_code": None}
        valid, error = validate_grader_input(body)
        assert valid is False
        assert "zip_code" in error.lower()

    def test_zip_code_empty_string(self):
        """Empty string zip_code returns (False, error mentioning 'zip_code')."""
        body = {"image": "base64data", "zip_code": ""}
        valid, error = validate_grader_input(body)
        assert valid is False
        assert "zip_code" in error.lower()

    def test_zip_code_not_6_digits(self):
        """zip_code with fewer than 6 digits is invalid."""
        body = {"image": "base64data", "zip_code": "12345"}
        valid, error = validate_grader_input(body)
        assert valid is False
        assert "zip_code" in error.lower()

    def test_zip_code_too_long(self):
        """zip_code with more than 6 digits is invalid."""
        body = {"image": "base64data", "zip_code": "1234567"}
        valid, error = validate_grader_input(body)
        assert valid is False
        assert "zip_code" in error.lower()

    def test_zip_code_non_numeric(self):
        """zip_code with non-digit characters is invalid."""
        body = {"image": "base64data", "zip_code": "11000a"}
        valid, error = validate_grader_input(body)
        assert valid is False
        assert "zip_code" in error.lower()

    def test_zip_code_with_spaces(self):
        """zip_code with spaces is invalid."""
        body = {"image": "base64data", "zip_code": "110 01"}
        valid, error = validate_grader_input(body)
        assert valid is False
        assert "zip_code" in error.lower()

    def test_zip_code_all_zeros(self):
        """zip_code '000000' is valid (6 numeric digits)."""
        body = {"image": "base64data", "zip_code": "000000"}
        valid, error = validate_grader_input(body)
        assert valid is True
        assert error == ""


# ---------------------------------------------------------------------------
# validate_intercept_input tests
# ---------------------------------------------------------------------------


class TestValidateInterceptInput:
    """Tests for validate_intercept_input."""

    def test_valid_input(self):
        """Valid zip_code and cart_item_name returns (True, '')."""
        body = {"zip_code": "110001", "cart_item_name": "Running Shoes"}
        valid, error = validate_intercept_input(body)
        assert valid is True
        assert error == ""

    def test_zip_code_absent(self):
        """Missing zip_code returns (False, error mentioning 'zip_code')."""
        body = {"cart_item_name": "Running Shoes"}
        valid, error = validate_intercept_input(body)
        assert valid is False
        assert "zip_code" in error.lower()

    def test_zip_code_null(self):
        """Null zip_code returns (False, error mentioning 'zip_code')."""
        body = {"zip_code": None, "cart_item_name": "Running Shoes"}
        valid, error = validate_intercept_input(body)
        assert valid is False
        assert "zip_code" in error.lower()

    def test_zip_code_empty_string(self):
        """Empty string zip_code returns (False, error mentioning 'zip_code')."""
        body = {"zip_code": "", "cart_item_name": "Running Shoes"}
        valid, error = validate_intercept_input(body)
        assert valid is False
        assert "zip_code" in error.lower()

    def test_cart_item_name_absent(self):
        """Missing cart_item_name returns (False, error mentioning 'cart_item_name')."""
        body = {"zip_code": "110001"}
        valid, error = validate_intercept_input(body)
        assert valid is False
        assert "cart_item_name" in error.lower()

    def test_cart_item_name_null(self):
        """Null cart_item_name returns (False, error mentioning 'cart_item_name')."""
        body = {"zip_code": "110001", "cart_item_name": None}
        valid, error = validate_intercept_input(body)
        assert valid is False
        assert "cart_item_name" in error.lower()

    def test_cart_item_name_empty_string(self):
        """Empty string cart_item_name returns (False, error mentioning 'cart_item_name')."""
        body = {"zip_code": "110001", "cart_item_name": ""}
        valid, error = validate_intercept_input(body)
        assert valid is False
        assert "cart_item_name" in error.lower()

    def test_zip_code_invalid_format(self):
        """Non-6-digit zip_code returns invalid format error."""
        body = {"zip_code": "ABC123", "cart_item_name": "Shoes"}
        valid, error = validate_intercept_input(body)
        assert valid is False
        assert "zip_code" in error.lower()

    def test_zip_code_too_short(self):
        """zip_code with fewer than 6 digits is invalid."""
        body = {"zip_code": "1100", "cart_item_name": "Shoes"}
        valid, error = validate_intercept_input(body)
        assert valid is False
        assert "zip_code" in error.lower()

    def test_zip_code_special_characters(self):
        """zip_code with special characters is invalid."""
        body = {"zip_code": "110-01", "cart_item_name": "Shoes"}
        valid, error = validate_intercept_input(body)
        assert valid is False
        assert "zip_code" in error.lower()
