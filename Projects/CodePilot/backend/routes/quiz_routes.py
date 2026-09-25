from flask import Blueprint, request, jsonify
from services.quiz_service import generate_quiz, check_quiz_answer
from utils.validators import validate_required_fields
from utils.logger import setup_logger

quiz_bp = Blueprint("quiz", __name__)
logger = setup_logger()


@quiz_bp.route("/quiz/generate", methods=["POST"])
def quiz_generate():
    """
    POST /api/quiz/generate
    Body: {
        "language": str (optional — user's preferred language),
        "difficulty": "easy"|"medium"|"hard" (optional, random if omitted),
        "exclude": [str] (optional — topics already asked, to avoid repeats),
        "model": str (optional)
    }
    """
    data = request.get_json(silent=True) or {}
    language = (data.get("language") or "").strip()
    difficulty = (data.get("difficulty") or "").strip().lower()
    exclude = data.get("exclude") or []
    model = data.get("model", None)

    logger.info(f"[/quiz/generate] lang={language} difficulty={difficulty} exclude={len(exclude)}")
    result = generate_quiz(language, difficulty=difficulty, exclude_topics=exclude, model=model)

    status = 200 if result["success"] else 503
    return jsonify(result), status


@quiz_bp.route("/quiz/check", methods=["POST"])
def quiz_check():
    """
    POST /api/quiz/check
    Body: {
        "question": str,
        "reference_solution": str,
        "user_code": str,
        "language": str (optional),
        "model": str (optional)
    }
    """
    data = request.get_json(silent=True) or {}
    error = validate_required_fields(data, ["question", "reference_solution", "user_code"])
    if error:
        return jsonify({"success": False, "error": error}), 400

    question = data["question"]
    reference_solution = data["reference_solution"]
    user_code = data["user_code"].strip()
    language = (data.get("language") or "").strip()
    model = data.get("model", None)

    if not user_code:
        return jsonify({"success": False, "error": "Answer cannot be empty"}), 400

    logger.info(f"[/quiz/check] lang={language} answer_len={len(user_code)}")
    result = check_quiz_answer(question, reference_solution, user_code, language=language, model=model)

    status = 200 if result["success"] else 503
    return jsonify(result), status
