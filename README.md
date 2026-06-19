# EcoTrace

![License](https://img.shields.io/badge/License-MIT-green.svg)
![Python](https://img.shields.io/badge/Python-3.12-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)
![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)

EcoTrace is a premium, AI-powered sustainability platform designed to help individuals track, understand, and meaningfully reduce their carbon footprints. 

### The Problem
Climate change is the most pressing issue of our time, yet individual contributors often feel overwhelmed or disconnected from their direct impact on the environment. Understanding complex carbon footprint data and knowing precisely how to reduce it can be daunting and confusing.

### Why Sustainability Tracking Matters
What gets measured gets managed. By precisely tracking daily emissions—from transportation and dietary choices to household energy consumption—users can identify their highest-impact areas and make informed decisions to adopt greener lifestyles.

### How EcoTrace Helps
EcoTrace bridges the gap between raw data and actionable change. Through real-time tracking, gamified achievements, interactive visualizations, and personalized AI coaching, EcoTrace empowers users to effortlessly visualize their environmental impact and incentivizes sustainable habit building.

---

## Features

- **Sustainability Score:** A dynamic rating grading your overall eco-friendliness.
- **AI Sustainability Coach:** Natural language insights analyzing your habits and recommending actionable reductions.
- **Real-Time Carbon Calculator:** Ultra-responsive sliders instantly calculate and project your monthly carbon baseline.
- **Interactive Dashboard:** Beautiful glassmorphism metrics summarizing your carbon targets, logging history, and goals.
- **Carbon Savings Equivalents:** Visual representation of savings (e.g., equivalent to planting trees or removing cars).
- **Weekly Challenges:** Engaging, time-bound tasks to encourage sustainable routines.
- **Streak System:** Rewards consistent daily or weekly positive actions.
- **Achievement System:** Unlock exclusive badges as you level up your eco-warrior status.
- **Community Impact Dashboard:** Global aggregation of all users' positive environmental impacts.
- **Interactive Charts:** Rich, animated `Chart.js` breakdowns of your emission categories.
- **3D Earth Visualization:** A fully interactive, responsive `Three.js` globe cementing the global scale of your actions.
- **Dark Mode:** Seamless light/dark mode toggling that respects user system preferences.
- **Accessibility Features:** Fully WCAG-compliant design with ARIA labels and screen reader support.
- **Responsive Design:** Fluidly adapts to desktop, tablet, and mobile layouts.

---

## Technology Stack

**Frontend:**
- HTML5
- Vanilla CSS3 (Custom Variables, Flexbox, CSS Grid)
- Vanilla JavaScript (ES6+)
- Chart.js (Data Visualization)
- Three.js (3D Graphics Pipeline)

**Backend:**
- Python 3.12
- FastAPI (High-performance API framework)
- SQLAlchemy (ORM)

**Database:**
- SQLite (Lightweight, robust relational data storage)

**Deployment:**
- Docker (Containerization)
- Google Cloud Run (Serverless production hosting)

**Testing:**
- Playwright (End-to-End browser testing)
- Pytest (Unit and API integration testing)

---

## Architecture

### Frontend Flow
The Progressive Web App (PWA) client securely connects to the backend API. User inputs via sliders or activity forms are locally debounced before firing asynchronous requests, providing real-time UI updates without blocking the main rendering thread.

### Backend API Flow
FastAPI serves RESTful endpoints handling activity logging, AI coach insights, and goal tracking. The backend ensures data validation using Pydantic schemas before executing database transactions.

### Database Layer
A local SQLite database structured via SQLAlchemy models stores User targets, historical action logs, unlocked achievements, and tracked community metrics.

### Chart Rendering
The frontend dynamically binds calculation endpoints to a `Chart.js` canvas engine, mapping categorical JSON responses to distinct visual datasets with fluid transitions.

### 3D Visualization Pipeline
The `Three.js` WebGL renderer mounts a standard spherical mesh wrapped in ambient and directional lights. A `ResizeObserver` fallback pattern handles viewport changes, recalculating camera aspect ratios and re-projecting the `MeshStandardMaterial` dynamically.

---

## Accessibility

EcoTrace is built to be usable by everyone:
- **WCAG 2.2 Support:** Core contrast ratios and legible typography.
- **Keyboard Navigation:** All inputs, sliders, and form submission buttons are fully keyboard-navigable.
- **ARIA Labels:** Explicit semantic tags and roles applied to complex visual components (like charts and canvases).
- **Screen Reader Support:** Dynamic updates to calculations use `aria-live="polite"` to seamlessly announce state changes.
- **High Contrast Support:** The user-controlled Dark/Light mode accommodates visual preferences and light sensitivities.

---

## Security

- **Input Validation:** Strict Pydantic model validation on all backend API requests prevents injection and malformed data.
- **Secure API Design:** Built-in FastAPI mechanisms protect against typical REST vulnerabilities.
- **Security Headers:** Enforced `Content-Security-Policy` and `Strict-Transport-Security` headers on responses.
- **Rate Limiting:** Protects backend endpoints from DDoS or brute-force logging spam.

---

## Installation

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/carbontrack.git
cd carbontrack
```

**2. Create a virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

**3. Install Dependencies**
```bash
pip install -r requirements.txt
```

**4. Run the Application locally**
```bash
uvicorn main:app --reload --port 8000
```

---

## Docker Deployment

You can build and run EcoTrace entirely via Docker:

```bash
# Build the image
docker build -t ecotrace:latest .

# Run the container
docker run -p 8080:8080 ecotrace:latest
```

---

## Google Cloud Run Deployment

EcoTrace is engineered for serverless deployment on Google Cloud Run.

```bash
gcloud run deploy carbontrack \
    --source . \
    --region us-central1 \
    --allow-unauthenticated
```

---

## Testing

Ensure all functionalities perform seamlessly using the integrated test suite:

**Run API & Unit Tests:**
```bash
pytest tests/test_api.py -v
```

**Run End-to-End (Playwright) Tests:**
```bash
# Ensure your local server (uvicorn) is running in another terminal
pytest tests/test_e2e.py -v
```

---

## Screenshots

*(Coming Soon: Insert screenshots of the Dashboard, AI Coach, and 3D Earth here)*
![Dashboard Placeholder](#)
![Dark Mode Placeholder](#)

---

## Future Enhancements

- **OAuth2 / Social Login:** Implement multi-user accounts via Google or GitHub authentication.
- **IoT Smart Home Integration:** Automatically sync electricity usage from smart meters.
- **Global Carbon Offsetting:** Allow users to purchase direct, verified carbon offsets via Stripe integration.
- **Mobile Native Applications:** Wrap the existing PWA into fully native iOS and Android deployments using Capacitor.

---
*Developed as a premium AI-powered sustainability solution.*
