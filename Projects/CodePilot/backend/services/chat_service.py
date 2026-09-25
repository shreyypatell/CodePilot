from services.ollama_service import chat_with_ollama
from utils.logger import setup_logger

logger = setup_logger()

CHAT_SYSTEM = """You are CodePilot, a highly capable AI coding assistant and software engineering expert.
You help developers with:
- Writing, debugging, and explaining code
- Architecture and design decisions
- Best practices and code reviews
- Learning new technologies
- Solving programming problems

Guidelines:
- Be concise but thorough
- Use code examples when helpful (always in markdown code blocks with language tags)
- Acknowledge uncertainty when you're not sure
- Focus on practical, actionable advice
- Be friendly and encouraging"""


def chat(
    message: str,
    history: list = None,
    context_file: str = None,
    model: str = None,
) -> dict:
    """
    General chat with optional conversation history and file context.
    history: [{"role": "user"|"assistant", "content": str}]
    context_file: string content of uploaded file for context-aware chat
    """
    from services.ollama_service import OLLAMA_BASE_URL
    import requests

    # Build messages array with history
    messages = [{"role": "system", "content": CHAT_SYSTEM}]

    if context_file:
        context_msg = (
            "I have uploaded a code file for context. "
            "Please use it to answer my questions:\n\n"
            f"```\n{context_file}\n```\n\n"
            "File loaded. Ask me anything about it."
        )
        messages.append({"role": "user", "content": context_msg})
        messages.append({
            "role": "assistant",
            "content": "I've loaded your code file and I'm ready to help. What would you like to know about it?"
        })

    if history:
        for entry in history[-10:]:  # limit to last 10 turns
            role = entry.get("role", "user")
            content = entry.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    if model is None:
        from services.ollama_service import pick_model
        model = pick_model()

    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.3, "top_p": 0.9, "num_predict": 2048},
    }

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload,
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        content = data.get("message", {}).get("content", "")
        return {"success": True, "content": content, "model": model, "error": None}
    except requests.exceptions.ConnectionError:
        msg = "Cannot connect to Ollama. Please run: ollama serve"
        return {"success": False, "content": "", "model": model, "error": msg}
    except Exception as e:
        return {"success": False, "content": "", "model": model, "error": str(e)}
