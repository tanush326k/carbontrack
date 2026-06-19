import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_calculate_success():
    payload = {
        "transport": [{"type": "petrol_car", "km": 100}],
        "energy": [{"source": "electricity_grid", "kwh": 200}],
        "diet": "vegetarian",
        "waste": [{"type": "recycling", "kg": 5}],
        "consumption": [{"category": "electronics", "qty": 2}]
    }
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert data["total"] > 0

def test_calculate_invalid():
    payload = {"transport": "invalid"}
    response = client.post("/api/calculate", json=payload)
    # Pydantic validation should reject this
    assert response.status_code in (400, 422)

def test_create_log_and_get_logs():
    log = {
        "category": "transport",
        "activity_type": "train",
        "amount": 150,
        "notes": "Commute"
    }
    post_resp = client.post("/api/logs", json=log)
    assert post_resp.status_code == 200
    created = post_resp.json()
    assert created["category"] == "transport"
    get_resp = client.get("/api/logs")
    assert get_resp.status_code == 200
    logs = get_resp.json()
    assert any(l["id"] == created["id"] for l in logs)

def test_delete_log():
    log = {
        "category": "energy",
        "activity_type": "renewable",
        "amount": 100,
        "notes": "Solar panels"
    }
    create = client.post("/api/logs", json=log).json()
    del_resp = client.delete(f"/api/logs/{create['id']}")
    assert del_resp.status_code == 200
    get_resp = client.get("/api/logs")
    assert not any(l["id"] == create["id"] for l in get_resp.json())

def test_delete_log_not_found():
    resp = client.delete("/api/logs/9999")
    assert resp.status_code == 404

def test_goals_crud():
    get_resp = client.get("/api/goals")
    assert get_resp.status_code == 200
    goal = get_resp.json()
    new_goal = {"baseline": 600.0, "target": 300.0, "xp": goal["xp"], "level": goal["level"]}
    post_resp = client.post("/api/goals", json=new_goal)
    assert post_resp.status_code == 200
    updated = post_resp.json()
    assert updated["baseline"] == 600.0
    assert updated["target"] == 300.0

def test_tips_endpoint():
    resp = client.get("/api/tips")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_adopt_action_and_remove():
    tip_key = "meatless_days"
    adopt_resp = client.post(f"/api/actions/{tip_key}")
    assert adopt_resp.status_code == 200
    get_actions = client.get("/api/actions")
    assert any(a["action_key"] == tip_key for a in get_actions.json())
    del_resp = client.delete(f"/api/actions/{tip_key}")
    assert del_resp.status_code == 200
    get_actions2 = client.get("/api/actions")
    assert not any(a["action_key"] == tip_key for a in get_actions2.json())

def test_adopt_action_not_found():
    resp = client.post("/api/actions/invalid_key")
    assert resp.status_code == 404

def test_remove_adopted_action_not_found():
    resp = client.delete("/api/actions/invalid_key")
    assert resp.status_code == 404

def test_summary_endpoint():
    resp = client.get("/api/summary")
    assert resp.status_code == 200
    data = resp.json()
    required_keys = [
        "baseline", "target", "monthly_savings", "current_estimate",
        "total_logged_emissions", "logged_count", "category_distribution",
        "xp", "level", "xp_progress", "achievements",
        "carbon_score", "score_rating", "score_explanation",
        "score_suggestions", "largest_emission_category"
    ]
    for k in required_keys:
        assert k in data, f"Missing key: {k}"

def test_summary_scoring_fields():
    """Verify that scoring fields have correct types and values."""
    resp = client.get("/api/summary")
    data = resp.json()
    assert isinstance(data["carbon_score"], int)
    assert 0 <= data["carbon_score"] <= 100
    assert data["score_rating"] in ("Excellent", "Good", "Moderate", "High Impact")
    assert isinstance(data["score_explanation"], str)
    assert isinstance(data["score_suggestions"], list)
    assert isinstance(data["largest_emission_category"], str)

def test_compute_recommendations_standalone():
    """Verify compute_recommendations works independently from compute_carbon_score."""
    from scoring import compute_carbon_score, compute_recommendations

    distribution = {"transport": 100.0, "food": 50.0, "energy": 30.0, "waste": 10.0, "consumption": 5.0}

    # compute_carbon_score returns 4 values (no recommendations)
    score, rating, expl, largest = compute_carbon_score(distribution, 550.0)
    assert isinstance(score, int)
    assert largest == "transport"

    # compute_recommendations is called separately
    recs = compute_recommendations(distribution, largest)
    assert isinstance(recs, list)
    assert len(recs) > 0
    assert all(isinstance(r, str) for r in recs)
