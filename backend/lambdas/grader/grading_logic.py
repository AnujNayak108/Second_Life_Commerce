"""
Grading heuristics for EcoBridge AI condition assessment.

This module contains the pure, stateless grading logic that maps
Rekognition labels to item condition grades, green credits,
routing decisions, and carbon estimates.
"""

from shared.constants import (
    CONDITION_MATRIX,
    CREDIT_MAP,
    DAMAGE_KEYWORDS,
    POSITIVE_KEYWORDS,
    ROUTING_MAP,
)


def apply_grading_heuristics(labels: list[dict]) -> tuple[str, int, str, str]:
    """Route item condition based on Rekognition labels.

    Applies a deterministic, stateless heuristic to classify item condition
    from Rekognition detect_labels output.

    Args:
        labels: A list of dicts with "Name" (str) and "Confidence" (float) keys.
            Each confidence value is between 0.0 and 100.0.

    Returns:
        A tuple of (condition, green_credits, routing_decision, carbon_estimate):
            - condition: one of "Like New", "Good", "Acceptable", "Poor"
            - green_credits: one of 1200, 800, 400, 100
            - routing_decision: one of "LOCAL_RESALE", "WAREHOUSE_REFURB", "RECYCLE"
            - carbon_estimate: a string like "12.5kg CO2"
    """
    # Step 1: Check for damage labels (confidence > 70%)
    has_damage = any(
        label["Name"] in DAMAGE_KEYWORDS and label["Confidence"] > 70
        for label in labels
    )

    if has_damage:
        condition = "Poor"
    else:
        # Step 2: Check for "Like New" — positive label with confidence > 90%
        has_positive_high_confidence = any(
            label["Name"] in POSITIVE_KEYWORDS and label["Confidence"] > 90
            for label in labels
        )

        if has_positive_high_confidence:
            condition = "Like New"
        else:
            # Step 3: Check for "Good" — any label with confidence > 75%
            has_any_high_confidence = any(
                label["Confidence"] > 75 for label in labels
            )

            if has_any_high_confidence:
                condition = "Good"
            else:
                # Step 4: Default
                condition = "Acceptable"

    # Look up associated values from maps
    green_credits = CREDIT_MAP[condition]
    routing_decision = ROUTING_MAP[condition]
    carbon_estimate = CONDITION_MATRIX[condition]["carbon_estimate"]

    return condition, green_credits, routing_decision, carbon_estimate
