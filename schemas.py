from pydantic import BaseModel, Field
from typing import List, Optional

class TransportInput(BaseModel):
    type: str = Field(..., description="Vehicle type, e.g., 'petrol_car', 'electric_vehicle', 'bus', 'train', 'flight_short'")
    km: float = Field(..., ge=0, description="Distance traveled in kilometers")

class EnergyInput(BaseModel):
    source: str = Field(..., description="Energy source, e.g., 'electricity_grid', 'natural_gas', 'renewable'")
    kwh: float = Field(..., ge=0, description="Usage in kilowatt-hours")

class WasteInput(BaseModel):
    type: str = Field(..., description="Waste type, e.g., 'landfill', 'recycling', 'composting'")
    kg: float = Field(..., ge=0, description="Weight in kilograms")

class ConsumptionInput(BaseModel):
    category: str = Field(..., description="Item category, e.g., 'clothing', 'electronics', 'furniture'")
    qty: int = Field(..., ge=0, description="Quantity purchased")

class CarbonCalculatorInputs(BaseModel):
    transport: List[TransportInput] = []
    energy: List[EnergyInput] = []
    diet: str = Field("average_mixed", description="Diet type: heavy_meat, average_mixed, vegetarian, vegan")
    waste: List[WasteInput] = []
    consumption: List[ConsumptionInput] = []

class CalculationResult(BaseModel):
    transport: float
    energy: float
    diet: float
    waste: float
    consumption: float
    total: float

class DailyActivityLog(BaseModel):
    category: str = Field(..., description="Category: transport, energy, food, waste, consumption")
    activity_type: str = Field(..., description="Subtype e.g. petrol_car, electricity_grid, meal, landfill")
    amount: float = Field(..., ge=0, description="Value (km, kWh, days/meals, kg, qty)")
    notes: Optional[str] = None

class DailyActivityResponse(BaseModel):
    id: int
    category: str
    activity_type: str
    amount: float
    emissions_kg: float
    date: str
    notes: Optional[str] = None

class UserGoal(BaseModel):
    baseline: float = Field(..., ge=0, description="Baseline emissions in kg CO2e/month")
    target: float = Field(..., ge=0, description="Target emissions in kg CO2e/month")
    xp: Optional[int] = 0
    level: Optional[int] = 1

class UnlockedAchievementSchema(BaseModel):
    achievement_key: str
    title: str
    description: str
    date: str

class AdoptedActionResponse(BaseModel):
    id: int
    action_key: str
    title: str
    monthly_saving_kg: float

    model_config = {
        "from_attributes": True
    }


