
import time

from google import genai
from google.genai import errors, types

from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}
MAX_ATTEMPTS = 3


def generate_response(
    prompt: str,
    response_mime_type: str | None = None,
) -> str:
    config = None

    if response_mime_type:
        config = types.GenerateContentConfig(
            response_mime_type=response_mime_type
        )

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=config,
            )

            if not response.text or not response.text.strip():
                finish_reason = None

                if response.candidates:
                    finish_reason = response.candidates[0].finish_reason

                raise RuntimeError(
                    "Gemini returned an empty response. "
                    f"Finish reason: {finish_reason}"
                )

            return response.text.strip()

        except errors.APIError as error:
            status_code = error.code

            if status_code not in RETRYABLE_STATUS_CODES:
                raise

            if attempt == MAX_ATTEMPTS:
                raise RuntimeError(
                    f"Gemini unavailable after {MAX_ATTEMPTS} attempts. "
                    f"Last error: {error}"
                ) from error

            wait_time = 2 ** attempt

            print(
                f"Gemini temporarily unavailable (HTTP {status_code}). "
                f"Retrying in {wait_time} seconds..."
            )

            time.sleep(wait_time)
