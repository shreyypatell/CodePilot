import re
from typing import List, Dict


def extract_code_blocks(text: str) -> List[Dict[str, str]]:
    """
    Parse markdown-style code blocks from LLM response.
    Returns list of {"language": str, "code": str}
    """
    pattern = r"```(\w+)?\n([\s\S]*?)```"
    matches = re.findall(pattern, text)

    blocks = []
    for lang, code in matches:
        blocks.append({
            "language": lang.strip() if lang else "plaintext",
            "code": code.strip()
        })

    return blocks


def detect_language(code: str) -> str:
    """Heuristically detect programming language from code snippet."""
    code_lower = code.lower()

    hints = {
        "python": ["def ", "import ", "print(", "class ", "elif ", "None", "True", "False"],
        "javascript": ["const ", "let ", "var ", "function ", "=>", "console.log"],
        "typescript": ["interface ", ": string", ": number", ": boolean", "type "],
        "java": ["public class", "System.out", "public static void main"],
        "cpp": ["#include", "cout <<", "cin >>", "std::", "int main()"],
        "c": ["#include <stdio", "printf(", "scanf(", "int main()"],
        "rust": ["fn main()", "let mut", "println!", "impl ", "use std"],
        "go": ["func main()", "package main", "fmt.Println", ":="],
        "sql": ["SELECT ", "FROM ", "WHERE ", "INSERT INTO", "CREATE TABLE"],
        "bash": ["#!/bin/bash", "echo ", "grep ", "chmod ", "export "],
        "html": ["<!DOCTYPE", "<html", "<div", "<body"],
        "css": ["{", "margin:", "padding:", "color:", "font-size:"],
    }

    scores = {lang: 0 for lang in hints}
    for lang, keywords in hints.items():
        for kw in keywords:
            if kw.lower() in code_lower:
                scores[lang] += 1

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "plaintext"
