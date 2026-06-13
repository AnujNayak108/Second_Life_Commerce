"""Unit tests for build_cors_response utility function."""

import json

from shared.response import build_cors_response


class TestBuildCorsResponse:
    """Tests for build_cors_response covering normal and edge cases."""

    def test_success_response_structure(self):
        """Response has correct statusCode, headers, and JSON-stringified body."""
        result = build_cors_response(200, {"message": "ok"})

        assert result["statusCode"] == 200
        assert result["headers"]["Access-Control-Allow-Origin"] == "*"
        assert result["headers"]["Access-Control-Allow-Headers"] == "Content-Type"
        assert result["headers"]["Access-Control-Allow-Methods"] == "POST,OPTIONS"
        assert json.loads(result["body"]) == {"message": "ok"}

    def test_error_400_response(self):
        """Error bodies are correctly serialized with CORS headers."""
        result = build_cors_response(400, {"error": "Missing required field"})

        assert result["statusCode"] == 400
        assert result["headers"]["Access-Control-Allow-Origin"] == "*"
        assert json.loads(result["body"]) == {"error": "Missing required field"}

    def test_error_500_response(self):
        """Server error responses include all CORS headers."""
        result = build_cors_response(500, {"error": "Internal server error"})

        assert result["statusCode"] == 500
        assert result["headers"]["Access-Control-Allow-Origin"] == "*"
        assert result["headers"]["Access-Control-Allow-Headers"] == "Content-Type"
        assert result["headers"]["Access-Control-Allow-Methods"] == "POST,OPTIONS"

    def test_empty_body(self):
        """Empty dict body serializes to '{}'."""
        result = build_cors_response(200, {})

        assert result["statusCode"] == 200
        assert json.loads(result["body"]) == {}

    def test_nested_objects(self):
        """Nested dicts and lists are correctly JSON-serialized."""
        body = {
            "health_card": {
                "condition": "Like New",
                "detected_labels": ["Footwear", "Shoe"],
                "confidence": 96.7,
            },
            "routing_decision": "LOCAL_RESALE",
            "green_credits": 1200,
        }
        result = build_cors_response(200, body)

        parsed = json.loads(result["body"])
        assert parsed["health_card"]["condition"] == "Like New"
        assert parsed["health_card"]["detected_labels"] == ["Footwear", "Shoe"]
        assert parsed["green_credits"] == 1200

    def test_body_is_json_string(self):
        """The body field in the response is a string, not a dict."""
        result = build_cors_response(200, {"key": "value"})

        assert isinstance(result["body"], str)

    def test_all_three_cors_headers_present(self):
        """All three CORS headers are always present regardless of status."""
        for status in [200, 400, 500]:
            result = build_cors_response(status, {"test": True})
            assert "Access-Control-Allow-Origin" in result["headers"]
            assert "Access-Control-Allow-Headers" in result["headers"]
            assert "Access-Control-Allow-Methods" in result["headers"]
