import json
from pathlib import Path

dump_path = Path(__file__).resolve().parent.parent / "artifacts" / "sqlite_dump.json"
with dump_path.open("r", encoding="utf-8") as f:
    data = json.load(f)
print("Keys of tables in dump:", list(data["tables"].keys()))
