"""
Shared constants for EcoBridge backend Lambda functions.

Defines the condition grading matrix, keyword lists, credit/routing maps,
and CORS headers used across all Lambda handlers.
"""

# Rekognition label keywords indicating item damage
DAMAGE_KEYWORDS = ["Damage", "Broken", "Stain", "Scratch", "Crack"]

# Rekognition label keywords indicating positive item condition
POSITIVE_KEYWORDS = ["Electronics", "Device", "Footwear", "Shoe", "Clothing"]

# Green Credits awarded per condition grade
CREDIT_MAP = {
    "Like New": 1200,
    "Good": 800,
    "Acceptable": 400,
    "Poor": 100,
}

# Fulfillment routing per condition grade
ROUTING_MAP = {
    "Like New": "LOCAL_RESALE",
    "Good": "LOCAL_RESALE",
    "Acceptable": "WAREHOUSE_REFURB",
    "Poor": "RECYCLE",
}

# Full condition matrix mapping conditions to grading parameters
CONDITION_MATRIX = {
    "Like New": {
        "trigger_labels": ["Electronics", "Device", "Footwear", "Shoe", "Clothing"],
        "min_confidence": 90,
        "exclude_labels": ["Damage", "Broken", "Stain", "Scratch", "Crack"],
        "green_credits": 1200,
        "routing": "LOCAL_RESALE",
        "carbon_estimate": "12.5kg CO2",
    },
    "Good": {
        "trigger_labels": ["Electronics", "Device", "Footwear", "Clothing"],
        "min_confidence": 75,
        "exclude_labels": ["Damage", "Broken"],
        "green_credits": 800,
        "routing": "LOCAL_RESALE",
        "carbon_estimate": "8.2kg CO2",
    },
    "Acceptable": {
        "trigger_labels": [],
        "min_confidence": 0,
        "exclude_labels": [],
        "green_credits": 400,
        "routing": "WAREHOUSE_REFURB",
        "carbon_estimate": "4.1kg CO2",
    },
    "Poor": {
        "trigger_labels": ["Damage", "Broken", "Stain", "Scratch", "Crack"],
        "min_confidence": 70,
        "exclude_labels": [],
        "green_credits": 100,
        "routing": "RECYCLE",
        "carbon_estimate": "2.0kg CO2",
    },
}

# CORS headers included in every Lambda response
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}
