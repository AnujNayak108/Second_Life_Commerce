"""
EcoBridge Checkout Intercept Lambda handler.

Intercepts buyer checkout to check if a matching item exists in local
inventory, enabling peer-to-peer fulfillment that reduces carbon emissions.
"""

import json
import os

import boto3
from boto3.dynamodb.conditions import Key, Attr

from shared.response import build_cors_response
from shared.validators import validate_intercept_input

# Instantiate DynamoDB resource outside handler for connection reuse
# across warm Lambda invocations.
TABLE_NAME = os.environ.get("TABLE_NAME", "EcoBridge_Listings")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):
    """Handle checkout intercept requests.

    Parses the incoming request, validates input, queries DynamoDB for
    matching local inventory, and returns match results with CORS headers.

    Args:
        event: API Gateway Lambda Proxy Integration event.
        context: Lambda context object (unused).

    Returns:
        API Gateway Lambda Proxy Integration response dict with CORS headers.
    """
    try:
        # Step 1: Parse JSON body from event
        body = event.get("body", {})
        if isinstance(body, str):
            body = json.loads(body)

        # Step 2: Validate input (zip_code, cart_item_name)
        is_valid, error_message = validate_intercept_input(body)
        if not is_valid:
            return build_cors_response(400, {"error": error_message})

        zip_code = body["zip_code"]
        cart_item_name = body["cart_item_name"]

        # Step 3: Query DynamoDB by zip_code partition key using KeyConditionExpression
        # with FilterExpression for status="Available"
        try:
            response = table.query(
                KeyConditionExpression=Key("zip_code").eq(zip_code),
                FilterExpression=Attr("status").eq("Available"),
            )
        except Exception:
            return build_cors_response(
                500,
                {"error": "Local inventory lookup failed. Please try again."},
            )

        items = response.get("Items", [])

        # Step 4: Case-insensitive bidirectional substring matching
        cart_name_lower = cart_item_name.lower()
        best_match = None

        for item in items:
            product_name_lower = item["product_name"].lower()
            if (
                cart_name_lower in product_name_lower
                or product_name_lower in cart_name_lower
            ):
                best_match = item
                break  # First match wins (items ordered by sort key)

        # Step 5: Build and return response
        if best_match:
            condition = best_match["condition"]
            carbon = best_match["carbon_saved_estimate"]
            intercept_message = (
                f"A certified {condition} version is available locally! "
                f"Save {carbon} by buying from your neighbor."
            )

            match_item = {
                "item_id": best_match["item_id"],
                "product_name": best_match["product_name"],
                "condition": condition,
                "price": best_match["price"],
                "seller_id": best_match["seller_id"],
                "carbon_saved_estimate": carbon,
            }

            return build_cors_response(200, {
                "match_found": True,
                "item": match_item,
                "intercept_message": intercept_message,
                "eco_discount_percent": 37,
            })
        else:
            return build_cors_response(200, {
                "match_found": False,
                "message": "No local matches found. Proceeding with standard checkout.",
            })

    except Exception:
        return build_cors_response(
            500,
            {"error": "Internal server error. Please try again."},
        )
