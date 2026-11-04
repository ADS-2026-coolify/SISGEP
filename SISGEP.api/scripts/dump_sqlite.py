import sqlite3
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)

conn = sqlite3.connect(PROJECT_ROOT / 'db.sqlite3')
cur = conn.cursor()

# Get tables and CREATE SQL
cur.execute("SELECT name, sql FROM sqlite_master WHERE type='table';")
tables = cur.fetchall()

result = {}
for name, sql in tables:
    table_info = {}
    table_info['sql'] = sql
    
    # PRAGMA table_info
    cur.execute(f'PRAGMA table_info("{name}");')
    cols = cur.fetchall()
    table_info['columns'] = [
        {"cid": c[0], "name": c[1], "type": c[2], "notnull": c[3], "dflt_value": c[4], "pk": c[5]}
        for col in cols for c in [col]
    ]
    
    # foreign_key_list
    cur.execute(f'PRAGMA foreign_key_list("{name}");')
    fks = cur.fetchall()
    table_info['foreign_keys'] = [
        {"id": f[0], "seq": f[1], "table": f[2], "from": f[3], "to": f[4], "on_update": f[5], "on_delete": f[6], "match": f[7]}
        for fk in fks for f in [fk]
    ]
    
    # index_list and index_info
    cur.execute(f'PRAGMA index_list("{name}");')
    idx_list = cur.fetchall()
    indexes = []
    for idx in idx_list:
        idx_name = idx[1]
        cur.execute(f'PRAGMA index_info("{idx_name}");')
        idx_info = cur.fetchall()
        indexes.append({
            "seq": idx[0],
            "name": idx_name,
            "unique": idx[2],
            "origin": idx[3],
            "partial": idx[4],
            "columns": [{"seqno": ii[0], "cid": ii[1], "name": ii[2]} for ii in idx_info]
        })
    table_info['indexes'] = indexes
    
    # Row counts
    try:
        cur.execute(f'SELECT COUNT(*) FROM "{name}";')
        table_info['row_count'] = cur.fetchone()[0]
    except Exception as e:
        table_info['row_count'] = f"Error: {e}"
        
    result[name] = table_info

# django_migrations rows
django_migrations = []
try:
    cur.execute("SELECT id, app, name, applied FROM django_migrations;")
    django_migrations = [
        {"id": m[0], "app": m[1], "name": m[2], "applied": m[3]}
        for m in cur.fetchall()
    ]
except Exception as e:
    django_migrations = f"Error: {e}"

output = {
    "tables": result,
    "django_migrations": django_migrations
}

with (ARTIFACTS_DIR / "sqlite_dump.json").open("w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print("SUCCESS")
