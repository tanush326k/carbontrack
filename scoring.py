"""Carbon scoring utilities.

The scoring system evaluates a user's carbon footprint across five categories:
- transport
- food
- energy
- waste
- consumption

A 0-100 score is produced where a higher score indicates lower emissions.

The module provides:
- Carbon score
- Rating label
- Human-readable explanation
- Personalized recommendations
- Largest emission category
"""

from typing import Dict, List, Tuple

# ---------------------------------------------------------------------------
# Rating thresholds
# ---------------------------------------------------------------------------

RATING_THRESHOLDS = {
    "Excellent": 90,
    "Good": 70,
    "Moderate": 40,
    "High Impact": 0,
}

# ---------------------------------------------------------------------------
# Category-specific recommendations
# ---------------------------------------------------------------------------

CATEGORY_SUGGESTIONS = {
    "transport": [
        ("Use public transport twice weekly", 18),
        ("Car-pool with at least one passenger once weekly", 12),
        ("Walk or cycle for short trips", 10),
    ],
    "food": [
        ("Replace two meat meals per week with plant-based alternatives", 12),
        ("Reduce food waste by planning meals", 8),
        ("Buy locally sourced produce", 5),
    ],
    "energy": [
        ("Switch to LED bulbs throughout the house", 8),
        ("Unplug idle electronics nightly", 4),
        ("Adjust thermostat settings for efficiency", 6),
    ],
    "waste": [
        ("Recycle paper, plastic, and glass regularly", 7),
        ("Compost organic waste", 6),
        ("Avoid single-use plastics", 5),
    ],
    "consumption": [
        ("Buy second-hand goods when possible", 10),
        ("Reduce unnecessary purchases", 8),
        ("Donate or reuse unwanted items", 4),
    ],
}

# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def _category_score(emission: float, baseline: float) -> int:
    """Calculate a 0-100 score for a category."""
    if baseline <= 0:
        return 0

    raw_score = 100 * (1 - (emission / baseline))
    return max(0, min(100, round(raw_score)))

def rating_from_score(score: int) -> str:
    """Convert numeric score to rating."""
    if score >= 90:
        return "Excellent"
    if score >= 70:
        return "Good"
    if score >= 40:
        return "Moderate"
    return "High Impact"

def explanation(score: int) -> str:
    """Generate explanation text."""
    if score >= 90:
        return "Your carbon footprint is excellent. Keep maintaining your sustainable habits."
    if score >= 70:
        return "Your footprint is relatively low, but there are still opportunities for improvement."
    if score >= 40:
        return "Your footprint is moderate. Targeted reductions could improve your environmental impact."
    return "Your footprint is high. Significant reductions are recommended."

def largest_emission_category(distribution: Dict[str, float]) -> str:
    """Return the highest-emission category."""
    if not distribution:
        return ""

    return max(distribution.items(), key=lambda item: item[1])[0]

# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

def suggestions_for_category(category: str) -> List[str]:
    """Return formatted recommendations for a category."""
    suggestions = CATEGORY_SUGGESTIONS.get(category, [])

    return [
        f"{text} — estimated saving: {saving} kg CO₂/month"
        for text, saving in suggestions[:3]
    ]

def compute_recommendations(
    distribution: Dict[str, float],
    largest_category: str
) -> List[str]:
    """
    Generate recommendations based on the user's
    highest-emission category.
    """

    if not largest_category:
        return [
            "Track your activities regularly to identify emission hotspots."
        ]

    recommendations = suggestions_for_category(largest_category)

    if not recommendations:
        return [
            "Track your activities regularly to identify emission hotspots."
        ]

    return recommendations

# ---------------------------------------------------------------------------
# Main scoring function
# ---------------------------------------------------------------------------

def compute_carbon_score(
    emissions_by_category: Dict[str, float],
    baseline: float
) -> Tuple[int, str, str, str]:
    """
    Returns:
        (
            score,
            rating,
            explanation,
            largest_category
        )
    """

    categories = [
        "transport",
        "food",
        "energy",
        "waste",
        "consumption",
    ]

    scores = [
        _category_score(
            emissions_by_category.get(category, 0.0),
            baseline
        )
        for category in categories
    ]

    overall_score = round(sum(scores) / len(scores))

    rating = rating_from_score(overall_score)
    explanation_text = explanation(overall_score)
    largest_category = largest_emission_category(emissions_by_category)

    return (
        overall_score,
        rating,
        explanation_text,
        largest_category,
    )