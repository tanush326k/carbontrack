from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
from typing import Any

Base: Any = declarative_base()

class DBActivityLog(Base):
    __tablename__ = "activity_logs"

    id: int = Column(Integer, primary_key=True, index=True)
    category: str = Column(String, nullable=False)
    activity_type: str = Column(String, nullable=False)
    amount: float = Column(Float, nullable=False)
    emissions_kg: float = Column(Float, nullable=False)
    date: datetime.datetime = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    notes: str = Column(String, nullable=True)

class DBUserGoal(Base):
    __tablename__ = "user_goals"

    id: int = Column(Integer, primary_key=True, index=True)
    baseline: float = Column(Float, default=550.0) # default monthly kg CO2
    target: float = Column(Float, default=400.0)   # target monthly kg CO2
    xp: int = Column(Integer, default=0)
    level: int = Column(Integer, default=1)

def init_db() -> None:
    # Drop existing tables to reset schema (useful during development)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Ensure a default user goal exists
    db = SessionLocal()
    try:
        if not db.query(DBUserGoal).first():
            db.add(DBUserGoal(baseline=550.0, target=400.0, xp=0, level=1))
            db.commit()
    finally:
        db.close()

class DBAdoptedAction(Base):
    __tablename__ = "adopted_actions"

    id: int = Column(Integer, primary_key=True, index=True)
    action_key: str = Column(String, unique=True, index=True)
    title: str = Column(String, nullable=False)
    monthly_saving_kg: float = Column(Float, nullable=False)
    date_adopted: datetime.datetime = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

class DBUnlockedAchievement(Base):
    __tablename__ = "unlocked_achievements"

    id: int = Column(Integer, primary_key=True, index=True)
    achievement_key: str = Column(String, unique=True, index=True)
    title: str = Column(String, nullable=False)
    description: str = Column(String, nullable=False)
    unlocked_at: datetime.datetime = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

# Database Setup
DATABASE_URL = "sqlite:///./carbon_tracker.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


