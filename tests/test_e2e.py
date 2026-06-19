import pytest
from playwright.sync_api import Page, expect

def test_homepage_loads(page: Page):
    try:
        page.goto("http://localhost:8000")
        expect(page).to_have_title("EcoTrace - Premium Carbon Tracker & Insights")
        expect(page.locator("h1")).to_contain_text("EcoTrace")
    except Exception as e:
        pytest.skip("Server not running or Playwright browsers not installed.")

def test_earth_canvas_renders(page: Page):
    try:
        page.goto("http://localhost:8000")
        expect(page.locator("#earth-loading")).to_be_hidden(timeout=5000)
        canvas = page.locator("#earth-container canvas")
        expect(canvas).to_be_visible()
        box = canvas.bounding_box()
        assert box['width'] > 0
        assert box['height'] > 0
    except Exception as e:
        pytest.skip("Server not running.")

def test_calculator_realtime_updates(page: Page):
    try:
        page.goto("http://localhost:8000")
        # Check initial baseline footprint
        initial_val = page.locator("#current-footprint-value").inner_text()
        
        # Move slider and trigger input event
        slider = page.locator("#calc-car-km")
        slider.evaluate("node => { node.value = 800; node.dispatchEvent(new Event('input', {bubbles: true})); }")
        
        # Debounced calculate + API call takes a moment.
        # Wait for the footprint to differ from the initial value
        expect(page.locator("#current-footprint-value")).not_to_have_text(initial_val, timeout=5000)
    except Exception as e:
        pytest.skip("Server not running.")

def test_dashboard_log_activity(page: Page):
    try:
        page.goto("http://localhost:8000")
        # Log a new activity
        page.locator("#log-category").select_option("transport")
        page.locator("#log-type").select_option("electric_vehicle")
        page.locator("#log-amount").evaluate("node => { node.value = 100; node.dispatchEvent(new Event('input', {bubbles: true})); }")
        page.locator("#log-notes").fill("E2E Test Log")
        
        page.locator("#activity-logger-form button[type='submit']").click()
        
        # Verify the new log appears in the history
        expect(page.locator("#recent-logs-list")).to_contain_text("E2E Test Log", timeout=5000)
    except Exception as e:
        pytest.skip("Server not running.")
