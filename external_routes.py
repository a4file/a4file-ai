"""날씨·대기질(Open-Meteo) · 지도(Nominatim) · 환율(Frankfurter) 프록시."""

from __future__ import annotations

import json
import os
import time
from typing import Any

import requests
from flask import Response, request

USER_AGENT = "AI41-Sky/1.0 (ai41@ai41.kr; https://ai41.kr)"
CACHE_TTL_SEC = 600
_cache: dict[str, tuple[float, Any]] = {}


def _json(data, status: int = 200):
    return Response(
        json.dumps(data, ensure_ascii=False),
        status=status,
        content_type="application/json",
    )


def _json_error(status: int, message: str):
    return _json({"ok": False, "error": message}, status)


def _cache_get(key: str):
    hit = _cache.get(key)
    if not hit:
        return None
    exp, value = hit
    if exp < time.time():
        _cache.pop(key, None)
        return None
    return value


def _cache_set(key: str, value: Any) -> None:
    _cache[key] = (time.time() + CACHE_TTL_SEC, value)


def _default_weather_q() -> str:
    return (os.environ.get("WEATHER_DEFAULT_Q") or "서울").strip() or "서울"


def geocode(query: str) -> dict[str, Any] | None:
    q = (query or "").strip()
    if not q:
        return None
    key = f"geo:{q.lower()}"
    cached = _cache_get(key)
    if cached is not None:
        return cached
    res = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params={"q": q, "format": "json", "limit": 1, "addressdetails": 0},
        headers={"User-Agent": USER_AGENT, "Accept-Language": "ko"},
        timeout=15,
    )
    res.raise_for_status()
    rows = res.json()
    if not rows:
        _cache_set(key, None)
        return None
    row = rows[0]
    out = {
        "name": row.get("display_name") or q,
        "lat": float(row["lat"]),
        "lon": float(row["lon"]),
        "map_url": (
            f"https://www.openstreetmap.org/?mlat={row['lat']}&mlon={row['lon']}"
            f"#map=14/{row['lat']}/{row['lon']}"
        ),
    }
    _cache_set(key, out)
    return out


def fetch_weather(lat: float, lon: float) -> dict[str, Any]:
    key = f"wx:{round(lat, 3)}:{round(lon, 3)}"
    cached = _cache_get(key)
    if cached is not None:
        return cached
    res = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
            "daily": "temperature_2m_max,temperature_2m_min,weather_code",
            "timezone": "auto",
            "forecast_days": 2,
        },
        headers={"User-Agent": USER_AGENT},
        timeout=15,
    )
    res.raise_for_status()
    data = res.json()
    current = data.get("current") or {}
    daily = data.get("daily") or {}
    out = {
        "temperature_c": current.get("temperature_2m"),
        "humidity": current.get("relative_humidity_2m"),
        "wind_kmh": current.get("wind_speed_10m"),
        "weather_code": current.get("weather_code"),
        "weather_label": weather_code_label(current.get("weather_code")),
        "today_max": (daily.get("temperature_2m_max") or [None])[0],
        "today_min": (daily.get("temperature_2m_min") or [None])[0],
    }
    _cache_set(key, out)
    return out


def weather_code_label(code: Any) -> str:
    try:
        c = int(code)
    except (TypeError, ValueError):
        return "알 수 없음"
    if c == 0:
        return "맑음"
    if c in (1, 2, 3):
        return "구름 조금·많음"
    if c in (45, 48):
        return "안개"
    if c in (51, 53, 55, 56, 57):
        return "이슬비"
    if c in (61, 63, 65, 66, 67, 80, 81, 82):
        return "비"
    if c in (71, 73, 75, 77, 85, 86):
        return "눈"
    if c in (95, 96, 99):
        return "뇌우"
    return "흐림"


def register_external_routes(app):
    @app.route("/api/weather", methods=["GET", "OPTIONS"])
    def weather():
        if request.method == "OPTIONS":
            return Response(status=204)
        q = (request.args.get("q") or "").strip()
        lat_s = (request.args.get("lat") or "").strip()
        lon_s = (request.args.get("lon") or "").strip()
        place_name = q or _default_weather_q()
        try:
            if lat_s and lon_s:
                lat, lon = float(lat_s), float(lon_s)
                place = {"name": place_name, "lat": lat, "lon": lon}
                place["map_url"] = (
                    f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}#map=14/{lat}/{lon}"
                )
            else:
                place = geocode(q or _default_weather_q())
                if not place:
                    return _json_error(404, "장소를 찾지 못했어요")
            wx = fetch_weather(place["lat"], place["lon"])
            return _json({"ok": True, "place": place, "weather": wx})
        except requests.RequestException as e:
            return _json_error(502, f"Weather upstream failed: {e}")
        except Exception as e:
            return _json_error(500, str(e))

    @app.route("/api/maps/geocode", methods=["GET", "OPTIONS"])
    def maps_geocode():
        if request.method == "OPTIONS":
            return Response(status=204)
        q = (request.args.get("q") or "").strip()
        if not q:
            return _json_error(400, "q is required")
        try:
            place = geocode(q)
            if not place:
                return _json_error(404, "장소를 찾지 못했어요")
            return _json({"ok": True, "place": place})
        except requests.RequestException as e:
            return _json_error(502, f"Maps upstream failed: {e}")
        except Exception as e:
            return _json_error(500, str(e))

    @app.route("/api/search", methods=["GET", "OPTIONS"])
    def web_search():
        if request.method == "OPTIONS":
            return Response(status=204)
        q = (request.args.get("q") or "").strip()
        engine = (request.args.get("engine") or "google").strip().lower()
        if not q:
            return _json_error(400, "q is required")
        if engine == "naver":
            return _json(
                {
                    "ok": True,
                    "configured": False,
                    "engine": "naver",
                    "query": q,
                    "items": [],
                    "fallback_url": f"https://search.naver.com/search.naver?query={requests.utils.quote(q)}",
                }
            )
        key = (os.environ.get("GOOGLE_CSE_KEY") or "").strip()
        cx = (os.environ.get("GOOGLE_CSE_CX") or "342084dd1dfd24db3").strip()
        fallback = f"https://www.google.com/search?q={requests.utils.quote(q)}"
        if not key:
            return _json(
                {
                    "ok": True,
                    "configured": False,
                    "engine": "google",
                    "query": q,
                    "items": [],
                    "fallback_url": fallback,
                }
            )
        try:
            res = requests.get(
                "https://www.googleapis.com/customsearch/v1",
                params={"key": key, "cx": cx, "q": q, "num": 5, "hl": "ko", "safe": "active"},
                headers={"User-Agent": USER_AGENT},
                timeout=15,
            )
            data = res.json() if res.content else {}
            if not res.ok:
                msg = (data.get("error") or {}).get("message") or f"HTTP {res.status_code}"
                return _json_error(502, msg)
            items = []
            for row in data.get("items") or []:
                items.append(
                    {
                        "title": row.get("title") or "",
                        "url": row.get("link") or "",
                        "snippet": row.get("snippet") or "",
                        "source": row.get("displayLink") or "",
                    }
                )
            return _json(
                {
                    "ok": True,
                    "configured": True,
                    "engine": "google",
                    "query": q,
                    "items": items,
                    "fallback_url": fallback,
                }
            )
        except requests.RequestException as e:
            return _json_error(502, f"Search upstream failed: {e}")
        except Exception as e:
            return _json_error(500, str(e))

    @app.route("/api/fx", methods=["GET", "OPTIONS"])
    def fx():
        if request.method == "OPTIONS":
            return Response(status=204)
        src = (request.args.get("from") or "USD").strip().upper()
        dst = (request.args.get("to") or "KRW").strip().upper()
        try:
            amount = float(request.args.get("amount") or 1)
        except ValueError:
            return _json_error(400, "amount")
        key = f"fx:{src}:{dst}:{amount}"
        cached = _cache_get(key)
        if cached is not None:
            return _json(cached)
        try:
            res = requests.get(
                "https://api.frankfurter.app/latest",
                params={"from": src, "to": dst, "amount": amount},
                headers={"User-Agent": USER_AGENT},
                timeout=12,
            )
            res.raise_for_status()
            data = res.json()
            rate = (data.get("rates") or {}).get(dst)
            if rate is None:
                return _json_error(404, "환율을 못 찾았어요")
            out = {
                "ok": True,
                "from": src,
                "to": dst,
                "amount": amount,
                "value": rate,
                "date": data.get("date"),
            }
            _cache_set(key, out)
            return _json(out)
        except requests.RequestException as e:
            return _json_error(502, f"FX upstream failed: {e}")

    @app.route("/api/air", methods=["GET", "OPTIONS"])
    def air():
        if request.method == "OPTIONS":
            return Response(status=204)
        q = (request.args.get("q") or "").strip() or _default_weather_q()
        try:
            place = geocode(q)
            if not place:
                return _json_error(404, "장소를 찾지 못했어요")
            key = f"air:{round(place['lat'], 3)}:{round(place['lon'], 3)}"
            cached = _cache_get(key)
            if cached is not None:
                cached = dict(cached)
                cached["place"] = place
                return _json(cached)
            res = requests.get(
                "https://air-quality-api.open-meteo.com/v1/air-quality",
                params={
                    "latitude": place["lat"],
                    "longitude": place["lon"],
                    "current": "pm10,pm2_5,us_aqi",
                    "timezone": "auto",
                },
                headers={"User-Agent": USER_AGENT},
                timeout=12,
            )
            res.raise_for_status()
            cur = (res.json().get("current") or {})
            pm25 = cur.get("pm2_5")
            out = {
                "ok": True,
                "place": place,
                "pm25": pm25,
                "pm10": cur.get("pm10"),
                "label": _pm25_label(pm25),
            }
            _cache_set(key, out)
            return _json(out)
        except requests.RequestException as e:
            return _json_error(502, f"Air upstream failed: {e}")
        except Exception as e:
            return _json_error(500, str(e))


def _pm25_label(v):
    try:
        n = float(v)
    except (TypeError, ValueError):
        return "알 수 없음"
    if n <= 15:
        return "좋음"
    if n <= 35:
        return "보통"
    if n <= 75:
        return "나쁨"
    return "매우 나쁨"
