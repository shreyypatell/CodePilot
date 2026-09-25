# 🚀 CodePilot — AI-Powered Coding Assistant

A fully local, free, open-source coding assistant powered by [Ollama](https://ollama.com) LLMs.
No OpenAI. No paid APIs. Everything runs on your machine.

---

## ✨ Features

| Feature | Description |
|---|---|
| 💬 **Chat** | General programming Q&A with conversation history |
| ⚡ **Generate** | Natural language → production-quality code |
| 📖 **Explain** | Deep code explanations with Monaco editor |
| 🔧 **Fix Bugs** | Identify and fix bugs, with optional error message context |
| 🔍 **Analyze** | Upload a code file for architecture & quality review |
| 🖥️ **Monaco Editor** | VS Code-style editor with syntax highlighting |
| 🔒 **100% Local** | All AI runs via Ollama — no data leaves your machine |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Monaco Editor |
| Backend | Python 3.10+ + Flask 3 |
| AI Runtime | Ollama (local LLM) |
| Models | deepseek-coder, codellama, or any Ollama model |

---

## 📁 Folder Structure

```
CodePilot/
├── backend/
│   ├── app.py                   # Flask app factory & entry point
│   ├── requirements.txt
│   ├── routes/
│   │   ├── code_routes.py       # /generate /explain /fix /analyze /models
│   │   └── chat_routes.py       # /chat
│   ├── services/
│   │   ├── ollama_service.py    # Core Ollama HTTP client
│   │   ├── code_service.py      # Code generation/explanation/fix prompts
│   │   └── chat_service.py      # Conversational chat with history
│   └── utils/
│       ├── code_parser.py       # Extract code blocks from LLM responses
│       ├── validators.py        # Request validation helpers
│       └── logger.py            # Structured logging setup
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example             # Copy to .env to set backend URL
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── ChatPanel.jsx
│       │   ├── EditorPanel.jsx
│       │   ├── StatusBar.jsx
│       │   ├── CodeBlock.jsx
│       │   ├── MessageRenderer.jsx
│       │   └── FileUpload.jsx
│       ├── hooks/
│       │   └── useOllama.js
│       ├── utils/
│       │   └── api.js
│       └── styles/
│           ├── globals.css
│           └── app.css
│
├── .gitignore
└── README.md
```

---

## ⚙️ Setup Instructions

### Step 1 — Install Ollama

**macOS / Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:** Download from https://ollama.com/download

### Step 2 — Pull a Coding Model

```bash
ollama pull deepseek-coder
```

### Step 3 — Backend

```bash
cd backend
python -m venv venv

# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

### Step 4 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## 🔁 Every Time You Run CodePilot

```bash
# Terminal 1 — Backend
cd backend
venv\Scripts\activate   # or: source venv/bin/activate
python app.py

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Ollama runs automatically in the background on Windows after install.

---

## 🌐 Deployment (Netlify + ngrok)

To share CodePilot publicly:

1. Run backend locally + expose with ngrok:
   ```bash
   ngrok http 5000
   ```

2. Copy the ngrok URL (e.g. `https://abc123.ngrok-free.app`)

3. Create `frontend/.env` and set:
   ```
   VITE_API_URL=https://abc123.ngrok-free.app/api
   ```

4. Build frontend:
   ```bash
   cd frontend && npm run build
   ```

5. Drag `frontend/dist/` folder to https://netlify.com

---

## 🛠️ API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/models` | List Ollama models |
| POST | `/api/generate` | Generate code from prompt |
| POST | `/api/explain` | Explain code |
| POST | `/api/fix` | Fix bugs in code |
| POST | `/api/analyze` | Analyze a code file |
| POST | `/api/chat` | General chat with history |

---

## 🔧 Troubleshooting

| Problem | Fix |
|---|---|
| Ollama offline in status bar | Ollama is not running — start it or restart PC |
| No models found | Run `ollama pull deepseek-coder` |
| Slow responses | Normal on first use — model loads into RAM |
| Port 5000 in use | Change port in `backend/app.py` |
| `npm install` fails | Ensure Node 18+ is installed |

---

## 📄 License

MIT — free to use, modify, and distribute.
