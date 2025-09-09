import asyncio
from playwright.async_api import async_playwright, Page, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:3000/login")

            # Click the "Sign in with Email" button to show the form
            await page.get_by_role("button", name="Sign in with Email").click()

            # Fill in the email and password
            await page.get_by_label("Email").fill("jules_test@example.com")
            await page.get_by_placeholder("Enter your password").fill("Welcome1!")

            # Click the sign-in button
            await page.get_by_role("button", name="Sign In").click()

            # Wait for navigation to the dashboard
            await expect(page).to_have_url("http://localhost:3000/", timeout=10000)

            # Click the notification bell icon
            # Using a more specific selector to target the button around the bell
            notification_button = page.locator('button:has(span:text-is("🔔"))')
            await notification_button.click()

            # Wait for the notification center to be visible
            notification_center = page.locator('div:has-text("Notifications")').last
            await expect(notification_center).to_be_visible()

            # Take a screenshot
            await page.screenshot(path="jules-scratch/verification/notification_center.png")

            print("Screenshot taken successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
            # Take a screenshot on error for debugging
            await page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
