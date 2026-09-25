from flask import Flask
from flask_cors import CORS
from routes.code_routes import code_bp
from routes.chat_routes import chat_bp
from routes.quiz_routes import quiz_bp
from utils.logger import setup_logger

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    logger = setup_logger()
    app.logger.handlers = logger.handlers
    app.logger.setLevel(logger.level)

    # Register blueprints
    app.register_blueprint(code_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")
    app.register_blueprint(quiz_bp, url_prefix="/api")

    @app.route("/api/health", methods=["GET"])
    def health():
        return {"status": "ok", "message": "CodePilot backend is running"}, 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)