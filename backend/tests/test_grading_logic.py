"""Unit tests for the apply_grading_heuristics function."""

import pytest

from grader.grading_logic import apply_grading_heuristics


class TestApplyGradingHeuristics:
    """Tests for apply_grading_heuristics covering all condition paths."""

    def test_empty_labels_returns_acceptable(self):
        """Empty labels list defaults to Acceptable condition."""
        condition, credits, routing, carbon = apply_grading_heuristics([])
        assert condition == "Acceptable"
        assert credits == 400
        assert routing == "WAREHOUSE_REFURB"
        assert carbon == "4.1kg CO2"

    def test_damage_label_above_70_returns_poor(self):
        """A damage label with confidence > 70 results in Poor condition."""
        labels = [{"Name": "Damage", "Confidence": 71.0}]
        condition, credits, routing, carbon = apply_grading_heuristics(labels)
        assert condition == "Poor"
        assert credits == 100
        assert routing == "RECYCLE"
        assert carbon == "2.0kg CO2"

    def test_damage_label_at_70_does_not_trigger_poor(self):
        """Damage label at exactly 70% confidence does not trigger Poor (> 70 required)."""
        labels = [{"Name": "Scratch", "Confidence": 70.0}]
        condition, credits, routing, carbon = apply_grading_heuristics(labels)
        assert condition != "Poor"

    def test_damage_overrides_positive_labels(self):
        """Damage label overrides any positive labels, even at high confidence."""
        labels = [
            {"Name": "Electronics", "Confidence": 99.0},
            {"Name": "Broken", "Confidence": 80.0},
        ]
        condition, credits, routing, carbon = apply_grading_heuristics(labels)
        assert condition == "Poor"
        assert credits == 100
        assert routing == "RECYCLE"

    def test_positive_label_above_90_no_damage_returns_like_new(self):
        """Positive label above 90% without damage yields Like New."""
        labels = [{"Name": "Footwear", "Confidence": 91.0}]
        condition, credits, routing, carbon = apply_grading_heuristics(labels)
        assert condition == "Like New"
        assert credits == 1200
        assert routing == "LOCAL_RESALE"
        assert carbon == "12.5kg CO2"

    def test_positive_label_at_90_does_not_trigger_like_new(self):
        """Positive label at exactly 90% does not trigger Like New (> 90 required)."""
        labels = [{"Name": "Electronics", "Confidence": 90.0}]
        condition, credits, routing, carbon = apply_grading_heuristics(labels)
        assert condition != "Like New"

    def test_any_label_above_75_no_damage_returns_good(self):
        """Any label above 75% confidence without damage yields Good."""
        labels = [{"Name": "RandomObject", "Confidence": 76.0}]
        condition, credits, routing, carbon = apply_grading_heuristics(labels)
        assert condition == "Good"
        assert credits == 800
        assert routing == "LOCAL_RESALE"
        assert carbon == "8.2kg CO2"

    def test_label_at_75_does_not_trigger_good(self):
        """Label at exactly 75% confidence does not trigger Good (> 75 required)."""
        labels = [{"Name": "RandomObject", "Confidence": 75.0}]
        condition, credits, routing, carbon = apply_grading_heuristics(labels)
        assert condition == "Acceptable"

    def test_low_confidence_labels_return_acceptable(self):
        """Labels all below 75% confidence and no damage yields Acceptable."""
        labels = [
            {"Name": "Electronics", "Confidence": 50.0},
            {"Name": "Device", "Confidence": 60.0},
        ]
        condition, credits, routing, carbon = apply_grading_heuristics(labels)
        assert condition == "Acceptable"
        assert credits == 400
        assert routing == "WAREHOUSE_REFURB"
        assert carbon == "4.1kg CO2"

    def test_all_damage_keywords_trigger_poor(self):
        """Each damage keyword triggers Poor when above 70% confidence."""
        for keyword in ["Damage", "Broken", "Stain", "Scratch", "Crack"]:
            labels = [{"Name": keyword, "Confidence": 85.0}]
            condition, _, _, _ = apply_grading_heuristics(labels)
            assert condition == "Poor", f"{keyword} should trigger Poor"

    def test_all_positive_keywords_trigger_like_new(self):
        """Each positive keyword triggers Like New when above 90% confidence."""
        for keyword in ["Electronics", "Device", "Footwear", "Shoe", "Clothing"]:
            labels = [{"Name": keyword, "Confidence": 95.0}]
            condition, _, _, _ = apply_grading_heuristics(labels)
            assert condition == "Like New", f"{keyword} should trigger Like New"

    def test_determinism_same_input_same_output(self):
        """Same input always produces same output (Property 1: Grading Determinism)."""
        labels = [
            {"Name": "Electronics", "Confidence": 92.0},
            {"Name": "Device", "Confidence": 88.0},
        ]
        results = [apply_grading_heuristics(labels) for _ in range(10)]
        assert all(r == results[0] for r in results)

    def test_function_is_pure_no_side_effects(self):
        """Function does not modify the input labels list."""
        labels = [{"Name": "Footwear", "Confidence": 95.0}]
        original_labels = [dict(l) for l in labels]
        apply_grading_heuristics(labels)
        assert labels == original_labels
