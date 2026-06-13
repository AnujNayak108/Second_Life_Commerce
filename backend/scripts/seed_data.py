"""
DynamoDB seed script for EcoBridge_Listings table.

Seeds 3 mock items into the table for local development and testing.
Uses idempotent writes (skips if item already exists).

Usage:
    python scripts/seed_data.py
"""

import os
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

TABLE_NAME = os.environ.get("TABLE_NAME", "EcoBridge_Listings")
REGION = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")

MOCK_ITEMS = [
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


def seed_items():
    """Seed mock items into DynamoDB, skipping items that already exist."""
    dynamodb = boto3.resource("dynamodb", region_name=REGION)
    table = dynamodb.Table(TABLE_NAME)

    print(f"Seeding table: {TABLE_NAME} (region: {REGION})")
    print("-" * 50)

    for item in MOCK_ITEMS:
        try:
            table.put_item(
                Item=item,
                ConditionExpression="attribute_not_exists(zip_code) AND attribute_not_exists(item_id)",
            )
            print(f"[SEEDED]  {item['product_name']} ({item['item_id']})")
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                print(f"[SKIPPED] {item['product_name']} ({item['item_id']}) - already exists")
            else:
                raise

    print("-" * 50)
    print("Seeding complete.")


if __name__ == "__main__":
    seed_items()
