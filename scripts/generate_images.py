import json
import os
from PIL import Image, ImageDraw, ImageFont

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, '..', 'backend')
FRONTEND_PUBLIC_DIR = os.path.join(BASE_DIR, '..', 'frontend', 'public')
STORES_JSON_PATH = os.path.join(BACKEND_DIR, 'app', 'data', 'stores.json')

def generate_placeholders():
    # Ensure stores.json exists
    if not os.path.exists(STORES_JSON_PATH):
        print(f"Error: {STORES_JSON_PATH} not found.")
        return

    # Read stores.json
    with open(STORES_JSON_PATH, 'r', encoding='utf-8') as f:
        stores = json.load(f)

    # Ensure output directory exists
    stores_img_dir = os.path.join(FRONTEND_PUBLIC_DIR, 'images', 'stores')
    os.makedirs(stores_img_dir, exist_ok=True)

    for store in stores:
        image_url = store.get('image_url')
        if not image_url:
            continue
            
        # Remove leading slash if present
        if image_url.startswith('/'):
            image_url = image_url[1:]
            
        # specific path handling
        full_path = os.path.join(FRONTEND_PUBLIC_DIR, image_url)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Generate image
        img = Image.new('RGB', (800, 600), color=(255, 71, 133)) # Primary pink color
        d = ImageDraw.Draw(img)
        
        # Add text
        text = store['name']['en']
        # Try to center text (rough estimation)
        d.text((50, 280), text, fill=(255, 255, 255))
        d.text((50, 320), store['category'], fill=(255, 255, 255))
        
        # Save
        if not os.path.exists(full_path):
            img.save(full_path)
            print(f"Generated: {full_path}")
        else:
            print(f"Skipped (exists): {full_path}")

if __name__ == "__main__":
    generate_placeholders()
