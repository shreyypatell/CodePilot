from flask import Blueprint, request, jsonify
from services.code_service import generate_code, explain_code, fix_code, analyze_file, explain_error
from utils.validators import validate_required_fields
from utils.logger import setup_logger

code_bp = Blueprint("code", __name__)
logger = setup_logger()


@code_bp.route("/generate", methods=["POST"])
def generate():
    """
    POST /api/generate
    Body: { "prompt": str, "language": str (optional), "model": str (optional) }
    """
    data = request.get_json()
    error = validate_required_fields(data, ["prompt"])
    if error:
        return jsonify({"success": False, "error": error}), 400

    prompt = data["prompt"].strip()
    language = data.get("language", "").strip()
    model = data.get("model", None)

    if not prompt:
        return jsonify({"success": False, "error": "Prompt cannot be empty"}), 400

    logger.info(f"[/generate] prompt='{prompt[:60]}...' lang={language}")
    result = generate_code(prompt, language=language, model=model)

    status = 200 if result["success"] else 503
    return jsonify(result), status


@code_bp.route("/explain", methods=["POST"])
def explain():
    """
    POST /api/explain
    Body: { "code": str, "language": str (optional), "model": str (optional) }
    """
    data = request.get_json()
    error = validate_required_fields(data, ["code"])
    if error:
        return jsonify({"success": False, "error": error}), 400

    code = data["code"].strip()
    language = data.get("language", "").strip()
    model = data.get("model", None)

    if not code:
        return jsonify({"success": False, "error": "Code cannot be empty"}), 400

    logger.info(f"[/explain] code_len={len(code)} lang={language}")
    result = explain_code(code, language=language, model=model)

    status = 200 if result["success"] else 503
    return jsonify(result), status


@code_bp.route("/fix", methods=["POST"])
def fix():
    """
    POST /api/fix
    Body: { "code": str, "error_message": str (optional), "language": str (optional), "model": str (optional) }
    """
    data = request.get_json()
    error = validate_required_fields(data, ["code"])
    if error:
        return jsonify({"success": False, "error": error}), 400

    code = data["code"].strip()
    error_message = data.get("error_message", "").strip()
    language = data.get("language", "").strip()
    model = data.get("model", None)

    if not code:
        return jsonify({"success": False, "error": "Code cannot be empty"}), 400

    logger.info(f"[/fix] code_len={len(code)} has_error={bool(error_message)}")
    result = fix_code(code, error_message=error_message, language=language, model=model)

    status = 200 if result["success"] else 503
    return jsonify(result), status


@code_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    POST /api/analyze
    Body: { "content": str, "filename": str (optional), "model": str (optional) }
    Or multipart form with file upload
    """
    # Handle multipart file upload
    if request.content_type and "multipart/form-data" in request.content_type:
        file = request.files.get("file")
        if not file:
            return jsonify({"success": False, "error": "No file provided"}), 400

        filename = file.filename
        try:
            content = file.read().decode("utf-8")
        except UnicodeDecodeError:
            return jsonify({"success": False, "error": "File must be a text/code file"}), 400

        model = request.form.get("model", None)
    else:
        # Handle JSON body
        data = request.get_json()
        error = validate_required_fields(data, ["content"])
        if error:
            return jsonify({"success": False, "error": error}), 400
        content = data["content"].strip()
        filename = data.get("filename", "")
        model = data.get("model", None)

    if not content:
        return jsonify({"success": False, "error": "File content cannot be empty"}), 400

    logger.info(f"[/analyze] filename={filename} content_len={len(content)}")
    result = analyze_file(content, filename=filename, model=model)

    status = 200 if result["success"] else 503
    return jsonify(result), status


@code_bp.route("/explain-error", methods=["POST"])
def explain_error_route():
    """
    POST /api/explain-error
    Body: { "code": str, "error_message": str (optional), "language": str (optional), "model": str (optional) }
    Diagnoses WHY the given code is erroring (used by the "Error Message" box in the editor).
    """
    data = request.get_json()
    error = validate_required_fields(data, ["code"])
    if error:
        return jsonify({"success": False, "error": error}), 400

    code = data["code"].strip()
    error_message = data.get("error_message", "").strip()
    language = data.get("language", "").strip()
    model = data.get("model", None)

    if not code:
        return jsonify({"success": False, "error": "Code cannot be empty"}), 400

    logger.info(f"[/explain-error] code_len={len(code)} has_error_msg={bool(error_message)}")
    result = explain_error(code, error_message=error_message, language=language, model=model)

    status = 200 if result["success"] else 503
    return jsonify(result), status


@code_bp.route("/models", methods=["GET"])
def models():
    """GET /api/models — return available Ollama models"""
    from services.ollama_service import get_available_models, pick_model
    available = get_available_models()
    selected = pick_model()
    return jsonify({"models": available, "selected": selected}), 200
