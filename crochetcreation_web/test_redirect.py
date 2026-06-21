import sys
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen to console and network events
        page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err.message}"))
        page.on("request", lambda req: print(f"REQ: {req.method} {req.url}"))
        page.on("response", lambda res: print(f"RES: {res.status} {res.url}"))

        print("Navigating to http://localhost:3000/admin/dashboard...")
        try:
            # Go to page and wait for a short duration
            page.goto('http://localhost:3000/admin/dashboard', wait_until='commit', timeout=10000)
            print("Page loaded/committed. Waiting 10 seconds to observe reload behavior...")
            page.wait_for_timeout(10000)
        except Exception as e:
            print(f"Navigation failed: {e}")
        
        browser.close()

if __name__ == '__main__':
    run()
