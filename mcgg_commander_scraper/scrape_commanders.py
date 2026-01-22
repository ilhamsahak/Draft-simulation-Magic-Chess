from playwright.sync_api import sync_playwright
import pytesseract
from PIL import Image
import requests
import os
import time
import re
import hashlib

# 🔧 Update if needed
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

URL = "https://magicchessgogo.com/"
START_DELAY_SECONDS = 8  # time for manual setup

def clean_name(text):
    text = text.upper()
    text = re.sub(r'[^A-Z ]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def hash_file(path):
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()

def screenshot_name_box(page):
    viewport = page.viewport_size
    clip = {
        "x": int(viewport["width"] * 0.46),
        "y": int(viewport["height"] * 0.18),
        "width": int(viewport["width"] * 0.48),
        "height": int(viewport["height"] * 0.20),
    }
    path = "tmp_name.png"
    page.screenshot(path=path, clip=clip)
    return path

def ocr_name(path):
    img = Image.open(path)
    text = pytesseract.image_to_string(img, config="--psm 7")
    return clean_name(text)

def get_main_character_image(page):
    """
    Find the LARGE commander character image (the one you right-click).
    """
    viewport = page.viewport_size

    candidates = []

    for img in page.query_selector_all("img"):
        box = img.bounding_box()
        if not box:
            continue

        # Must be LARGE (character art)
        if box["width"] < viewport["width"] * 0.20:
            continue
        if box["height"] < viewport["height"] * 0.40:
            continue

        # Must be on LEFT side
        if box["x"] > viewport["width"] * 0.45:
            continue

        src = img.get_attribute("src")
        if not src:
            continue

        area = box["width"] * box["height"]
        candidates.append((area, src))

    if not candidates:
        return None

    # Pick the largest image
    candidates.sort(reverse=True)
    return candidates[0][1]

# ==========================
# MAIN
# ==========================
os.makedirs("commanders/character", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    print("🌐 Opening website...")
    page.goto(URL, timeout=60000)

    print(f"⏳ WAIT {START_DELAY_SECONDS}s")
    print("👉 Manually close popup, accept cookies, click COMMANDERS")
    time.sleep(START_DELAY_SECONDS)

    print("🚀 Starting character scraping")

    seen = set()
    last_hash = None

    while True:
        # Read name
        name_img = screenshot_name_box(page)
        img_hash = hash_file(name_img)

        if img_hash == last_hash:
            time.sleep(0.5)
            continue

        last_hash = img_hash
        name = ocr_name(name_img)

        if not name:
            continue

        if name in seen:
            print("🏁 All commanders scraped")
            break

        print(f"🧍 Saving character image for: {name}")

        character_src = get_main_character_image(page)
        if character_src:
            filename = name.replace(" ", "_")
            data = requests.get(character_src).content
            with open(f"commanders/character/{filename}.png", "wb") as f:
                f.write(data)
            print(f"✅ Saved: {filename}.png")
        else:
            print("⚠ Character image not found")

        seen.add(name)

        # Wait for auto-slide
        time.sleep(1)

    browser.close()
