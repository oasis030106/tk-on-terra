from __future__ import annotations

import json
import os
import re
import socketserver
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from typing import Dict, List

BASE_DIR = Path(__file__).resolve().parent
MANGA_DIR = BASE_DIR / "manga"
MEDIA_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}




def read_text_safely(file_path: Path, *, fallback: str = "") -> str:
  if not file_path.exists():
    return fallback
  data = file_path.read_bytes()
  for encoding in ("utf-8", "utf-8-sig", "gb18030"):
    try:
      return data.decode(encoding).strip() or fallback
    except UnicodeDecodeError:
      continue
  return fallback


def natural_key(path: Path):
  parts = re.split(r"(\d+)", path.name)
  key = []
  for part in parts:
    if part.isdigit():
      key.append(int(part))
    else:
      key.append(part.lower())
  return key


def load_description(directory: Path, metadata: Dict[str, str]) -> str:
  if description := metadata.get("description"):
    return description
  for name in ("description.txt", "desc.txt", "简介.txt"):
    candidate = directory / name
    if candidate.exists():
      content = read_text_safely(candidate)
      if content:
        return content
  return "暂无简介，欢迎补充。"


def load_metadata(directory: Path) -> Dict[str, str]:
  meta_file = directory / "meta.json"
  if not meta_file.exists():
    return {}
  raw = read_text_safely(meta_file)
  if not raw:
    return {}
  try:
    return json.loads(raw)
  except json.JSONDecodeError:
    return {}


def discover_manga() -> List[Dict[str, object]]:
  items: List[Dict[str, object]] = []
  if not MANGA_DIR.exists():
    return items

  for entry in sorted(MANGA_DIR.iterdir(), key=lambda p: p.name.lower()):
    if not entry.is_dir():
      continue

    metadata = load_metadata(entry)
    media = sorted(
      [p for p in entry.iterdir() if p.suffix.lower() in MEDIA_EXTENSIONS],
      key=natural_key,
    )
    if not media:
      continue

    cover_path = metadata.get("cover")
    if cover_path:
      candidate = entry / cover_path
      cover = candidate if candidate.exists() else media[0]
    else:
      cover = media[0]

    updated_at = max((p.stat().st_mtime for p in media), default=entry.stat().st_mtime)

    description = load_description(entry, metadata)
    title = metadata.get("title") or entry.name

    backdrop_value = metadata.get("backdrop")
    backdrop_path = None
    if backdrop_value:
      candidate = entry / backdrop_value
      if not candidate.exists():
        candidate = BASE_DIR / backdrop_value
      if candidate.exists():
        try:
          backdrop_path = "/" + candidate.relative_to(BASE_DIR).as_posix()
        except ValueError:
          backdrop_path = None

    items.append(
      {
        "id": entry.name,
        "title": title,
        "description": description,
        "cover": "/" + cover.relative_to(BASE_DIR).as_posix(),
        "pages": [
          "/" + p.relative_to(BASE_DIR).as_posix()
          for p in media
        ],
        "updatedAt": datetime.fromtimestamp(updated_at).isoformat(),
        "backdrop": backdrop_path,
      }
    )

  return items


class GalleryRequestHandler(SimpleHTTPRequestHandler):
  def __init__(self, *args, **kwargs):
    super().__init__(*args, directory=str(BASE_DIR), **kwargs)

  def do_GET(self):
    if self.path.startswith("/api/gallery"):
      self.handle_gallery_api()
    else:
      super().do_GET()

  def handle_gallery_api(self):
    payload = {"items": discover_manga()}
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    self.send_response(HTTPStatus.OK)
    self.send_header("Content-Type", "application/json; charset=utf-8")
    self.send_header("Cache-Control", "no-store")
    self.send_header("Content-Length", str(len(data)))
    self.end_headers()
    self.wfile.write(data)

  def log_message(self, format, *args):  # noqa: A003 - keep quiet
    # Suppress default verbose logging; uncomment for debugging.
    return


def run(server_address: str = "127.0.0.1", port: int = 8000):
  os.chdir(BASE_DIR)
  with socketserver.TCPServer((server_address, port), GalleryRequestHandler) as httpd:
    print(f"Gallery server running at http://{server_address}:{port}")
    print("按 Ctrl+C 停止服务。")
    try:
      httpd.serve_forever()
    except KeyboardInterrupt:
      print("\n服务已停止。")


if __name__ == "__main__":
  run()
