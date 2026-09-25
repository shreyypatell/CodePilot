import requests
import json
from typing import Optional
from utils.logger import setup_logger

logger = setup_logger()

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "deepseek-coder"  # fallback: codellama


def get_available_models() -> list:
    """Fetch list of locally available Ollama models."""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        response.raise_for_status()
        data = response.json()
        return [m["name"] for m in data.get("models", [])]
    except requests.exceptions.ConnectionError:
        logger.error("Ollama is not running. Please start it with: ollama serve")
        return []
    except Exception as e:
        logger.error(f"Error fetching models: {e}")
        return []


def pick_model() -> str:
    """Auto-select best available coding model."""
    available = get_available_models()
    preferred = ["deepseek-coder", "codellama", "llama3", "mistral", "llama2"]
    for model in preferred:
        for available_model in available:
            if model in available_model.lower():
                return available_model
    if available:
        return available[0]
    return DEFAULT_MODEL


def chat_with_ollama(
    prompt: str,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None,
    stream: bool = False,
    json_mode: bool = False,
    num_predict: Optional[int] = None,
) -> dict:
    """
    Send a prompt to Ollama and return the response.
    json_mode=True asks Ollama to grammar-constrain the output to valid JSON
    (via the /api/chat "format": "json" option) — this is far more reliable
    than just instructing the model to "return JSON" in the prompt, especially
    for smaller local models.
    Returns: {"success": bool, "content": str, "model": str, "error": str}
    """
    if model is None:
        model = pick_model()

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "top_p": 0.9,
            "num_predict": num_predict or 2048,
        },
    }
    if json_mode:
        payload["format"] = "json"

    try:
        logger.info(f"Sending request to Ollama | model={model} | prompt_len={len(prompt)} | json_mode={json_mode}")
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload,
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        content = data.get("message", {}).get("content", "")
        logger.info(f"Received response | length={len(content)}")
        return {"success": True, "content": content, "model": model, "error": None}

    except requests.exceptions.ConnectionError:
        msg = "Cannot connect to Ollama. Make sure it's running: ollama serve"
        logger.error(msg)
        return {"success": False, "content": "", "model": model, "error": msg}

    except requests.exceptions.Timeout:
        msg = "Ollama request timed out. The model may be loading — try again."
        logger.error(msg)
        return {"success": False, "content": "", "model": model, "error": msg}

    except Exception as e:
        msg = f"Unexpected error: {str(e)}"
        logger.error(msg)
        return {"success": False, "content": "", "model": model, "error": msg}
