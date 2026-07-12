import os
import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# =============================================================================
# Database Configuration
# =============================================================================

# Vercel allows writing only to /tmp
if os.getenv("VERCEL"):
    DATABASE_URL = "sqlite:////tmp/carbon_tracker.db"
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'carbon_tracker.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base: Any = declarative_base()


# =============================================================================
# Models
# =============================================================================

class DBActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)
    activity_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    emissions_kg = Column(Float, nullable=False)
    date = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
    )
    notes = Column(String, nullable=True)


class DBUserGoal(Base):
    __tablename__ = "user_goals"

    id = Column(Integer, primary_key=True, index=True)
    baseline = Column(Float, default=550.0)
    target = Column(Float, default=400.0)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)


class DBAdoptedAction(Base):
    __tablename__ = "adopted_actions"

    id = Column(Integer, primary_key=True, index=True)
    action_key = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    monthly_saving_kg = Column(Float, nullable=False)
    date_adopted = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
    )


class DBUnlockedAchievement(Base):
    __tablename__ = "unlocked_achievements"

    id = Column(Integer, primary_key=True, index=True)
    achievement_key = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    unlocked_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
    )


# =============================================================================
# Database Initialization
# =============================================================================

def init_db() -> None:
    """
    Create database tables if they do not already exist.
    """

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        goal = db.query(DBUserGoal).first()

        if goal is None:
            db.add(
                DBUserGoal(
                    baseline=550.0,
                    target=400.0,
                    xp=0,
                    level=1,
                )
            )
            db.commit()

    finally:
        db.close()
