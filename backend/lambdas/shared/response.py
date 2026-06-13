"""
Shared response utilities for EcoBridge backend Lambda functions.

Provides the build_cors_response helper that constructs API Gateway
Lambda Proxy Integration responses with CORS headers.
"""

import json
from decimal import Decimal

from shared.constants import CORS_HEADERS


class _DecimalEncoder(json.JSONEncoder):
    """JSON encoder that handles DynamoDB Decimal types."""

    def default(self, obj):
        if isinstance(obj, Decimal):
            # Convert to int if no decimal places, otherwise float
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super().default(obj)


def build_cors_response(status_code: int, body: dict) -> dict:
    """Construct a Lambda Proxy Integration response with CORS headers.

    Args:
        status_code: HTTP status code (e.g. 200, 400, 500).
        body: Response body dict to be JSON-stringified.

    Returns:
        A dict matching the API Gateway Lambda Proxy Integration format:
        {
            "statusCode": <int>,
            "headers": {CORS headers},
            "body": <JSON string>
        }
    """
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, cls=_DecimalEncoder),
    }
