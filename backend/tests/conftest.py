"""
Shared pytest fixtures for EcoBridge backend tests.

Provides:
- Mocked DynamoDB table using moto
- Environment variable setup (TABLE_NAME)
- Pre-seeded inventory data for integration-style tests
"""

import os
import sys

import boto3
import pytest
from moto import mock_aws

# Add lambdas directory to path so shared modules can be imported
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "lambdas"))


# ---------------------------------------------------------------------------
# Environment fixtures
# ---------------------------------------------------------------------------

TABLE_NAME = "EcoBridge_Listings"


@pytest.fixture(autouse=True)
def set_env_vars(monkeypatch):
    """Set required environment variables for all tests."""
    monkeypatch.setenv("TABLE_NAME", TABLE_NAME)
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")


# ---------------------------------------------------------------------------
# DynamoDB fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def aws_credentials():
    """Mocked AWS credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture
def dynamodb_mock(aws_credentials):
    """Create a mocked DynamoDB resource with the EcoBridge_Listings table."""
    with mock_aws():
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

        # Create the EcoBridge_Listings table matching production schema
        table = dynamodb.create_table(
            TableName=TABLE_NAME,
            KeySchema=[
                {"AttributeName": "zip_code", "KeyType": "HASH"},
                {"AttributeName": "item_id", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "zip_code", "AttributeType": "S"},
                {"AttributeName": "item_id", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        # Wait for table to be active (instant in moto)
        table.meta.client.get_waiter("table_exists").wait(TableName=TABLE_NAME)

        yield dynamodb


@pytest.fixture
def dynamodb_table(dynamodb_mock):
    """Return the mocked EcoBridge_Listings table resource."""
    return dynamodb_mock.Table(TABLE_NAME)


@pytest.fixture
def dynamodb_client(dynamodb_mock):
    """Return a low-level DynamoDB client (for Lambda handlers that use boto3.client)."""
    return boto3.client("dynamodb", region_name="us-east-1")


@pytest.fixture
def seeded_dynamodb_table(dynamodb_table):
    """DynamoDB table pre-seeded with mock inventory items."""
    from decimal import Decimal

    mock_items = [
        {
            "zip_code": "110001",
            "item_id": "item-001-running-shoes",
            "seller_id": "seller-priya-001",
            "product_name": "Pro Running Shoes - Size 9",
            "condition": "Like New",
            "price": Decimal("2500"),
            "status": "Available",
            "carbon_saved_estimate": "8.2kg CO2",
            "green_credits_awarded": 1200,
            "listed_at": "2025-01-15T10:30:00Z",
            "detected_labels": ["Footwear", "Shoe", "Running Shoe"],
        },
        {
            "zip_code": "110001",
            "item_id": "item-002-laptop-charger",
            "seller_id": "seller-rahul-002",
            "product_name": "Laptop Charger 65W",
            "condition": "Good",
            "price": Decimal("800"),
            "status": "Available",
            "carbon_saved_estimate": "4.1kg CO2",
            "green_credits_awarded": 800,
            "listed_at": "2025-01-14T14:20:00Z",
            "detected_labels": ["Electronics", "Adapter", "Power Supply"],
        },
        {
            "zip_code": "110001",
            "item_id": "item-003-baby-monitor",
            "seller_id": "seller-rahul-003",
            "product_name": "Baby Monitor 2025 Model",
            "condition": "Like New",
            "price": Decimal("3200"),
            "status": "Available",
            "carbon_saved_estimate": "12.5kg CO2",
            "green_credits_awarded": 1200,
            "listed_at": "2025-01-16T09:00:00Z",
            "detected_labels": ["Electronics", "Device", "Monitor"],
        },
    ]

    for item in mock_items:
        dynamodb_table.put_item(Item=item)

    return dynamodb_table
