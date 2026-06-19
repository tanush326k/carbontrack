from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

Base = declarative_base()

class DBActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)
    activity_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    emissions_kg = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(String, nullable=True)

class DBUserGoal(Base):
    __tablename__ = "user_goals"

    id = Column(Integer, primary_key=True, index=True)
    baseline = Column(Float, default=550.0) # default monthly kg CO2
    target = Column(Float, default=400.0)   # target monthly kg CO2
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)

def init_db():
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

    id = Column(Integer, primary_key=True, index=True)
    action_key = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    monthly_saving_kg = Column(Float, nullable=False)
    date_adopted = Column(DateTime, default=datetime.datetime.utcnow)

class DBUnlockedAchievement(Base):
    __tablename__ = "unlocked_achievements"

    id = Column(Integer, primary_key=True, index=True)
    achievement_key = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    unlocked_at = Column(DateTime, default=datetime.datetime.utcnow)

# Database Setup
DATABASE_URL = "sqlite:///./carbon_tracker.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

