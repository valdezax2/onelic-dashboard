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

REQUIRED_COLUMNS = [
    "id",
    "category",
    "promise",
    "amount",
    "responsible_agency",
    "geography_site",
    "timeframe",
    "status",
    "notes",
    "verification_url",
]


def fetch_csv(csv_url: str) -> str:
    try:
        req = urllib.request.Request(csv_url, headers={"User-Agent": "onelic-dashboard-sync/1.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.read().decode("utf-8-sig")
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Failed to fetch sheet CSV: {exc}") from exc


def parse_rows(csv_text: str) -> list[dict[str, str]]:
    reader = csv.DictReader(io.StringIO(csv_text))
    if not reader.fieldnames:
        raise RuntimeError("CSV has no header row.")

    lower_to_actual = {name.strip().lower(): name for name in reader.fieldnames if name}
    missing = [col for col in REQUIRED_COLUMNS if col not in lower_to_actual]
    if missing:
        raise RuntimeError(
            "CSV is missing required columns: " + ", ".join(missing)
        )

    commitments: list[dict[str, str]] = []
    for row in reader:
        normalized = {}
        for key in REQUIRED_COLUMNS:
            actual = lower_to_actual[key]
            normalized[key] = (row.get(actual) or "").strip()

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
