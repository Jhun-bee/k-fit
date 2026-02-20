import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "app")))

# Mock environment for Naver API if you want to run it live, 
# or just test the logic by importing functions.

from app.api.placeholder import _build_search_query, _search_naver_shopping

async def test_fallback_logic():
    print("=== Testing Search Queries ===")
    
    # Test case 1: Brand + Item (Likely to succeed for common brands)
    q1 = _build_search_query("SPAO", "패딩", "male")
    print(f"Query for SPAO Padding (Male): {q1}")
    
    # Test case 2: Restricted Brand fallback
    q2 = _build_search_query("ZARA", "셔츠", "female")
    print(f"Query for Restricted Zara (Female): {q2}")
    
    # Test case 3: Gender Mismatch
    # Matin Kim is female-only in our list
    q3 = _build_search_query("Matin Kim", "T-shirt", "male")
    print(f"Query for Matin Kim T-shirt (Male mismatch): {q3}")

    print("\n=== Verification of the logic requires live API keys or manual check of the logs ===")
    print("The updated placeholder_image now follows:")
    print("1. {brand} {item_name}")
    print("2. {item_name} (with gender prefix)")
    print("3. {brand}")
    print("4. SVG Fallback")

if __name__ == "__main__":
    asyncio.run(test_fallback_logic())
