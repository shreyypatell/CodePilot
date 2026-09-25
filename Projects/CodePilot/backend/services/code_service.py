from services.ollama_service import chat_with_ollama
from utils.code_parser import extract_code_blocks
from utils.logger import setup_logger

logger = setup_logger()


# ─────────────────────────────────────────────
# System Prompts
# ─────────────────────────────────────────────

GENERATE_SYSTEM = """You are CodePilot, an expert software engineer and coding assistant.
When asked to generate code:
- Write clean, well-commented, production-quality code
- Include necessary imports
- Add brief inline comments for non-obvious logic
- Wrap code in proper markdown code blocks with language tags (e.g. ```python)
- After the code, briefly explain what it does and how to use it
- If the request is ambiguous, make reasonable assumptions and note them"""

EXPLAIN_SYSTEM = """You are CodePilot, an expert software engineer and code educator.
When explaining code:
- Give a clear, structured explanation
- Start with a one-line summary of what the code does
- Break down the key parts/functions
- Explain any non-obvious logic or patterns
- Mention time/space complexity for algorithms if relevant
- Keep the explanation accessible but technically accurate"""

FIX_SYSTEM = """You are CodePilot, an expert software engineer and debugger.
When fixing code:
- Identify ALL bugs, errors, and potential issues
- Explain what each bug is and why it's a problem
- Provide the COMPLETE fixed code (not just snippets)
- Wrap fixed code in proper markdown code blocks with language tags
- List each change you made and why
- Suggest any additional improvements for robustness"""

ANALYZE_SYSTEM = """You are CodePilot, an expert software architect and code reviewer.
When analyzing a code file:
- Provide a high-level summary of what the file/code does
- List all functions/classes with brief descriptions
- Identify code smells, anti-patterns, or potential bugs
- Suggest specific improvements with examples
- Rate the code quality (1-10) with justification
- Highlight any security concerns if present"""

EXPLAIN_ERROR_SYSTEM = """You are CodePilot, an expert software engineer specializing in root-cause \
error analysis. Given a piece of code (and optionally an error message/stack trace the user already has),
your job is to explain WHY the error is happening — not to rewrite the whole program.
- If an error message was provided, tie your explanation directly to it (line numbers, variable names, etc.)
- If no error message was provided, carefully read the code and identify the most likely bug(s) that
  would cause it to fail (syntax error, type error, off-by-one, null/undefined reference, logic error, etc.)
- Explain the root cause in plain language: what the code is doing vs. what it should be doing
- Point to the specific line(s) or expression(s) responsible
- Keep it focused on the "why", not a full rewrite — a short suggested direction for the fix is fine,
  but do not paste the entire corrected file
- Keep the explanation concise: a few short paragraphs or a short bulleted list"""



# ─────────────────────────────────────────────
# Service Functions
# ─────────────────────────────────────────────

def generate_code(prompt: str, language: str = "", model: str = None) -> dict:
    """Generate code from a natural language prompt."""
    lang_hint = f" in {language}" if language else ""
    full_prompt = f"Generate code{lang_hint} for the following task:\n\n{prompt}"

    result = chat_with_ollama(full_prompt, system_prompt=GENERATE_SYSTEM, model=model)
    if result["success"]:
        result["code_blocks"] = extract_code_blocks(result["content"])
    return result


def explain_code(code: str, language: str = "", model: str = None) -> dict:
    """Explain what a piece of code does."""
    lang_hint = f"({language})" if language else ""
    full_prompt = f"Please explain this code {lang_hint}:\n\n```{language}\n{code}\n```"

    result = chat_with_ollama(full_prompt, system_prompt=EXPLAIN_SYSTEM, model=model)
    return result


def fix_code(code: str, error_message: str = "", language: str = "", model: str = None) -> dict:
    """Identify and fix bugs in the provided code."""
    lang_hint = f"({language})" if language else ""
    error_hint = f"\n\nError message:\n{error_message}" if error_message else ""

    full_prompt = (
        f"Fix the bugs in this code {lang_hint}:\n\n"
        f"```{language}\n{code}\n```"
        f"{error_hint}"
    )

    result = chat_with_ollama(full_prompt, system_prompt=FIX_SYSTEM, model=model)
    if result["success"]:
        result["code_blocks"] = extract_code_blocks(result["content"])
    return result


def analyze_file(file_content: str, filename: str = "", model: str = None) -> dict:
    """Perform a deep analysis of an uploaded code file."""
    file_hint = f"File: {filename}\n\n" if filename else ""
    full_prompt = (
        f"{file_hint}Please analyze this code file thoroughly:\n\n"
        f"```\n{file_content}\n```"
    )

    result = chat_with_ollama(full_prompt, system_prompt=ANALYZE_SYSTEM, model=model)
    return result


def explain_error(code: str, error_message: str = "", language: str = "", model: str = None) -> dict:
    """Diagnose and explain WHY an error is occurring in the given code."""
    lang_hint = f"({language})" if language else ""

    if error_message:
        full_prompt = (
            f"Here is my code {lang_hint}:\n\n```{language}\n{code}\n```\n\n"
            f"Here is the error message / stack trace I'm getting:\n\n{error_message}\n\n"
            f"Explain exactly why this error is happening."
        )
    else:
        full_prompt = (
            f"Here is my code {lang_hint}:\n\n```{language}\n{code}\n```\n\n"
            f"I don't have an explicit error message, but something is wrong. "
            f"Inspect the code and explain what error(s) it would likely produce and why."
        )

    result = chat_with_ollama(full_prompt, system_prompt=EXPLAIN_ERROR_SYSTEM, model=model)
    return result
