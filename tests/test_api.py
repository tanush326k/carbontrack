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

def test_ai_coach():
    resp = client.get("/api/coach")
    assert resp.status_code == 200
    assert "insight" in resp.json()

def test_simulate_footprint():
    resp = client.post("/api/simulate", json={"ev_adoption": True, "vegan_diet": False})
    assert resp.status_code == 200
    assert "projected_savings" in resp.json()

def test_leaderboard():
    resp = client.get("/api/leaderboard")
    assert resp.status_code == 200
    assert len(resp.json()) == 3

def test_community_impact():
    resp = client.get("/api/community")
    assert resp.status_code == 200
    assert "trees_saved" in resp.json()

def test_challenges():
    resp = client.get("/api/challenges")
    assert resp.status_code == 200
    assert "streak" in resp.json()
    assert "challenges" in resp.json()

def test_report():
    resp = client.get("/api/report")
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]

def test_achievements_unlock_rules():
    # 1. Log first activity -> triggers "First Steps"
    log_data = {"category": "transport", "activity_type": "train", "amount": 10.0, "notes": "First log"}
    res = client.post("/api/logs", json=log_data)
    assert res.status_code == 200
    
    # Retrieve summary to verify "First Steps" is unlocked
    summary = client.get("/api/summary").json()
    assert any(a["achievement_key"] == "first_steps" for a in summary["achievements"])
    # XP should be: 15 XP (train transit log) + 100 XP (achievement bonus) = 115 XP (level 2)
    assert summary["xp"] == 115
    assert summary["level"] == 2
    
    # Log second activity - achievement shouldn't duplicate unlock
    res2 = client.post("/api/logs", json=log_data)
    assert res2.status_code == 200
    summary = client.get("/api/summary").json()
    assert len([a for a in summary["achievements"] if a["achievement_key"] == "first_steps"]) == 1
    # XP: 115 + 15 = 130 XP
    
    # 2. Log 2 more train commutes (total 3 commutes) -> triggers "Eco Commuter" (green_commuter)
    client.post("/api/logs", json=log_data)
    # Fetch once to process Eco Commuter unlock (which adds 100 XP, level goes to 3)
    client.get("/api/summary")
    # Fetch twice so check_and_unlock_achievements evaluates level 3 on start and unlocks Carbon Buster
    summary = client.get("/api/summary").json()
    # Total XP: 130 + 15 (log) + 100 (green_commuter) + 100 (carbon_buster) = 345 XP (level 4)
    assert any(a["achievement_key"] == "green_commuter" for a in summary["achievements"])
    assert any(a["achievement_key"] == "carbon_buster" for a in summary["achievements"])
    assert summary["level"] >= 3

    # 3. Adopt 3 habit actions to unlock "Earth Defender"
    client.post("/api/actions/meatless_days")
    client.post("/api/actions/bike_short_trips")
    client.post("/api/actions/led_retrofit")
    summary = client.get("/api/summary").json()
    assert any(a["achievement_key"] == "earth_defender" for a in summary["achievements"])

def test_calculate_footprint_exception():
    from unittest.mock import patch
    with patch("calculations.calculate_total_monthly_footprint", side_effect=Exception("Mocked calculation failure")):
        payload = {
            "transport": [{"type": "petrol_car", "km": 100}],
            "energy": [{"source": "electricity_grid", "kwh": 200}],
            "diet": "vegetarian",
            "waste": [{"type": "recycling", "kg": 5}],
            "consumption": [{"category": "electronics", "qty": 2}]
        }
        response = client.post("/api/calculate", json=payload)
        assert response.status_code == 400
        assert "Mocked calculation failure" in response.json()["detail"]

def test_create_log_invalid_category():
    log = {
        "category": "invalid_category",
        "activity_type": "any",
        "amount": 10.0,
        "notes": "Testing error"
    }
    response = client.post("/api/logs", json=log)
    assert response.status_code == 400
    assert "Unknown category" in response.json()["detail"]

def test_logging_xp_rewards():
    # Ensure clean state by deleting goal first so fallback creation is triggered
    from models import SessionLocal, DBUserGoal
    db = SessionLocal()
    try:
        db.query(DBUserGoal).delete()
        db.commit()
        
        goal = db.query(DBUserGoal).first()
        if not goal:
            goal = DBUserGoal(baseline=550.0, target=400.0, xp=0, level=1)
            db.add(goal)
        else:
            goal.xp = 0
            goal.level = 1
        db.commit()
    finally:
        db.close()

    # 1. Log recycling waste -> awards +15 XP (+100 XP from First Steps achievement) = 115 XP
    client.post("/api/logs", json={"category": "waste", "activity_type": "recycling", "amount": 5.0})
    summary = client.get("/api/summary").json()
    current_xp = summary["xp"]
    assert current_xp == 115

    # 2. Log renewable energy -> awards +20 XP
    client.post("/api/logs", json={"category": "energy", "activity_type": "renewable", "amount": 50.0})
    summary = client.get("/api/summary").json()
    assert summary["xp"] == current_xp + 20
    current_xp = summary["xp"]

    # 3. Log vegetarian food -> awards +15 XP
    client.post("/api/logs", json={"category": "food", "activity_type": "vegetarian", "amount": 1.0})
    summary = client.get("/api/summary").json()
    assert summary["xp"] == current_xp + 15
    current_xp = summary["xp"]

    # 4. Log consumption purchase -> awards default +5 XP (covers main.py line 222)
    client.post("/api/logs", json={"category": "consumption", "activity_type": "clothing", "amount": 1})
    summary = client.get("/api/summary").json()
    assert summary["xp"] == current_xp + 5

def test_endpoints_without_user_goal():
    from models import SessionLocal, DBUserGoal
    db = SessionLocal()
    try:
        db.query(DBUserGoal).delete()
        db.commit()
    finally:
        db.close()
        
    # Call goals GET endpoint - should auto-create
    res = client.get("/api/goals")
    assert res.status_code == 200
    assert res.json()["baseline"] == 550.0

    # Delete again
    db = SessionLocal()
    try:
        db.query(DBUserGoal).delete()
        db.commit()
    finally:
        db.close()

    # Call summary endpoint - should auto-create
    res = client.get("/api/summary")
    assert res.status_code == 200
    assert res.json()["baseline"] == 550.0

    # Delete again
    db = SessionLocal()
    try:
        db.query(DBUserGoal).delete()
        db.commit()
    finally:
        db.close()

    # Call goals POST update - should auto-create
    res = client.post("/api/goals", json={"baseline": 620.0, "target": 350.0})
    assert res.status_code == 200
    assert res.json()["baseline"] == 620.0

def test_adopt_action_already_adopted():
    tip_key = "meatless_days"
    # Adopt first time
    res1 = client.post(f"/api/actions/{tip_key}")
    assert res1.status_code == 200
    
    # Adopt second time - should hit existing check and return it
    res2 = client.post(f"/api/actions/{tip_key}")
    assert res2.status_code == 200
    assert res2.json()["action_key"] == tip_key

def test_summary_unknown_category_in_db():
    from models import SessionLocal, DBActivityLog
    db = SessionLocal()
    try:
        custom_log = DBActivityLog(
            category="other",
            activity_type="mystery",
            amount=100.0,
            emissions_kg=5.0,
            notes="Direct DB entry"
        )
        db.add(custom_log)
        db.commit()
    finally:
        db.close()

    res = client.get("/api/summary")
    assert res.status_code == 200
    data = res.json()
    assert "other" not in data["category_distribution"]

def test_scoring_edge_cases():
    from scoring import compute_carbon_score, compute_recommendations, rating_from_score, explanation
    
    # 1. Baseline <= 0
    score, rating, expl, largest = compute_carbon_score({"transport": 50.0}, 0.0)
    assert score == 0
    
    # 2. Rating thresholds border cases
    assert rating_from_score(95) == "Excellent"
    assert rating_from_score(90) == "Excellent"
    assert rating_from_score(80) == "Good"
    assert rating_from_score(70) == "Good"
    assert rating_from_score(50) == "Moderate"
    assert rating_from_score(40) == "Moderate"
    assert rating_from_score(30) == "High Impact"
    assert rating_from_score(0) == "High Impact"

    # 3. Explanation border cases
    assert "excellent" in explanation(90).lower()
    assert "relatively low" in explanation(70).lower()
    assert "moderate" in explanation(40).lower()
    assert "high" in explanation(20).lower()

    # 4. largest_emission_category with empty distribution
    score, rating, expl, largest = compute_carbon_score({}, 550.0)
    assert largest == ""

    # 5. empty largest_category inside compute_recommendations
    recs = compute_recommendations({}, "")
    assert len(recs) == 1
    assert "Track your activities" in recs[0]

    # 6. empty recommendations for unknown category
    recs2 = compute_recommendations({"unknown": 100.0}, "unknown")
    assert len(recs2) == 1
    assert "Track your activities" in recs2[0]

