"""
services/rick_api.py
Lógica de consumo de la API externa de Rick and Morty con caché en memoria.
"""

import os
import logging
import requests
from cachetools import TTLCache, cached

logger = logging.getLogger(__name__)

# --- Cache ---
_cache_ttl = int(os.getenv("CACHE_TTL_SECONDS", 300))
cache = TTLCache(maxsize=128, ttl=_cache_ttl)


class ExternalAPIError(Exception):
    """La API externa de Rick and Morty no está disponible."""
    pass


class CharactersNotFoundError(Exception):
    """No se encontraron personajes con los filtros dados."""
    pass


def _make_cache_key(name: str, page: int):
    return (name.lower().strip(), page)


@cached(cache=cache, key=lambda name, page: _make_cache_key(name, page))
def fetch_characters(name: str, page: int) -> dict:
    """
    Consulta la API externa, transforma los datos y devuelve el resultado.
    Cachea por (name, page) durante CACHE_TTL_SECONDS segundos.
    """
    base_url = os.getenv(
        "RICK_AND_MORTY_API_BASE_URL", "https://rickandmortyapi.com/api"
    )
    url = f"{base_url}/character"

    params = {"page": page}
    if name:
        params["name"] = name

    logger.info("⏳ Fetching from external API: %s params=%s", url, params)

    try:
        response = requests.get(url, params=params, timeout=10)
    except requests.exceptions.RequestException as exc:
        logger.error("🔴 External API request failed: %s", exc)
        raise ExternalAPIError("External API unavailable") from exc

    if response.status_code == 404:
        raise CharactersNotFoundError("No characters found")

    if response.status_code != 200:
        logger.error(
            "🔴 External API returned status %s: %s",
            response.status_code,
            response.text[:200],
        )
        raise ExternalAPIError("External API unavailable")

    payload = response.json()

    # --- Transformación: calcular episode_count ---
    characters = []
    for char in payload.get("results", []):
        characters.append(
            {
                "id": char["id"],
                "name": char["name"],
                "status": char["status"],
                "species": char["species"],
                "type": char.get("type", ""),
                "gender": char["gender"],
                "origin": char["origin"],
                "location": char["location"],
                "image": char["image"],
                "episode_count": len(char.get("episode", [])),
                "url": char["url"],
                "created": char["created"],
            }
        )

    info = payload.get("info", {})
    result = {
        "data": characters,
        "page": page,
        "total_pages": info.get("pages", 1),
    }

    logger.info(
        "✅ Fetched %d characters (page %d/%d)",
        len(characters),
        page,
        result["total_pages"],
    )

    return result
