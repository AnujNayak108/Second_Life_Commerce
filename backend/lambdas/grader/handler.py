"""
AWS Lambda handler for the EcoBridge AI Grader (/grade endpoint).

Receives a base64-encoded image and zip_code, uses Rekognition to assess
item condition, calculates Green Credits, and lists the item in DynamoDB.

boto3 clients are instantiated at module level for connection reuse
across warm Lambda invocations.
"""

import base64
import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3

from grader.grading_logic import apply_grading_heuristics
from shared.image_utils import strip_base64_prefix
from shared.response import build_cors_response
from shared.validators import validate_grader_input

# Environment configuration
TABLE_NAME = os.environ.get("TABLE_NAME", "EcoBridge_Listings")

# boto3 clients instantiated outside handler for connection reuse
rekognition_client = boto3.client("rekognition")
dynamodb_client = boto3.resource("dynamodb")
dynamodb_table = dynamodb_client.Table(TABLE_NAME)


def lambda_handler(event, context):
    """Main Lambda handler for POST /grade.

    Parses the request body, validates input, calls Rekognition for label
    detection, applies grading heuristics, persists item to DynamoDB, and
    returns a structured health_card response.

    Args:
        event: API Gateway Lambda Proxy Integration event.
        context: Lambda runtime context (unused).

    Returns:
        dict matching API Gateway Lambda Proxy Integration response format
        with CORS headers on all responses (200, 400, 500).
    """
    try:
        # Step 1: Parse JSON body from event
        body = _parse_request_body(event)
        if body is None:
            return build_cors_response(400, {"error": "Invalid or missing request body."})

        # Step 2: Validate input fields (image, zip_code)
        is_valid, error_message = validate_grader_input(body)
        if not is_valid:
            return build_cors_response(400, {"error": error_message})

        # Step 3: Strip base64 prefix and decode image
        image_data = body["image"]
        raw_base64 = strip_base64_prefix(image_data)

        try:
            image_bytes = base64.b64decode(raw_base64)
        except Exception:
            return build_cors_response(
                400, {"error": "Invalid image data. Please capture a clear photo."}
            )

        # Step 4: Call Rekognition detect_labels
        try:
            rek_response = rekognition_client.detect_labels(
                Image={"Bytes": image_bytes},
                MinConfidence=75,
                MaxLabels=15,
            )
        except Exception:
            return build_cors_response(
                500, {"error": "AI grading service temporarily unavailable."}
            )

        labels = rek_response.get("Labels", [])
        # Normalize labels to dicts with Name and Confidence
        label_dicts = [
            {"Name": label["Name"], "Confidence": label["Confidence"]}
            for label in labels
        ]

        # Step 5: Apply grading heuristics
        condition, green_credits, routing_decision, carbon_estimate = (
            apply_grading_heuristics(label_dicts)
        )

        # Determine product_name from top detected label or default
        product_name = _derive_product_name(label_dicts)

        # Determine confidence score (highest relevant confidence)
        confidence = _get_top_confidence(label_dicts)

        # Detected label names for response and storage
        detected_label_names = [label["Name"] for label in label_dicts]

        # Step 6: Write item to DynamoDB (graceful degradation on failure)
        item_id = _persist_to_dynamodb(
            zip_code=body["zip_code"],
            condition=condition,
            green_credits=green_credits,
            carbon_estimate=carbon_estimate,
            product_name=product_name,
            detected_labels=detected_label_names,
        )

        # Step 7: Build and return success response
        response_body = {
            "health_card": {
                "condition": condition,
                "detected_labels": detected_label_names,
                "confidence": confidence,
            },
            "routing_decision": routing_decision,
            "green_credits": green_credits,
            "carbon_saved_estimate": carbon_estimate,
        }

        # Only include item_id if DynamoDB write succeeded
        if item_id is not None:
            response_body["item_id"] = item_id

        return build_cors_response(200, response_body)

    except Exception:
        # Catch-all to ensure CORS headers on unhandled exceptions
        return build_cors_response(
            500, {"error": "An unexpected error occurred. Please try again."}
        )


def _parse_request_body(event):
    """Parse JSON body from API Gateway event.

    Handles both string body (standard proxy integration) and dict body
    (e.g., direct Lambda invocation or test events).

    Args:
        event: The Lambda event dict.

    Returns:
        Parsed body as dict, or None if parsing fails.
    """
    body = event.get("body")
    if body is None:
        return None

    if isinstance(body, dict):
        return body

    if isinstance(body, str):
        try:
            return json.loads(body)
        except (json.JSONDecodeError, TypeError):
            return None

    return None


def _derive_product_name(labels):
    """Derive a product name from Rekognition labels.

    Uses the highest-confidence label as the product name, falling back
    to "Graded Item" if no labels are available.

    Args:
        labels: List of label dicts with Name and Confidence keys.

    Returns:
        A product name string (max 256 characters).
    """
    if not labels:
        return "Graded Item"

    # Use the highest confidence label as the product name
    top_label = max(labels, key=lambda l: l["Confidence"])
    return top_label["Name"][:256]


def _get_top_confidence(labels):
    """Get the highest confidence score from label results.

    Args:
        labels: List of label dicts with Name and Confidence keys.

    Returns:
        The highest confidence float, or 0.0 if no labels.
    """
    if not labels:
        return 0.0
    return max(label["Confidence"] for label in labels)


def _persist_to_dynamodb(
    zip_code, condition, green_credits, carbon_estimate, product_name, detected_labels
):
    """Write graded item to DynamoDB with graceful degradation.

    Generates a UUID item_id and writes the full item record. If the
    write fails, returns None (the grading result is still returned
    to the user without item_id per Req 9.2).

    Args:
        zip_code: 6-digit zip code string (partition key).
        condition: Condition grade string.
        green_credits: Integer credits awarded.
        carbon_estimate: Carbon savings estimate string.
        product_name: Derived product name.
        detected_labels: List of detected label name strings.

    Returns:
        item_id string if write succeeded, None otherwise.
    """
    item_id = str(uuid.uuid4())
    listed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Calculate price from credits (credits represent value in local currency)
    price = Decimal(str(green_credits))

    item = {
        "zip_code": zip_code,
        "item_id": item_id,
        "seller_id": "seller-anonymous",
        "product_name": product_name,
        "condition": condition,
        "price": price,
        "status": "Available",
        "carbon_saved_estimate": carbon_estimate,
        "green_credits_awarded": green_credits,
        "listed_at": listed_at,
        "detected_labels": detected_labels,
    }

    try:
        dynamodb_table.put_item(Item=item)
        return item_id
    except Exception:
        # Graceful degradation: return None so response omits item_id
        return None
