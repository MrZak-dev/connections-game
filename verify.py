from playwright.sync_api import sync_playwright

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Verify initial state
        page.locator('.menu-button').first.click()
        page.wait_for_selector('#left-side-menu')
        page.wait_for_timeout(500) # wait for animation
        page.screenshot(path="verification/left_side_menu.png")
        page.locator("#left-side-menu-close-area").click()
        page.wait_for_timeout(500) # wait for animation

        page.locator('.help-button').first.click()
        page.wait_for_selector('#how-to-play-modal')
        page.wait_for_timeout(500) # wait for animation
        page.screenshot(path="verification/how_to_play_modal.png")
        page.locator("#how-to-play-close-button").click()
        page.wait_for_timeout(500) # wait for animation

        browser.close()

if __name__ == "__main__":
    run_verification()
