#!/usr/bin/env python3
"""Regenerate offline-files.json: every file the iPhone app downloads for offline use.

Run after adding or changing anything in a lesson (pages or audio):
    python3 tools/build-offline.py
The home page compares each file's hash with what it cached and re-downloads only what changed.
"""
import hashlib, json, os, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", ".claude", "tools"}
SKIP_FILES = {"CLAUDE.md", "offline-files.json", "sw.js", ".DS_Store"}

files = {}
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS and not d.startswith("."))
    for name in sorted(filenames):
        if name in SKIP_FILES or name.startswith("."):  # Pages doesn't serve dotfiles
            continue
        full = os.path.join(dirpath, name)
        rel = os.path.relpath(full, ROOT).replace(os.sep, "/")
        # Pages request accented names in NFC (é as one code point); macOS may store them decomposed.
        rel = unicodedata.normalize("NFC", rel)
        # Lesson pages are linked as folders (les-02/), so cache them under that URL.
        if name == "index.html":
            rel = rel[: -len("index.html")] or "./"
        with open(full, "rb") as f:
            files[rel] = hashlib.sha1(f.read()).hexdigest()[:10]

version = hashlib.sha1(json.dumps(files, sort_keys=True).encode()).hexdigest()[:10]
with open(os.path.join(ROOT, "offline-files.json"), "w") as f:
    json.dump({"version": version, "files": files}, f, ensure_ascii=False, separators=(",", ":"))
print(f"offline-files.json: {len(files)} files, version {version}")
