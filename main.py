from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict
import os

import models
import schemas
import calculations

# Initialize DB on startup
models.init_db()

app = FastAPI(
    title="Carbon Footprint Tracker",
    description="Track, analyze, and reduce your carbon emissions."
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:8000").split(","),
    allow_credentials=True,
    allow_methods=os.getenv("CORS_METHODS", "*").split(","),
    allow_headers=os.getenv("CORS_HEADERS", "*").split(",")
)

# DB Dependency
def get_db():
    """Yield a database session."""
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper function to check and unlock achievements dynamically
def check_and_unlock_achievements(db: Session, goal: models.DBUserGoal, all_logs: List[models.DBActivityLog], adopted_actions: List[models.DBAdoptedAction]):
    """Check for new achievements and unlock them based on user activity."""
    achievements_to_unlock = []

    # 1. First Steps (Logged 1 activity)
    if len(all_logs) >= 1:
        achievements_to_unlock.append({
            "key": "first_steps",
            "title": "First Steps",
            "description": "Logged your first carbon tracking entry!"
        })

    # 2. Eco Commuter (Logged public transport or EV travel >= 3 times)
    eco_commutes = [log for log in all_logs if log.category == "transport" and log.activity_type in ("electric_vehicle", "train", "bus")]
    if len(eco_commutes) >= 3:
        achievements_to_unlock.append({
            "key": "green_commuter",
            "title": "Eco Commuter",
            "description": "Logged 3 or more sustainable commutes (EV, train, or bus)!"
        })

    # 3. Earth Defender (Adopted 3 or more habit actions)
    if len(adopted_actions) >= 3:
        achievements_to_unlock.append({
            "key": "earth_defender",
            "title": "Earth Defender",
            "description": "Committed to 3 or more green habits!"
        })

    # 4. Carbon Buster (Level 3 or higher)
    if goal.level >= 3:
        achievements_to_unlock.append({
            "key": "carbon_buster",
            "title": "Carbon Buster",
            "description": "Reached User Level 3 through active carbon reduction!"
        })

    unlocked_any = False
    for ach in achievements_to_unlock:
        existing = db.query(models.DBUnlockedAchievement).filter(models.DBUnlockedAchievement.achievement_key == ach["key"]).first()
        if not existing:
            db_ach = models.DBUnlockedAchievement(
                achievement_key=ach["key"],
                title=ach["title"],
                description=ach["description"]
            )
            db.add(db_ach)
            # Award 100 bonus XP for unlocking an achievement!
            goal.xp += 100
            unlocked_any = True

    if unlocked_any:
        goal.level = 1 + goal.xp // 100
        db.add(goal)
        db.commit()

# In-memory recommendation catalog
TIPS_CATALOG = [
    {
        "key": "meatless_days",
        "title": "Meatless Days",
        "description": "Eat vegetarian or vegan diets 3 days a week instead of mixed meat.",
        "category": "diet",
        "monthly_saving_kg": 24.0,
        "difficulty": "Easy"
    },
    {
        "key": "bike_short_trips",
        "title": "Bike Short Trips",
        "description": "Walk or bike for all trips under 3 km instead of driving.",
        "category": "transport",
        "monthly_saving_kg": 35.0,
        "difficulty": "Medium"
    },
    {
        "key": "led_retrofit",
        "title": "LED Bulb Retrofit",
        "description": "Replace 10 traditional incandescent bulbs with energy-efficient LEDs.",
        "category": "energy",
        "monthly_saving_kg": 18.0,
        "difficulty": "Easy"
    },
    {
        "key": "line_dry",
        "title": "Line Dry Clothes",
        "description": "Air dry laundry on a rack or line instead of using a tumble dryer.",
        "category": "energy",
        "monthly_saving_kg": 15.0,
        "difficulty": "Easy"
    },
    {
        "key": "eco_driving",
        "title": "Eco-Driving Techniques",
        "description": "Maintain steady speeds, avoid hard braking/accel, and reduce highway speed to 100 km/h.",
        "category": "transport",
        "monthly_saving_kg": 22.0,
        "difficulty": "Medium"
    },
    {
        "key": "smart_thermostat",
        "title": "Optimize Heating & Cooling",
        "description": "Set temperature 1°C lower in winter and 1°C higher in summer.",
        "category": "energy",
        "monthly_saving_kg": 30.0,
        "difficulty": "Medium"
    },
    {
        "key": "reduce_food_waste",
        "title": "Zero Food Waste Goal",
        "description": "Plan meals, store food properly, and compost leftovers to reduce landfill organic waste.",
        "category": "waste",
        "monthly_saving_kg": 12.0,
        "difficulty": "Medium"
    }
]

@app.get("/api/health")
def health_check():
    """Health check endpoint to verify service status."""
    return {"status": "healthy", "service": "carbon-tracker"}

# Calculation Endpoint
@app.post("/api/calculate", response_model=schemas.CalculationResult)
def calculate_footprint(inputs: schemas.CarbonCalculatorInputs):
    """Calculate the estimated monthly carbon footprint."""
    try:
        raw_dict = inputs.model_dump()
        result = calculations.calculate_total_monthly_footprint(raw_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Activity Logs Endpoints

@app.post("/api/logs", response_model=schemas.DailyActivityResponse)
def create_log(log_in: schemas.DailyActivityLog, db: Session = Depends(get_db)):
    """Log a new daily activity and calculate its emissions."""
    # Calculate emissions for this specific entry
    emissions = 0.0
    cat = log_in.category
    act = log_in.activity_type
    val = log_in.amount

    try:
        if cat == "transport":
            emissions = calculations.calculate_transportation_emissions(act, val)
        elif cat == "energy":
            emissions = calculations.calculate_energy_emissions(act, val)
        elif cat == "food":
            # food is diet type, amount represents number of days
            emissions = calculations.calculate_diet_emissions(act, val)
        elif cat == "waste":
            emissions = calculations.calculate_waste_emissions(act, val)
        elif cat == "consumption":
            emissions = calculations.calculate_consumption_emissions(act, int(val))
        else:
            raise ValueError(f"Unknown category: {cat}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")

    db_log = models.DBActivityLog(
        category=cat,
        activity_type=act,
        amount=val,
        emissions_kg=round(emissions, 2),
        notes=log_in.notes
    )
    db.add(db_log)

    # Calculate XP reward
    xp_earned = 5
    if cat == "waste" and act in ("recycling", "composting"):
        xp_earned = 15
    elif cat == "energy" and act == "renewable":
        xp_earned = 20
    elif cat == "transport" and act in ("electric_vehicle", "train", "bus"):
        xp_earned = 15
    elif cat == "food" and act in ("vegetarian", "vegan"):
        xp_earned = 15

    # Update user XP
    goal = db.query(models.DBUserGoal).first()
    if goal:
        goal.xp += xp_earned
        goal.level = 1 + goal.xp // 100
        db.add(goal)

    db.commit()
    db.refresh(db_log)

    return schemas.DailyActivityResponse(
        id=db_log.id,
        category=db_log.category,
        activity_type=db_log.activity_type,
        amount=db_log.amount,
        emissions_kg=db_log.emissions_kg,
        date=db_log.date.strftime("%Y-%m-%d"),
        notes=db_log.notes
    )

@app.get("/api/logs", response_model=List[schemas.DailyActivityResponse])
def get_logs(db: Session = Depends(get_db)):
    """Retrieve all activity logs ordered by date."""
    logs = db.query(models.DBActivityLog).order_by(models.DBActivityLog.date.desc()).all()
    res = []
    for log in logs:
        res.append(schemas.DailyActivityResponse(
            id=log.id,
            category=log.category,
            activity_type=log.activity_type,
            amount=log.amount,
            emissions_kg=log.emissions_kg,
            date=log.date.strftime("%Y-%m-%d"),
            notes=log.notes
        ))
    return res

@app.delete("/api/logs/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    """Delete a specific activity log."""
    db_log = db.query(models.DBActivityLog).filter(models.DBActivityLog.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(db_log)
    db.commit()
    return {"message": f"Successfully deleted log {log_id}"}

# Goals Endpoints
@app.get("/api/goals", response_model=schemas.UserGoal)
def get_goals(db: Session = Depends(get_db)):
    """Retrieve the user's current baseline and target goals."""
    goal = db.query(models.DBUserGoal).first()
    if not goal:
        goal = models.DBUserGoal(baseline=550.0, target=400.0, xp=0, level=1)
        db.add(goal)
        db.commit()
        db.refresh(goal)
    return schemas.UserGoal(baseline=goal.baseline, target=goal.target, xp=goal.xp, level=goal.level)

@app.post("/api/goals", response_model=schemas.UserGoal)
def update_goals(goal_in: schemas.UserGoal, db: Session = Depends(get_db)):
    """Update the user's baseline and target goals."""
    goal = db.query(models.DBUserGoal).first()
    if not goal:
        goal = models.DBUserGoal(baseline=goal_in.baseline, target=goal_in.target, xp=0, level=1)
        db.add(goal)
    else:
        goal.baseline = goal_in.baseline
        goal.target = goal_in.target
    db.commit()
    db.refresh(goal)
    return schemas.UserGoal(baseline=goal.baseline, target=goal.target, xp=goal.xp, level=goal.level)

# Recommendation Tips & Adopted Actions Endpoints
@app.get("/api/tips")
def get_tips():
    """Retrieve the catalog of all available recommendation tips."""
    return TIPS_CATALOG

@app.get("/api/actions")
def get_adopted_actions(db: Session = Depends(get_db)):
    """Retrieve the list of actions currently adopted by the user."""
    actions = db.query(models.DBAdoptedAction).all()
    return actions

@app.post("/api/actions/{action_key}")
def adopt_action(action_key: str, db: Session = Depends(get_db)):
    """Adopt a new action/tip by its key."""
    # Find action details in our static list
    matched = next((t for t in TIPS_CATALOG if t["key"] == action_key), None)
    if not matched:
        raise HTTPException(status_code=404, detail="Tip key not found")

    # Check if already adopted
    existing = db.query(models.DBAdoptedAction).filter(models.DBAdoptedAction.action_key == action_key).first()
    if existing:
        return existing

    db_action = models.DBAdoptedAction(
        action_key=action_key,
        title=matched["title"],
        monthly_saving_kg=matched["monthly_saving_kg"]
    )
    db.add(db_action)

    # Award 50 XP for adopting habit
    goal = db.query(models.DBUserGoal).first()
    if goal:
        goal.xp += 50
        goal.level = 1 + goal.xp // 100
        db.add(goal)

    db.commit()
    db.refresh(db_action)
    return db_action

@app.delete("/api/actions/{action_key}")
def remove_adopted_action(action_key: str, db: Session = Depends(get_db)):
    """Remove an adopted action."""
    db_action = db.query(models.DBAdoptedAction).filter(models.DBAdoptedAction.action_key == action_key).first()
    if not db_action:
        raise HTTPException(status_code=404, detail="Adopted action not found")
    db.delete(db_action)
    db.commit()
    return {"message": f"Successfully removed adopted action: {action_key}"}

# Dashboard Analytics Summary
@app.get("/api/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    """Generate a summary of analytics including scores, tips, and achievements."""
    # Get current goals
    goal = db.query(models.DBUserGoal).first()
    if not goal:
        goal = models.DBUserGoal(baseline=550.0, target=400.0, xp=0, level=1)
        db.add(goal)
        db.commit()
        db.refresh(goal)

    # Get logs
    all_logs = db.query(models.DBActivityLog).all()
    logged_emissions = sum(log.emissions_kg for log in all_logs)

    # Sum adopted action savings
    adopted_actions = db.query(models.DBAdoptedAction).all()
    monthly_savings = sum(act.monthly_saving_kg for act in adopted_actions)

    # Check achievements
    check_and_unlock_achievements(db, goal, all_logs, adopted_actions)

    # Reload achievements to list them
    unlocked_ach = db.query(models.DBUnlockedAchievement).all()
    ach_list = [{
        "achievement_key": a.achievement_key,
        "title": a.title,
        "description": a.description,
        "date": a.unlocked_at.strftime("%Y-%m-%d")
    } for a in unlocked_ach]

    # Estimate current footprint: Baseline - Savings
    current_estimate = max(0.0, goal.baseline - monthly_savings)

    # Category distribution of logged emissions
    distribution = {"transport": 0.0, "energy": 0.0, "food": 0.0, "waste": 0.0, "consumption": 0.0}
    for log in all_logs:
        cat = log.category
        if cat in distribution:
            distribution[cat] += log.emissions_kg

    # Compute carbon scoring (refactored: score + recommendations are separate)
    from scoring import compute_carbon_score, compute_recommendations

    carbon_score, rating, expl, largest = compute_carbon_score(distribution, goal.baseline)
    suggestions = compute_recommendations(distribution, largest)

    # Build response
    return {
        "baseline": round(goal.baseline, 1),
        "target": round(goal.target, 1),
        "monthly_savings": round(monthly_savings, 1),
        "current_estimate": round(current_estimate, 1),
        "total_logged_emissions": round(logged_emissions, 1),
        "logged_count": len(all_logs),
        "category_distribution": {k: round(v, 1) for k, v in distribution.items()},
        "xp": goal.xp,
        "level": goal.level,
        "xp_progress": goal.xp % 100,
        "achievements": ach_list,
        "carbon_score": carbon_score,
        "score_rating": rating,
        "score_explanation": expl,
        "score_suggestions": suggestions,
        "largest_emission_category": largest
    }

# Create static directory if it doesn't exist
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

# Mount frontend static files
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")