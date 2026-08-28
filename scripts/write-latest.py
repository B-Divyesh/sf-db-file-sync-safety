#!/usr/bin/env python3
import json
import pathlib
import sys

tag = sys.argv[1]
directory = pathlib.Path(sys.argv[2])
base = f"https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/{tag}"
files = []
for path in sorted(directory.glob("dbsync-safe-*")):
    if path.is_file():
        files.append({"name": path.name, "url": f"{base}/{path.name}"})
print(json.dumps({"version": tag.removeprefix("v"), "tag": tag, "files": files}, indent=2))

