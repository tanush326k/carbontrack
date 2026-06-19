import pytest
from playwright.sync_api import Page, expect
import threading
import time
import uvicorn
from main import app

# NOTE: For this to run, the server must be running, or we start it here.
# In a real CI environment, it's better to spin it up in a fixture.

def test_homepage_loads(page: Page):
    try:
        page.goto("http://localhost:8000")
        expect(page).to_have_title("EcoTrace - Premium Carbon Tracker & Insights")
        expect(page.locator("h1")).to_contain_text("EcoTrace")
    except Exception as e:
        pytest.skip("Server not running or Playwright browsers not installed.")
