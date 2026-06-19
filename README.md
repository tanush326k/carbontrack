# 🌱 Carbon Footprint Tracker

![License](https://img.shields.io/badge/License-MIT-green.svg)
![Python](https://img.shields.io/badge/Python-3.12-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal.svg)
![Google Cloud](https://img.shields.io/badge/Deployed_on-Google_Cloud_Run-4285F4.svg)

A modern, gamified web application built with **FastAPI** to help users track, analyze, and reduce their carbon emissions. Log your daily activities, adopt green habits, level up, and unlock achievements!

---

## 🚀 Features

- **Activity Logging**: Track emissions across multiple categories (Transportation, Energy, Food, Waste, Consumption).
- **Gamification Engine**: Earn XP and level up for adopting eco-friendly habits and tracking sustainable activities.
- **Achievements**: Unlock special badges like *Eco Commuter* and *Earth Defender*.
- **Carbon Scoring**: Get an instant carbon score rating (A to F) based on your footprint versus your goals.
- **Smart Recommendations**: Receive personalized tips based on your largest emission categories.
- **Cloud-Ready**: Fully dockerized and ready to be deployed to Google Cloud Run.

---

## 🏗️ System Architecture

The application uses a lightweight, highly responsive architecture:

```mermaid
graph TD
    User((User)) -->|Interacts with| UI[Frontend UI<br>HTML / JS / CSS]
    UI <-->|JSON over REST| API[FastAPI Backend]
    
    subgraph Backend Services
        API --> DB[(SQLite Database<br>models.py)]
        API --> Calc[Emission Calculator<br>calculations.py]
        API --> Score[Scoring Engine<br>scoring.py]
    end
    
    DB -->|Persists| Storage((Local Storage))
```

### 🔄 Data Flow: Logging an Activity

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as FastAPI
    participant C as Calculator
    participant D as Database

    U->>F: Submit Activity (e.g. 10km Drive)
    F->>B: POST /api/logs {category, amount}
    B->>C: calculate_emissions()
    C-->>B: emissions_kg
    B->>D: Save Activity Log
    B->>D: Update User XP & Level
    B-->>F: Return Updated Log & XP
    F-->>U: Show Success & New XP!
```

---

## 🛠️ Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy, Pydantic, Uvicorn
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (Fetch API)
- **Database:** SQLite (Relational structure)
- **Deployment:** Docker, Google Cloud Run

---

## 💻 Local Setup & Installation

Follow these steps to run the application on your local machine:

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/carbon-footprint-tracker.git
cd carbon-footprint-tracker
```

**2. Create a virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

**3. Install Dependencies**
```bash
pip install -r requirements.txt
```

**4. Run the Application**
```bash
uvicorn main:app --reload --port 8000
```

**5. Access the App**
- Web Interface: [http://localhost:8000](http://localhost:8000)
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ☁️ Deployment (Google Cloud Run)

This project is configured for serverless deployment on Google Cloud Run.

**1. Authenticate with Google Cloud**
```bash
gcloud auth login
gcloud config set project <YOUR-PROJECT-ID>
```

**2. Deploy via Source Code (Builds & Deploys automatically)**
```bash
gcloud run deploy carbon-app --source . --region us-central1 --allow-unauthenticated
```
*Cloud Run will automatically inject the `PORT` environment variable, which the `Dockerfile` is configured to handle.*

---

## 📂 Project Structure

```text
.
├── main.py               # FastAPI application entry point & routing
├── models.py             # SQLAlchemy database schemas
├── schemas.py            # Pydantic models for request/response validation
├── calculations.py       # Carbon emission math logic
├── scoring.py            # Carbon grading and recommendation logic
├── Dockerfile            # Container configuration for Cloud Run
├── requirements.txt      # Python dependencies
├── tests/                # Pytest suite
│   └── test_api.py       # API endpoint testing
└── static/               # Frontend assets
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request to help improve the tracking algorithms, add new habits, or enhance the frontend design.

## 📝 License
This project is licensed under the MIT License.
