
from google import genai

from app.config import settings


client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)


def generate_response(prompt: str) -> str:
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt
    )

    return response.text
