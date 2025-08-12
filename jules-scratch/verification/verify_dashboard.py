from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. Navigate to the login page.
    page.goto("http://localhost:5173/login")

    # 2. Take a screenshot of the login page.
    page.screenshot(path="jules-scratch/verification/login_screenshot.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
