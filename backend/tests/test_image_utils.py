"""
Unit tests for backend/lambdas/shared/image_utils.py

Tests the strip_base64_prefix utility function against Requirements 5.1, 5.2, 5.3.
"""

import pytest
from shared.image_utils import strip_base64_prefix


class TestStripBase64Prefix:
    """Tests for strip_base64_prefix function."""

    # --- Requirement 5.1: Strip data URI prefix when present ---

    def test_strips_jpeg_prefix(self):
        """JPEG data URI prefix is correctly stripped."""
        input_data = "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
        assert strip_base64_prefix(input_data) == "/9j/4AAQSkZJRg=="

    def test_strips_png_prefix(self):
        """PNG data URI prefix is correctly stripped."""
        input_data = "data:image/png;base64,iVBORw0KGgo="
        assert strip_base64_prefix(input_data) == "iVBORw0KGgo="

    def test_strips_webp_prefix(self):
        """WebP data URI prefix is correctly stripped."""
        input_data = "data:image/webp;base64,UklGRlYA"
        assert strip_base64_prefix(input_data) == "UklGRlYA"

    def test_strips_gif_prefix(self):
        """GIF data URI prefix is correctly stripped."""
        input_data = "data:image/gif;base64,R0lGODlh"
        assert strip_base64_prefix(input_data) == "R0lGODlh"

    # --- Requirement 5.2: Raw base64 passes through unchanged ---

    def test_raw_base64_unchanged(self):
        """Raw base64 without prefix passes through unchanged."""
        raw = "/9j/4AAQSkZJRgABAQEASABIAAD"
        assert strip_base64_prefix(raw) == raw

    def test_short_base64_unchanged(self):
        """Short raw base64 string passes through unchanged."""
        raw = "AAAA"
        assert strip_base64_prefix(raw) == raw

    # --- Requirement 5.3: Never raises exceptions ---

    def test_empty_string_no_exception(self):
        """Empty string does not raise and returns empty string."""
        assert strip_base64_prefix("") == ""

    def test_arbitrary_string_no_exception(self):
        """Arbitrary non-base64 string does not raise."""
        assert strip_base64_prefix("hello world") == "hello world"

    def test_string_with_base64_comma_in_middle(self):
        """String containing 'base64,' splits correctly."""
        input_data = "something;base64,actualdata"
        assert strip_base64_prefix(input_data) == "actualdata"

    def test_only_prefix_no_payload(self):
        """Data URI prefix with empty payload returns empty string."""
        input_data = "data:image/jpeg;base64,"
        assert strip_base64_prefix(input_data) == ""

    def test_multiple_base64_occurrences(self):
        """Only splits on first occurrence of 'base64,'."""
        input_data = "data:image/png;base64,base64,realdata"
        assert strip_base64_prefix(input_data) == "base64,realdata"

    def test_special_characters_no_exception(self):
        """Special characters in input do not cause exceptions."""
        inputs = [
            "!@#$%^&*()",
            "\n\t\r",
            "data:image/jpeg;base64",  # missing trailing comma
            "base64",  # keyword without comma
            " " * 1000,
        ]
        for inp in inputs:
            # Should not raise any exceptions
            result = strip_base64_prefix(inp)
            assert isinstance(result, str)
