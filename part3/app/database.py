#!/usr/bin/python3
"""Initialize the development database and its sample data."""

import sqlite3
from contextlib import closing
from pathlib import Path

from app import db


DEVELOPMENT_SEED_VERSION = 2


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
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS development_seed_versions (
                    version INTEGER PRIMARY KEY,
                    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            applied = connection.execute(
                "SELECT 1 FROM development_seed_versions WHERE version = ?",
                (DEVELOPMENT_SEED_VERSION,)
            ).fetchone()
            if applied is not None:
                return

            connection.executescript(seed_path.read_text(encoding="utf-8"))
            connection.execute(
                "INSERT INTO development_seed_versions (version) VALUES (?)",
                (DEVELOPMENT_SEED_VERSION,)
            )
            connection.commit()
