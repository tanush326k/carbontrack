from typing import Dict, Any

# Carbon emission factors (in kg CO2e per unit)

EMISSION_FACTORS: Dict[str, Dict[str, float]] = {
    # Transportation (per km)
    "transport": {
        "petrol_car": 0.171,      # kg CO2e per km
        "diesel_car": 0.173,
        "electric_vehicle": 0.053,
        "hybrid_car": 0.104,
        "motorcycle": 0.113,
        "bus": 0.096,             # passenger-km
        "train": 0.035,           # passenger-km
        "flight_short": 0.245,    # < 1500 km (high takeoff overhead)
        "flight_long": 0.180,     # > 1500 km
    },
    # Home Energy (per kWh)
    "energy": {
        "electricity_grid": 0.380, # global/national average grid mix
        "natural_gas": 0.185,
        "heating_oil": 0.268,
        "coal": 0.345,
        "renewable": 0.015,
    },
    # Food/Diet (per day of adherence)
    "diet": {
        "heavy_meat": 3.3,        # kg CO2e per day (high red meat consumption)
        "average_mixed": 2.5,     # kg CO2e per day (moderate meat/fish)
        "vegetarian": 1.7,        # kg CO2e per day (no meat, contains dairy/eggs)
        "vegan": 1.5,             # kg CO2e per day (plant-based only)
    },
    # Waste (per kg)
    "waste": {
        "landfill": 0.450,        # non-recycled waste sent to landfill
        "recycling": 0.050,       # sorting and processing emissions
        "composting": 0.010,
    },
    # Consumption (per item/category)
    "consumption": {
        "clothing": 12.0,         # average garment lifecycle
        "electronics": 220.0,     # average new phone/laptop manufacturing
        "furniture": 45.0,
    }
}

def calculate_transportation_emissions(vehicle_type: str, distance_km: float) -> float:
    """Calculate emissions for transportation."""
    factor = EMISSION_FACTORS["transport"].get(vehicle_type, 0.171) # fallback to petrol_car
    return distance_km * factor

def calculate_energy_emissions(source: str, usage_kwh: float) -> float:
    """Calculate emissions for home utility usage."""
    factor = EMISSION_FACTORS["energy"].get(source, 0.380) # fallback to grid avg
    return usage_kwh * factor

def calculate_diet_emissions(diet_type: str, days: float = 30) -> float:
    """Calculate emissions from food intake for a duration of days."""
    factor = EMISSION_FACTORS["diet"].get(diet_type, 2.5) # fallback to average
    return factor * days

def calculate_waste_emissions(waste_type: str, weight_kg: float) -> float:
    """Calculate emissions from household waste disposal."""
    factor = EMISSION_FACTORS["waste"].get(waste_type, 0.450) # fallback to landfill
    return weight_kg * factor

def calculate_consumption_emissions(category: str, quantity: int) -> float:
    """Calculate emissions from purchasing consumer goods."""
    factor = EMISSION_FACTORS["consumption"].get(category, 5.0)
    return quantity * factor

def calculate_total_monthly_footprint(data: Dict[str, Any]) -> Dict[str, float]:
    """
    Calculate full footprint breakdown.
    Expected data layout:
    {
      "transport": [{"type": "petrol_car", "km": 500}, ...],
      "energy": [{"source": "electricity_grid", "kwh": 300}, ...],
      "diet": "average_mixed",
      "waste": [{"type": "landfill", "kg": 20}],
      "consumption": [{"category": "clothing", "qty": 2}]
    }
    """
    transport_total = 0.0
    for t in data.get("transport", []):
        transport_total += calculate_transportation_emissions(t.get("type"), t.get("km", 0))

    energy_total = 0.0
    for e in data.get("energy", []):
        energy_total += calculate_energy_emissions(e.get("source"), e.get("kwh", 0))

    diet_total = calculate_diet_emissions(data.get("diet", "average_mixed"), 30.4) # Average days in a month

    waste_total = 0.0
    for w in data.get("waste", []):
        waste_total += calculate_waste_emissions(w.get("type"), w.get("kg", 0))

    consumption_total = 0.0
    for c in data.get("consumption", []):
        consumption_total += calculate_consumption_emissions(c.get("category"), c.get("qty", 0))

    total = transport_total + energy_total + diet_total + waste_total + consumption_total

    return {
        "transport": round(transport_total, 2),
        "energy": round(energy_total, 2),
        "diet": round(diet_total, 2),
        "waste": round(waste_total, 2),
        "consumption": round(consumption_total, 2),
        "total": round(total, 2)
    }

