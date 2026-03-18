import requests
import time

# Update this URL once lic_commitments.json is pushed to GitHub:
DATA_URL = "https://raw.githubusercontent.com/valdezax2/onelic-dashboard/main/lic_commitments.json"

# Fallback: load from local file during development
LOCAL_FALLBACK = "lic_commitments.json"

_cache = {"data": None, "ts": 0}
TTL = 300  # 5 minutes


def get_data():
    now = time.time()
    if _cache["data"] is None or now - _cache["ts"] > TTL:
        try:
            resp = requests.get(DATA_URL, timeout=5)
            resp.raise_for_status()
            _cache["data"] = resp.json()
        except Exception:
            # Fallback to local JSON during development
            import json, os
            local_path = os.path.join(os.path.dirname(__file__), LOCAL_FALLBACK)
            with open(local_path, "r") as f:
                _cache["data"] = json.load(f)
        _cache["ts"] = now
    return _cache["data"]


def get_commitments(category=None, status=None):
    data = get_data()
    items = data["commitments"]
    if category and category != "All":
        items = [c for c in items if c["category"] == category]
    if status and status != "All":
        items = [c for c in items if c["status"] == status]
    return items


def get_commitment(commitment_id):
    data = get_data()
    for c in data["commitments"]:
        if c["id"] == commitment_id:
            return c
    return None


def get_metadata():
    return get_data()["metadata"]


def get_stats(commitments=None):
    if commitments is None:
        commitments = get_commitments()
    total = len(commitments)
    complete = sum(1 for c in commitments if c["status"] == "Complete")
    planned = sum(1 for c in commitments if c["status"] == "Planned")
    in_progress = sum(1 for c in commitments if c["status"] == "In Progress")
    categories = {}
    for c in commitments:
        categories[c["category"]] = categories.get(c["category"], 0) + 1
    return {
        "total": total,
        "complete": complete,
        "planned": planned,
        "in_progress": in_progress,
        "categories": categories,
    }


def get_all_categories():
    data = get_data()
    seen = []
    for c in data["commitments"]:
        if c["category"] not in seen:
            seen.append(c["category"])
    return seen
