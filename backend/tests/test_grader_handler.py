"""
Unit tests for the EcoBridge AI Grader Lambda handler.

Tests cover:
- Successful grading end-to-end (with mocked Rekognition)
- Input validation (missing fields, invalid base64)
- Error handling (Rekognition failure, DynamoDB failure)
- CORS headers on all responses
- Graceful degradation when DynamoDB write fails
"""

import base64
import json
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from moto import mock_aws


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_event(body_dict):
    """Create an API Gateway proxy integration event with JSON string body."""
    return {"body": json.dumps(body_dict)}


def _make_event_dict_body(body_dict):
    """Create an event with dict body (direct Lambda invocation)."""
    return {"body": body_dict}


VALID_IMAGE_BASE64 = base64.b64encode(b"fake-image-bytes").decode("utf-8")
VALID_IMAGE_WITH_PREFIX = f"data:image/jpeg;base64,{VALID_IMAGE_BASE64}"
VALID_ZIP = "110001"


def _valid_body():
    return {"image": VALID_IMAGE_BASE64, "zip_code": VALID_ZIP}


def _mock_rekognition_response(labels=None):
    """Create a mock Rekognition detect_labels response."""
    if labels is None:
        labels = [
            {"Name": "Electronics", "Confidence": 95.0},
            {"Name": "Device", "Confidence": 92.0},
        ]
    return {"Labels": labels}


# ---------------------------------------------------------------------------
# Tests: Request body parsing
# ---------------------------------------------------------------------------


class TestRequestBodyParsing:
    """Test the handler's ability to parse various body formats."""

    @mock_aws
    @patch("grader.handler.rekognition_client")
    def test_handles_string_body(self, mock_rek, dynamodb_mock):
        """Handler correctly parses JSON string body."""
        from grader.handler import lambda_handler

        mock_rek.detect_labels.return_value = _mock_rekognition_response()

        event = _make_event(_valid_body())
        response = lambda_handler(event, None)

        assert response["statusCode"] == 200

    @mock_aws
    @patch("grader.handler.rekognition_client")
    def test_handles_dict_body(self, mock_rek, dynamodb_mock):
        """Handler correctly handles dict body (direct invocation)."""
        from grader.handler import lambda_handler

        mock_rek.detect_labels.return_value = _mock_rekognition_response()

        event = _make_event_dict_body(_valid_body())
        response = lambda_handler(event, None)

        assert response["statusCode"] == 200

    @mock_aws
    def test_missing_body_returns_400(self, dynamodb_mock):
        """Handler returns 400 when body is missing."""
        from grader.handler import lambda_handler

        event = {"body": None}
        response = lambda_handler(event, None)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert "error" in body

    @mock_aws
    def test_invalid_json_body_returns_400(self, dynamodb_mock):
        """Handler returns 400 when body is not valid JSON."""
        from grader.handler import lambda_handler

        event = {"body": "not-valid-json{{{"}
        response = lambda_handler(event, None)

        assert response["statusCode"] == 400


# ---------------------------------------------------------------------------
# Tests: Input validation
# ---------------------------------------------------------------------------


class TestInputValidation:
    """Test input validation (missing fields, invalid zip_code)."""

    @mock_aws
    def test_missing_image_returns_400(self, dynamodb_mock):
        """Handler returns 400 when image field is missing."""
        from grader.handler import lambda_handler

        event = _make_event({"zip_code": VALID_ZIP})
        response = lambda_handler(event, None)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert "image" in body["error"].lower()

    @mock_aws
    def test_missing_zip_code_returns_400(self, dynamodb_mock):
        """Handler returns 400 when zip_code field is missing."""
        from grader.handler import lambda_handler

        event = _make_event({"image": VALID_IMAGE_BASE64})
        response = lambda_handler(event, None)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert "zip_code" in body["error"].lower()

    @mock_aws
    def test_invalid_zip_code_returns_400(self, dynamodb_mock):
        """Handler returns 400 for non-6-digit zip code."""
        from grader.handler import lambda_handler

        event = _make_event({"image": VALID_IMAGE_BASE64, "zip_code": "123"})
        response = lambda_handler(event, None)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert "zip_code" in body["error"].lower() or "zip" in body["error"].lower()


# ---------------------------------------------------------------------------
# Tests: Base64 decoding
# ---------------------------------------------------------------------------


class TestBase64Decoding:
    """Test base64 image decoding including prefix stripping."""

    @mock_aws
    def test_invalid_base64_returns_400(self, dynamodb_mock):
        """Handler returns 400 for invalid base64 data."""
        from grader.handler import lambda_handler

        event = _make_event({"image": "not!!!valid===base64", "zip_code": VALID_ZIP})
        response = lambda_handler(event, None)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert "Invalid image data" in body["error"]

    @mock_aws
    @patch("grader.handler.rekognition_client")
    def test_strips_data_uri_prefix(self, mock_rek, dynamodb_mock):
        """Handler strips data:image prefix before decoding."""
        from grader.handler import lambda_handler

        mock_rek.detect_labels.return_value = _mock_rekognition_response()

        event = _make_event(
            {"image": VALID_IMAGE_WITH_PREFIX, "zip_code": VALID_ZIP}
        )
        response = lambda_handler(event, None)

        assert response["statusCode"] == 200
        # Verify Rekognition was called with decoded bytes (no prefix)
        call_args = mock_rek.detect_labels.call_args
        image_bytes = call_args[1]["Image"]["Bytes"] if call_args[1] else call_args[0][0]["Image"]["Bytes"]
        assert image_bytes == b"fake-image-bytes"


# ---------------------------------------------------------------------------
# Tests: Rekognition integration
# ---------------------------------------------------------------------------


class TestRekognitionIntegration:
    """Test Rekognition service call handling."""

    @mock_aws
    @patch("grader.handler.rekognition_client")
    def test_rekognition_error_returns_500(self, mock_rek, dynamodb_mock):
        """Handler returns 500 when Rekognition fails."""
        from grader.handler import lambda_handler

        mock_rek.detect_labels.side_effect = Exception("Service unavailable")

        event = _make_event(_valid_body())
        response = lambda_handler(event, None)

        assert response["statusCode"] == 500
        body = json.loads(response["body"])
        assert "AI grading service temporarily unavailable" in body["error"]

    @mock_aws
    @patch("grader.handler.rekognition_client")
    def test_rekognition_called_with_correct_params(self, mock_rek, dynamodb_mock):
        """Handler calls Rekognition with correct parameters."""
        from grader.handler import lambda_handler

        mock_rek.detect_labels.return_value = _mock_rekognition_response()

        event = _make_event(_valid_body())
        lambda_handler(event, None)

        mock_rek.detect_labels.assert_called_once()
        call_kwargs = mock_rek.detect_labels.call_args[1]
        assert call_kwargs["MinConfidence"] == 75
        assert call_kwargs["MaxLabels"] == 15
        assert "Bytes" in call_kwargs["Image"]


# ---------------------------------------------------------------------------
# Tests: Successful grading response
# ---------------------------------------------------------------------------


class TestSuccessfulGrading:
    """Test successful grading response structure and content."""

    @mock_aws
    @patch("grader.handler.rekognition_client")
    def test_success_response_structure(self, mock_rek, dynamodb_mock):
        """Successful response contains all required fields."""
        from grader.handler import lambda_handler

        mock_rek.detect_labels.return_value = _mock_rekognition_response()

        event = _make_event(_valid_body())
        response = lambda_handler(event, None)

        assert response["statusCode"] == 200
        body = json.loads(response["body"])

        # Required response fields
        assert "health_card" in body
        assert "routing_decision" in body
        assert "green_credits" in body
        assert "carbon_saved_estimate" in body

        # Health card sub-fields
        hc = body["health_card"]
        assert "condition" in hc
        assert "detected_labels" in hc
        assert "confidence" in hc

    @mock_aws
    @patch("grader.handler.rekognition_client")
    def test_like_new_grading(self, mock_rek, dynamodb_mock):
        """Items with high-confidence positive labels grade as 'Like New'."""
        from grader.handler import lambda_handler

        labels = [
            {"Name": "Electronics", "Confidence": 95.0},
            {"Name": "Device", "Confidence": 92.0},
        ]
        mock_rek.detect_labels.return_value = _mock_rekognition_response(labels)

        event = _make_event(_valid_body())
        response = lambda_handler(event, None)

        body = json.loads(response["body"])
        assert body["health_card"]["condition"] == "Like New"
        assert body["green_credits"] == 1200
        assert body["routing_decision"] == "LOCAL_RESALE"

    @mock_aws
    @patch("grader.handler.rekognition_client")
    def test_poor_grading_with_damage(self, mock_rek, dynamodb_mock):
        """Items with damage labels grade as 'Poor'."""
        from grader.handler import lambda_handler

        labels = [
            {"Name": "Electronics", "Confidence": 95.0},
            {"Name": "Damage", "Confidence": 85.0},
        ]
        mock_rek.detect_labels.return_value = _mock_rekognition_response(labels)

        event = _make_event(_valid_body())
        response = lambda_handler(event, None)

        body = json.loads(response["body"])
        assert body["health_card"]["condition"] == "Poor"
        assert body["green_credits"] == 100
        assert body["routing_decision"] == "RECYCLE"


# ---------------------------------------------------------------------------
# Tests: DynamoDB persistence
# ---------------------------------------------------------------------------


class TestDynamoDBPersistence:
    """Test DynamoDB item writing and graceful degradation."""

    @mock_aws
    @patch("grader.handler.rekognition_client")
    def test_item_id_returned_on_success(self, mock_rek, dynamodb_mock):
        """Successful DynamoDB write includes item_id in response."""
        from grader.handler import lambda_handler

        mock_rek.detect_labels.return_value = _mock_rekognition_response()

        event = _make_event(_valid_body())
        response = lambda_handler(event, None)

        body = json.loads(response["body"])
        assert "item_id" in body
        # item_id should be a UUID format string
        assert len(body["item_id"]) == 36  # UUID length with dashes

    @mock_aws
    @patch("grader.handler.rekognition_client")
    @patch("grader.handler.dynamodb_table")
    def test_graceful_degradation_on_dynamo_failure(self, mock_table, mock_rek, dynamodb_mock):
        """Handler returns 200 without item_id if DynamoDB write fails (Req 9.2)."""
        from grader.handler import lambda_handler

        mock_rek.detect_labels.return_value = _mock_rekognition_response()
        mock_table.put_item.side_effect = Exception("DynamoDB error")

        event = _make_event(_valid_body())
        response = lambda_handler(event, None)

        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        # Grading result still returned
        assert "health_card" in body
        assert "green_credits" in body
        assert "routing_decision" in body
        assert "carbon_saved_estimate" in body
        # item_id omitted due to write failure
        assert "item_id" not in body


# ---------------------------------------------------------------------------
# Tests: CORS headers
# ---------------------------------------------------------------------------


class TestCORSHeaders:
    """Test that CORS headers are present on ALL responses."""

    def _assert_cors(self, response):
        """Assert all CORS headers are present."""
        headers = response["headers"]
        assert headers["Access-Control-Allow-Origin"] == "*"
        assert headers["Access-Control-Allow-Headers"] == "Content-Type"
        assert headers["Access-Control-Allow-Methods"] == "POST,OPTIONS"

    @mock_aws
    @patch("grader.handler.rekognition_client")
    def test_cors_on_200(self, mock_rek, dynamodb_mock):
        """CORS headers present on 200 response."""
        from grader.handler import lambda_handler

        mock_rek.detect_labels.return_value = _mock_rekognition_response()
        response = lambda_handler(_make_event(_valid_body()), None)
        self._assert_cors(response)

    @mock_aws
    def test_cors_on_400(self, dynamodb_mock):
        """CORS headers present on 400 response."""
        from grader.handler import lambda_handler

        response = lambda_handler({"body": None}, None)
        self._assert_cors(response)

    @mock_aws
    @patch("grader.handler.rekognition_client")
    def test_cors_on_500(self, mock_rek, dynamodb_mock):
        """CORS headers present on 500 response."""
        from grader.handler import lambda_handler

        mock_rek.detect_labels.side_effect = Exception("Service error")
        response = lambda_handler(_make_event(_valid_body()), None)
        self._assert_cors(response)
