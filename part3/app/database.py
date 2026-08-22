#!/usr/bin/python3
"""Initialize the development database and its sample data."""

import sqlite3
from contextlib import closing
from pathlib import Path

from app import db


def initialize_database(app):
    """Create mapped tables and load the SQLite development seed."""
    with app.app_context():
        Path(app.instance_path).mkdir(parents=True, exist_ok=True)
        db.create_all()

        if db.engine.dialect.name != "sqlite":
            return

        database_name = db.engine.url.database
        if not database_name or database_name == ":memory:":
            return

        seed_path = Path(app.root_path).parent / "sql_scripts" / "seed.sql"
        if not seed_path.is_file():
            raise RuntimeError(f"Database seed file not found: {seed_path}")

        with closing(sqlite3.connect(database_name)) as connection:
            connection.executescript(seed_path.read_text(encoding="utf-8"))
