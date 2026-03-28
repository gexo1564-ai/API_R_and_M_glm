"""
app.py — Punto de entrada Flask para la aplicación Rick and Morty.
"""

import logging
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = Flask(__name__)

# CORS: permitir peticiones desde el frontend en localhost:3000
CORS(app, origins=["http://localhost:3000"])

# Registrar blueprints
from routes.characters import characters_bp  # noqa: E402

app.register_blueprint(characters_bp)


@app.route("/")
def index():
    return {"message": "Rick and Morty API Backend — v1.0"}, 200


if __name__ == "__main__":
    app.run(port=5001, debug=True)
