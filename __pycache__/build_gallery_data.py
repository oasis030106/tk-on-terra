from __future__ import annotations

import json
from pathlib import Path

from gallery_server import discover_manga

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = BASE_DIR / "gallery-data.json"


def normalize_path(path: str) -> str:
  return path.lstrip("/")


def main() -> None:
  data = {"items": discover_manga()}
  for item in data["items"]:
    item["cover"] = normalize_path(item["cover"])
    item["pages"] = [normalize_path(page) for page in item["pages"]]
    if item.get("backdrop"):
      item["backdrop"] = normalize_path(item["backdrop"])
  OUTPUT_FILE.write_text(
    json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
  )
  print(f"Wrote {OUTPUT_FILE.relative_to(BASE_DIR)}")


if __name__ == "__main__":
  main()
