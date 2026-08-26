#!/usr/bin/python3
"""Tests for automatic development database setup."""

import gc
import tempfile
import unittest
from pathlib import Path

from app import create_app, db
from app.models import Booking, Owner, Place, Review, SystemNotification, User


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
                self.assertEqual(User.query.count(), 5)
                self.assertEqual(Owner.query.count(), 1)
                self.assertEqual(Place.query.count(), 6)
                self.assertEqual(Booking.query.count(), 7)
                self.assertEqual(Review.query.count(), 4)
                self.assertEqual(SystemNotification.query.count(), 18)
                Review.query.filter_by(
                    id="a3000004-0000-4000-8000-000000000004"
                ).delete()
                db.session.commit()
                db.session.remove()
                db.engine.dispose()

            second_app = create_app(SetupConfig)
            with second_app.app_context():
                self.assertEqual(User.query.count(), 5)
                self.assertEqual(Place.query.count(), 6)
                self.assertEqual(Review.query.count(), 3)
                db.session.remove()
                db.engine.dispose()

            del second_app
            del app
            gc.collect()
