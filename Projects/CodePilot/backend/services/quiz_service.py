import json
import random
import re

from services.ollama_service import chat_with_ollama
from utils.logger import setup_logger

logger = setup_logger()


# ─────────────────────────────────────────────
# Topic bank — used to force variety/uniqueness
# instead of relying on the LLM alone to avoid
# repeating itself.
# ─────────────────────────────────────────────

TOPICS = [
    "arrays and two pointers", "string manipulation", "hash maps / dictionaries",
    "recursion", "sorting algorithms", "searching / binary search",
    "linked lists", "stacks", "queues", "trees and binary search trees",
    "graphs (BFS/DFS)", "dynamic programming", "greedy algorithms",
    "sliding window", "bit manipulation", "object-oriented design",
    "closures and higher-order functions", "error handling / exceptions",
    "math and number theory", "matrix / 2D array manipulation",
    "backtracking", "heaps / priority queues", "string parsing",
    "concurrency basics", "generics / templates", "regular expressions",
]

DIFFICULTIES = ["easy", "medium", "hard"]

QUIZ_SCHEMA_HINT = """{
  "title": "short question title (5-8 words)",
  "question": "the full problem statement in markdown, including 1-2 concrete input/output examples",
  "starter_code": "a minimal function signature/stub in the target language, with a TODO comment where the candidate fills in logic — e.g. 'function bubbleSort(arr) {\\n  // TODO: implement\\n}'. NEVER put sample data or test values here, only a function stub.",
  "reference_solution": "a complete, correct, well-commented reference solution in the target language",
  "explanation": "a short explanation (2-4 sentences) of the approach/complexity of the reference solution"
}"""

QUIZ_SYSTEM = f"""You are CodePilot's technical interviewer. You design short, self-contained \
coding interview questions and you respond ONLY with a single valid JSON object — \
no markdown fences, no commentary, no text before or after the JSON.

The JSON object must have exactly these keys:
{QUIZ_SCHEMA_HINT}

Rules:
- The question must be answerable in a single function.
- Keep the question self-contained (no external files/APIs/databases).
- Keep starter_code and reference_solution short and simple (under ~25 lines each) so the JSON stays compact.
- starter_code must be an actual function/method stub with a TODO comment — never just sample input data.
- starter_code and reference_solution must be valid code in the requested language only.
- All string values must be valid JSON strings (escape quotes, newlines as \\n, etc).
- Do not wrap the JSON in code fences. Return raw JSON only, with no text before or after it."""

CHECK_SCHEMA_HINT = """{
  "correct": true | false,
  "feedback": "2-4 sentences. If correct, briefly confirm why it works. If incorrect, explain \
specifically what is wrong or missing WITHOUT revealing the full reference solution."
}"""

CHECK_SYSTEM = f"""You are CodePilot's technical interview grader. You are given a coding \
interview question, its reference solution, and a candidate's submitted answer. \
Judge whether the candidate's answer correctly and reasonably solves the stated problem \
(minor style differences, variable naming, or a different-but-valid algorithmic approach are \
all fine — judge correctness and logic, not style).

Respond ONLY with a single valid JSON object, no markdown fences, no extra text:
{CHECK_SCHEMA_HINT}"""

REQUIRED_QUIZ_FIELDS = ["title", "question", "reference_solution"]

_GARBAGE_STARTER_RE = re.compile(r"^[\[\]\{\}\d,\.\s\-\"]+$")


def _default_starter_code(language: str, title: str) -> str:
    comment = {
        "python": "#", "ruby": "#", "sql": "--",
    }.get((language or "").lower(), "//")
    return f"{comment} TODO: implement — {title}\n"


def _sanitize_quiz(quiz: dict, language: str) -> dict:
    """Coerce fields to strings and replace obviously-bad values (e.g. a model
    dumping raw sample data like '[1,234567890]' into starter_code) with safe
    defaults, instead of failing the whole generation."""
    for key in ("title", "question", "starter_code", "reference_solution", "explanation"):
        if key in quiz and not isinstance(quiz[key], str):
            quiz[key] = json.dumps(quiz[key]) if quiz[key] is not None else ""

    starter = quiz.get("starter_code", "") or ""
    if not starter.strip() or _GARBAGE_STARTER_RE.match(starter.strip()):
        quiz["starter_code"] = _default_starter_code(language, quiz.get("title", "this problem"))

    quiz.setdefault("explanation", "")
    return quiz


def _find_balanced_json(text: str) -> str:
    """
    Scan for the first top-level {...} object, respecting string literals and
    escapes, so trailing/leading chatter or nested braces inside strings don't
    break extraction the way a naive rfind('}') would.
    """
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in model output")

    depth = 0
    in_string = False
    escape = False

    for i in range(start, len(text)):
        ch = text[i]

        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue

        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start:i + 1]

    raise ValueError("Unbalanced JSON object in model output (likely truncated)")


def _extract_json(text: str) -> dict:
    """Best-effort extraction + parsing of a JSON object from an LLM response."""
    text = text.strip()
    # Strip markdown code fences if the model added them anyway
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    # Fast path: the whole response is already clean JSON (typical with format=json)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Slow path: locate a balanced {...} block anywhere in the text
    try:
        candidate = _find_balanced_json(text)
    except ValueError as e:
        logger.error(f"Could not locate JSON object: {e} | raw={text[:300]!r}")
        raise ValueError("Model did not return valid JSON")

    try:
        return json.loads(candidate)
    except json.JSONDecodeError as e:
        # Common small-model mistake: trailing commas before } or ]
        repaired = re.sub(r",\s*([}\]])", r"\1", candidate)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse JSON from LLM output: {e} | raw={candidate[:300]!r}")
            raise ValueError("Model did not return valid JSON")


def _generate_quiz_attempt(language: str, difficulty: str, topic: str, seed: int,
                            exclude_topics, model: str, strict: bool = False) -> dict:
    lang_label = language or "a language of your choice"

    prompt = (
        f"Create a {difficulty} difficulty coding interview question in {lang_label} "
        f"about the topic: {topic}.\n"
        f"Randomization seed: {seed} (use this to vary the specific scenario/wording).\n"
        f"Do not reuse these previously-asked topics if you can avoid it: "
        f"{', '.join(exclude_topics) if exclude_topics else 'none yet'}.\n"
        f"Return the JSON object described in the system prompt, nothing else."
    )
    if strict:
        prompt += (
            "\n\nIMPORTANT: A previous attempt failed because the output was not valid JSON. "
            "Respond with ONLY a single, compact, syntactically valid JSON object matching the "
            f"schema exactly:\n{QUIZ_SCHEMA_HINT}\nNo markdown fences. No text outside the JSON."
        )

    return chat_with_ollama(
        prompt,
        system_prompt=QUIZ_SYSTEM,
        model=model,
        json_mode=True,
        num_predict=3000,
    )


def generate_quiz(language: str, difficulty: str = "", exclude_topics=None, model: str = None) -> dict:
    """Generate a unique, randomized coding interview question."""
    exclude_topics = exclude_topics or []

    available_topics = [t for t in TOPICS if t not in exclude_topics] or TOPICS
    topic = random.choice(available_topics)

    if difficulty not in DIFFICULTIES:
        difficulty = random.choice(DIFFICULTIES)

    seed = random.randint(100000, 999999)

    last_error = None
    used_model = model

    for attempt in range(2):
        result = _generate_quiz_attempt(
            language, difficulty, topic, seed, exclude_topics, model, strict=(attempt > 0)
        )
        used_model = result.get("model", used_model)

        if not result["success"]:
            return {"success": False, "error": result["error"], "model": used_model}

        try:
            quiz = _extract_json(result["content"])
        except ValueError as e:
            last_error = e
            logger.warning(f"[quiz] attempt {attempt + 1} failed to parse JSON, retrying...")
            continue

        missing = [k for k in REQUIRED_QUIZ_FIELDS if not quiz.get(k)]
        if missing:
            last_error = ValueError(f"Model response missing fields: {missing}")
            logger.warning(f"[quiz] attempt {attempt + 1} missing fields {missing}, retrying...")
            continue

        quiz = _sanitize_quiz(quiz, language)
        quiz["topic"] = topic
        quiz["difficulty"] = difficulty
        quiz["language"] = language
        return {"success": True, "quiz": quiz, "model": used_model, "error": None}

    return {
        "success": False,
        "error": (
            "The model couldn't produce a valid quiz question after a couple of tries "
            f"({last_error}). Try again, or switch to a stronger coding model "
            "(e.g. qwen2.5-coder or codellama:13b) in the status bar."
        ),
        "model": used_model,
    }


def check_quiz_answer(question: str, reference_solution: str, user_code: str,
                       language: str = "", model: str = None) -> dict:
    """Judge whether the user's submitted code correctly solves the quiz question."""
    prompt = (
        f"Question:\n{question}\n\n"
        f"Reference solution ({language}):\n```{language}\n{reference_solution}\n```\n\n"
        f"Candidate's submitted answer ({language}):\n```{language}\n{user_code}\n```\n\n"
        f"Judge the candidate's answer and return the JSON object described in the system prompt."
    )

    result = chat_with_ollama(
        prompt, system_prompt=CHECK_SYSTEM, model=model, json_mode=True, num_predict=800
    )
    if not result["success"]:
        return {"success": False, "error": result["error"], "model": result["model"]}

    try:
        verdict = _extract_json(result["content"])
    except ValueError:
        # Retry once with a stricter instruction before giving up
        retry_prompt = prompt + (
            "\n\nIMPORTANT: Respond with ONLY a single, compact, syntactically valid JSON "
            f"object matching this schema exactly:\n{CHECK_SCHEMA_HINT}\nNo other text."
        )
        result = chat_with_ollama(
            retry_prompt, system_prompt=CHECK_SYSTEM, model=model, json_mode=True, num_predict=800
        )
        if not result["success"]:
            return {"success": False, "error": result["error"], "model": result["model"]}
        try:
            verdict = _extract_json(result["content"])
        except ValueError as e:
            return {"success": False, "error": str(e), "model": result["model"]}

    if "correct" not in verdict or "feedback" not in verdict:
        return {"success": False, "error": "Model response missing fields", "model": result["model"]}

    return {
        "success": True,
        "correct": bool(verdict["correct"]),
        "feedback": verdict["feedback"],
        "model": result["model"],
        "error": None,
    }
