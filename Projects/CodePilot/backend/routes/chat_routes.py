from flask import Blueprint, request, jsonify
from services.chat_service import chat
from utils.validators import validate_required_fields
from utils.logger import setup_logger

chat_bp = Blueprint("chat", __name__)
logger = setup_logger()


@chat_bp.route("/chat", methods=["POST"])
def chat_endpoint():
    """
    POST /api/chat
    Body: {
        "message": str,
        "history": [{"role": "user"|"assistant", "content": str}] (optional),
        "context_file": str (optional — file content for context-aware chat),
        "model": str (optional)
    }
    """
    data = request.get_json()
    error = validate_required_fields(data, ["message"])
    if error:
        return jsonify({"success": False, "error": error}), 400

    message = data["message"].strip()
    history = data.get("history", [])
    context_file = data.get("context_file", None)
    model = data.get("model", None)

    if not message:
        return jsonify({"success": False, "error": "Message cannot be empty"}), 400

    logger.info(f"[/chat] message='{message[:60]}' history_len={len(history)}")
    result = chat(message, history=history, context_file=context_file, model=model)

    status = 200 if result["success"] else 503
    return jsonify(result), status
