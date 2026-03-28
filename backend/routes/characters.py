"""
routes/characters.py
Blueprint con el endpoint GET /characters.
"""

from flask import Blueprint, request, jsonify
from services.rick_api import (
    fetch_characters,
    ExternalAPIError,
    CharactersNotFoundError,
)

characters_bp = Blueprint("characters", __name__)


@characters_bp.route("/characters", methods=["GET"])
def get_characters():
    """
    GET /characters?name=<str>&page=<int>
    Retorna personajes filtrados y paginados.
    """
    name = request.args.get("name", "", type=str)
    page = request.args.get("page", 1, type=int)

    try:
        result = fetch_characters(name, page)
        return jsonify(result), 200

    except CharactersNotFoundError:
        return jsonify({"error": "No characters found", "code": 404}), 404

    except ExternalAPIError:
        return jsonify({"error": "External API unavailable", "code": 503}), 503
