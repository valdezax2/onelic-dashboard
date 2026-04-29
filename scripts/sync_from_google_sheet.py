#!/usr/bin/env python3
"""Sync commitments from a Google Sheet CSV export into lic_commitments.json."""

from __future__ import annotations

import csv
import datetime as dt
import io
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "lic_commitments.json"

REQUIRED_COLUMNS = {
    "id": ["commitment id", "id"],
    "category": ["category"],
    "promise": ["promise / commitment", "promise", "commitment"],
    "amount": ["amount / scale", "amount", "scale"],
    "responsible_agency": ["responsible agency", "agency"],
    "geography_site": ["geography / site", "geography", "site"],
    "timeframe": ["timeframe (as stated)", "timeframe"],
    "status": ["status (initial)", "status"],
    "notes": ["notes / verification fields", "notes", "verification fields"],
    "verification_url": ["verification url", "verification link"],
}


def fetch_csv(csv_url: str) -> str:
    try:
        req = urllib.request.Request(csv_url, headers={"User-Agent": "onelic-dashboard-sync/1.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.read().decode("utf-8-sig")
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Failed to fetch sheet CSV: {exc}") from exc


def build_column_map(fieldnames: list[str]) -> dict[str, str]:
    """Map internal column names to actual CSV headers."""
    lower_to_actual = {name.strip().lower(): name for name in fieldnames if name}
    mapping = {}

    for internal_name, aliases in REQUIRED_COLUMNS.items():
        for alias in aliases:
            if alias.lower() in lower_to_actual:
                mapping[internal_name] = lower_to_actual[alias.lower()]
                break
        
        if internal_name not in mapping:
            raise RuntimeError(f"Could not find column for '{internal_name}'. Available: {', '.join(lower_to_actual.keys())}")

    return mapping


def parse_rows(csv_text: str) -> list[dict[str, str]]:
    reader = csv.DictReader(io.StringIO(csv_text))
    if not reader.fieldnames:
        raise RuntimeError("CSV has no header row.")

    column_map = build_column_map(reader.fieldnames)

    commitments: list[dict[str, str]] = []
    for row in reader:
        normalized = {}
        for internal_name, actual_name in column_map.items():
            normalized[internal_name] = (row.get(actual_name) or "").strip()

        # Skip blank lines.
        if not any(normalized.values()):
            continue

        commitments.append(normalized)

    return commitments


def read_existing_metadata() -> dict:
    if not OUTPUT_PATH.exists():
        return {}

    try:
        existing = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}

    return existing.get("metadata", {}) if isinstance(existing, dict) else {}


def build_metadata(existing: dict, total: int) -> dict:
    today = dt.date.today().isoformat()
    return {
        "plan_name": os.getenv("PLAN_NAME", existing.get("plan_name", "One LIC Neighborhood Plan")),
        "geography": os.getenv("PLAN_GEOGRAPHY", existing.get("geography", "Long Island City, Queens, NYC")),
        "last_updated": today,
        "source_url": os.getenv("PLAN_SOURCE_URL", existing.get("source_url", "")),
        "total_commitments": total,
    }


def main() -> int:
    csv_url = os.getenv("GOOGLE_SHEET_CSV_URL", "").strip()
    if not csv_url:
        print("GOOGLE_SHEET_CSV_URL is not set.", file=sys.stderr)
        return 1

    csv_text = fetch_csv(csv_url)
    commitments = parse_rows(csv_text)
    metadata = build_metadata(read_existing_metadata(), len(commitments))

    payload = {
        "metadata": metadata,
        "commitments": commitments,
    }

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(commitments)} commitments to {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
