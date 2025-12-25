
import json
import os
import google.generativeai as genai
from PIL import Image
import io
import time

# --- Configuration ---
# Important: Set your Gemini API key as an environment variable before running.
# Example: export GEMINI_API_KEY="YOUR_API_KEY"
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("API key not found. Please set the GEMINI_API_KEY environment variable.")

# Configure the generative AI model
genai.configure(api_key=API_KEY)
# Using a model that supports image generation capabilities.
# The user-provided `gemini-3-pro-image-preview` seems to be an internal or future model.
# We'll use a powerful available model that can generate content based on prompts.
# Note: The API for image generation might differ. This script follows the user-provided structure.
MODEL = "gemini-3-pro-image-preview"
model = genai.GenerativeModel(MODEL)

# --- File Paths ---
# Get the absolute path of the script's directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths to the necessary files, relative to the script's location
TASKS_FILE = os.path.join(BASE_DIR, 'all_gen_tasks.json')
FOODS_FILE = os.path.join(BASE_DIR, '../data/foods.json')
IMAGE_OUTPUT_DIR = os.path.join(BASE_DIR, '../../client/public/images/menus')

# --- Main Logic ---
def generate_images():
    """
    Generates images based on tasks in a JSON file, skipping existing ones,
    and updates a central data file with the new image paths.
    """
    print("Starting AI image generation process...")

    # Load tasks and food data
    try:
        with open(TASKS_FILE, 'r', encoding='utf-8') as f:
            tasks = json.load(f)
        with open(FOODS_FILE, 'r', encoding='utf-8') as f:
            foods_data = json.load(f)
    except FileNotFoundError as e:
        print(f"Error: Could not read required file. {e}")
        return

    # Ensure the output directory for images exists
    if not os.path.exists(IMAGE_OUTPUT_DIR):
        os.makedirs(IMAGE_OUTPUT_DIR)
        print(f"Created image output directory: {IMAGE_OUTPUT_DIR}")

    # Create a lookup for food items for efficient updates
    foods_lookup = {item['id']: item for item in foods_data}

    for task in tasks:
        item_id = task.get('id')
        name = task.get('name')
        prompt = task.get('prompt')
        filename = task.get('filename')
        
        if not all([item_id, name, prompt, filename]):
            print(f"Skipping invalid task: {task}")
            continue

        output_path = os.path.join(IMAGE_OUTPUT_DIR, filename)

        # Skip if the image already exists
        if os.path.exists(output_path):
            print(f"Skipping existing image for ID {item_id}: {name}")
            continue

        print(f"Generating image for ID {item_id}: {name}...")

        try:
            # Send the prompt to the generative model
            # Note: The exact API call for image generation might vary.
            # This follows the structure from the user's provided script.
            response = model.generate_content(prompt)
            
            # The user's script expects image data in `inline_data`. We will process that.
            if response.candidates and response.candidates[0].content.parts:
                img_part = response.candidates[0].content.parts[0]
                if hasattr(img_part, 'inline_data'):
                    img_data = img_part.inline_data.data
                    image = Image.open(io.BytesIO(img_data))
                    
                    # Save the image
                    image.save(output_path)
                    print(f"  > Successfully saved image to {output_path}")

                    # Update the corresponding food item in the JSON data
                    if item_id in foods_lookup:
                        foods_lookup[item_id]['image'] = f"/images/menus/{filename}"
                        print(f"  > Updated image path in foods data for {name}.")
                    else:
                        print(f"  > Warning: Could not find food item with ID {item_id} to update.")

                else:
                    print(f"  > Error: API response for '{name}' did not contain image data.")
            else:
                 print(f"  > Error: Received an empty or invalid response from the API for '{name}'.")


        except Exception as e:
            print(f"  > An error occurred while processing ID {item_id}: {e}")
        
        # Add a small delay to respect potential API rate limits
        time.sleep(1)

    # Save the updated foods data back to the file
    try:
        with open(FOODS_FILE, 'w', encoding='utf-8') as f:
            json.dump(foods_data, f, indent=4, ensure_ascii=False)
        print("\nProcess complete. Updated foods data file saved successfully.")
    except IOError as e:
        print(f"\nError writing updates to foods data file: {e}")


if __name__ == "__main__":
    generate_images()
