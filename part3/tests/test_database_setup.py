#!/usr/bin/python3
"""Tests for automatic development database setup."""

import gc
import tempfile
import unittest
from pathlib import Path

from app import create_app, db
from app.models import Owner, Place, SystemNotification, User


class TestAutomaticDatabaseSetup(unittest.TestCase):
    """Validate first-run table creation and sample data loading."""

    def test_new_database_is_created_seeded_and_reusable(self):
        """A clean checkout receives complete data without manual SQL."""
        with tempfile.TemporaryDirectory() as directory:
            database_path = Path(directory) / "development.db"

            class SetupConfig:
                TESTING = True
                SECRET_KEY = "setup-test-secret"
                JWT_SECRET_KEY = "setup-test-jwt-secret-key"
                SQLALCHEMY_DATABASE_URI = f"sqlite:///{database_path}"
                SQLALCHEMY_TRACK_MODIFICATIONS = False
                AUTO_SETUP_DATABASE = True

            app = create_app(SetupConfig)
            with app.app_context():
                self.assertEqual(User.query.count(), 3)
                self.assertEqual(Owner.query.count(), 1)
                self.assertEqual(Place.query.count(), 6)
                self.assertEqual(SystemNotification.query.count(), 7)
                db.session.remove()
                db.engine.dispose()

            second_app = create_app(SetupConfig)
            with second_app.app_context():
                self.assertEqual(User.query.count(), 3)
                self.assertEqual(Place.query.count(), 6)
                db.session.remove()
                db.engine.dispose()

            del second_app
            del app
            gc.collect()
