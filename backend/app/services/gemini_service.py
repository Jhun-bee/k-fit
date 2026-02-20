import os
import io
import time
import base64
import logging
from PIL import Image
import google.generativeai as genai
from typing import List, Optional

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
        # Using gemini-3-pro-image-preview for highest quality fitting
        self.model_name = "gemini-3-pro-image-preview" 
        
    def _decode_image(self, image_b64: str) -> Image.Image:
        try:
            # Remove header if present (e.g., "data:image/jpeg;base64,")
            if "base64," in image_b64:
                image_b64 = image_b64.split("base64,")[1]
            
            image_data = base64.b64decode(image_b64)
            return Image.open(io.BytesIO(image_data))
        except Exception as e:
            print(f"Failed to decode base64 image: {e}")
            raise ValueError("Invalid image format")

    def virtual_try_on(self, user_image_b64: str, item_descriptions: List[str], product_images: List[dict] = [], language: str = "en") -> str:
        """
        Generates a virtual try-on image using Gemini.
        Returns base64 encoded string of the result image.
        
        product_images: List of dicts with {"name": str, "bytes": bytes, "mime_type": str}
        """
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY is not set")

        try:
            user_image = self._decode_image(user_image_b64)
            
            # Construct detailed item descriptions with references
            detailed_descriptions = ""
            for i, pi in enumerate(product_images):
                detailed_descriptions += f"- Item {i+1}: {pi['name']} (see reference image {i+2})\n"
            
            # Add items that don't have images
            for item_desc in item_descriptions:
                # Basic check to avoid duplicates if description matches product name
                # iterating item_descriptions (strings) vs product_images (dicts)
                 # Assuming item_descriptions contains names, let's just append any that weren't covered.
                 # Actually, fitting_service passes item_descriptions as "Name (Type)".
                 # Let's trust the product_images list is the source of truth for visuals, 
                 # and item_descriptions is helpful context or fallback.
                 pass

            # Update prompt as per user instruction
            prompt = f"""You are a virtual fitting room AI.

I'm providing:
1. A photo of a person (first image)
2. Product photos of clothing items (subsequent images)

Task: Generate a realistic photo of the person wearing ALL of the provided clothing items.

Rules:
- Keep the person's face, body shape, pose, and background as close to the original as possible
- The clothing items should match the product photos as closely as possible in color, pattern, style, and fit
- The result should look like a natural, realistic photo
- Do not add any text or watermarks
- Maintain the same photo quality and lighting as the original person photo

Clothing items:
{detailed_descriptions}
{chr(10).join([f"- {desc} (no reference image, use best judgment)" for desc in item_descriptions if not any(p['name'] in desc for p in product_images)])} 
"""
            
            # Standard safety settings to avoid accidental blocking of clothing/pose
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
            
            # Ensure using a model that supports multimodal input (image+text)
            # Using gemini-3-pro-image-preview as requested
            model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config={"response_modalities": ["TEXT", "IMAGE"], "temperature": 0.7},
                safety_settings=safety_settings
            )
            
            # Prepare contents
            contents = [prompt, user_image]
            print(f"[gemini] Sending request to {self.model_name}. Prompt length: {len(prompt)}")
            
            # Add product images
            for pi in product_images:
                contents.append({
                    "mime_type": pi["mime_type"],
                    "data": pi["bytes"]
                })
            
            # Generate content
            print(f"[gemini] Calling generate_content with {len(contents)} parts (1 prompt, {len(contents)-1} images)")
            response = model.generate_content(
                contents,
                request_options={"timeout": 60}
            )
            
            print(f"[gemini] Response received. Parts: {len(response.parts) if hasattr(response, 'parts') else 'N/A'}")

            if hasattr(response, "prompt_feedback") and response.prompt_feedback:
                print(f"[gemini] Prompt feedback: {response.prompt_feedback}")

            if not response.parts:
                # Check for candidates/safety
                if hasattr(response, "candidates") and response.candidates:
                    finish_reason = response.candidates[0].finish_reason
                    print(f"[gemini] No parts but candidate exists. Finish reason: {finish_reason}")
                raise ValueError("No content generated from Gemini (Check safety filters)")
                
            for part in response.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    print(f"[gemini] Found image in response! Size: {len(part.inline_data.data)/1024:.1f}KB")
                    return base64.b64encode(part.inline_data.data).decode('utf-8')
                
            if response.text:
                print(f"[gemini] Gemini returned text instead of image: {response.text[:200]}...")
                raise ValueError(f"Gemini returned text instead of image: {response.text[:100]}")

            raise ValueError("No image found in Gemini response parts")

        except Exception as e:
            import traceback
            print(f"Gemini virtual try-on failed: {e}")
            print(traceback.format_exc())
            raise e

    def style_edit(self, image_b64: str, edit_command: str, language: str) -> str:
        """
        Edits the user's outfit based on natural language command.
        """
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY is not set")
            
        try:
            user_image = self._decode_image(image_b64)
            
            prompt = f"""
            You are a fashion photo editor.
            Task: Edit the photo according to the user's request.
            Request: "{edit_command}"
            
            Requirements:
            1. Keep the person's identity and pose exactly the same.
            2. Only modify the clothing or style as requested.
            3. Maintain photorealism.
            """
            
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content([prompt, user_image]) # Assuming same multimodal capability
            
            for part in response.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    return base64.b64encode(part.inline_data.data).decode('utf-8')
            
            if response.text:
                 logger.warning(f"Gemini returned text: {response.text}")
                 raise ValueError("Gemini returned text instead of image.")
                 
            raise ValueError("No image generated")

        except Exception as e:
            logger.error(f"Gemini style edit failed: {e}")
            raise e

gemini_service = GeminiService()
