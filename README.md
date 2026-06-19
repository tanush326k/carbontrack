# EcoTrace

![License](https://img.shields.io/badge/License-MIT-green.svg)
![Python](https://img.shields.io/badge/Python-3.12-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)

EcoTrace is a premium sustainability tracker that provides real‑time carbon calculations, gamified progress, and an interactive 3D Earth visualization.

## Features
- Real‑time carbon footprint calculator with instant slider updates
- Interactive sliders for activity input
- Gamified dashboard with XP and level progression
- 3D Earth visualization (Three.js) that renders on load and after refresh
- Responsive UI dashboard supporting light/dark themes
- Chart‑based analytics using Chart.js

## Technology Stack
- **Frontend:** HTML, CSS (custom variables, Flexbox, Grid), Vanilla JavaScript, Chart.js, Three.js
- **Backend:** Python 3.12, FastAPI
- **Deployment:** Docker, Google Cloud Run

## Architecture Overview
1. **Slider → State Update → Calculation Pipeline** – Slider changes update the local state, trigger debounced calculations, and refresh the UI instantly.
2. **Dashboard Update Flow** – API responses update summary cards, charts, and the gamified progress bar.
3. **Three.js Initialization Flow** – `init3DEarth()` creates a fresh scene, camera, renderer, adds lighting, and starts the animation loop. Previous instances are disposed on each load to guarantee consistent rendering.

## Installation
```bash
# Clone repository
git clone https://github.com/yourusername/ecotrace.git
cd ecotrace

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn main:app --reload --port 8000
```

## Docker Deployment
```bash
# Build Docker image
docker build -t ecotrace:latest .

# Run container
docker run -p 8080:8080 ecotrace:latest
```

## Google Cloud Run Deployment
```bash
gcloud run deploy carbontrack \
    --source . \
    --region us-central1 \
    --allow-unauthenticated
```

## Testing
```bash
# API and unit tests
pytest tests/test_api.py -v
```

*The application is production‑ready with stable slider behavior, reliable 3D Earth rendering, and consistent theme handling.*
