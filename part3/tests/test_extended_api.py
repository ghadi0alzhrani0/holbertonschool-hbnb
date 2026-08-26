#!/usr/bin/python3
"""Integration tests for authenticated extended HBnB endpoints."""

import unittest

from app import create_app, db
from app.services import facade


class TestConfig:
    """Use an isolated SQLite database."""

    TESTING = True
    SECRET_KEY = "test-secret"
    JWT_SECRET_KEY = "test-jwt-secret-with-at-least-32-characters"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class TestExtendedAPI(unittest.TestCase):
    """Validate persistence and authorization for extended entities."""

    def setUp(self):
        """Create a clean database and users for each access level."""
        self.app = create_app(TestConfig)
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.client = self.app.test_client()

        facade.create_user({
            "first_name": "Admin",
            "last_name": "User",
            "email": "admin@example.com",
            "password": "adminpass",
            "is_admin": True
        })
        facade.create_user({
            "first_name": "Host",
            "last_name": "User",
            "email": "host@example.com",
            "password": "hostpass"
        })
        self.guest = facade.create_user({
            "first_name": "Guest",
            "last_name": "User",
            "email": "guest@example.com",
            "password": "guestpass"
        })
        self.admin_headers = self.login("admin@example.com", "adminpass")
        self.host_headers = self.login("host@example.com", "hostpass")
        self.guest_headers = self.login("guest@example.com", "guestpass")

    def tearDown(self):
        """Remove test records and the application context."""
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def login(self, email, password):
        """Return an Authorization header for a user."""
        response = self.client.post("/api/v1/auth/login", json={
            "email": email,
            "password": password
        })
        self.assertEqual(response.status_code, 200)
        token = response.get_json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    def post(self, path, data, headers):
        """Post JSON and return a successful creation response."""
        response = self.client.post(path, json=data, headers=headers)
        self.assertEqual(response.status_code, 201, response.get_json())
        return response.get_json()

    def complete_booking(self, booking_id, headers=None):
        """Move a booking through every supported state to completed."""
        headers = headers or self.admin_headers
        for status in ("confirmed", "checked_in", "completed"):
            response = self.client.put(
                f"/api/v1/bookings/{booking_id}",
                json={"status": status},
                headers=headers
            )
            self.assertEqual(response.status_code, 200, response.get_json())
        return response.get_json()

    def test_owner_login_dashboard_and_notifications(self):
        """An owner sees property bookings and receives live-feed records."""
        owner = facade.create_owner({
            "business_name": "Najd Stay",
            "contact_person": "Noura",
            "email": "owner@example.com",
            "password": "ownerpass",
            "phone_number": "0500000000",
            "commercial_register": "CR-OWNER"
        })
        host = facade.get_user_by_email("host@example.com")
        place = facade.create_place({
            "title": "Owner Hotel",
            "description": "A managed property",
            "price": 200,
            "latitude": 24.7,
            "longitude": 46.7,
            "owner_id": host.id,
            "business_owner_id": owner.id
        })
        owner_headers = self.login("owner@example.com", "ownerpass")

        profile = self.client.get(
            "/api/v1/owners/me", headers=owner_headers
        )
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.get_json()["business_name"], "Najd Stay")

        booking = self.post("/api/v1/bookings/", {
            "place_id": place.id,
            "start_date": "2026-10-02",
            "end_date": "2026-10-04"
        }, self.guest_headers)

        bookings = self.client.get(
            "/api/v1/owners/me/bookings", headers=owner_headers
        )
        self.assertEqual(bookings.status_code, 200)
        self.assertEqual(bookings.get_json()[0]["id"], booking["id"])

        notifications = self.client.get(
            "/api/v1/notifications/", headers=owner_headers
        )
        self.assertEqual(notifications.status_code, 200)
        self.assertEqual(
            notifications.get_json()[0]["notification_type"],
            "new_booking"
        )

        guest_confirmation = self.client.put(
            f"/api/v1/bookings/{booking['id']}",
            json={"status": "confirmed"},
            headers=self.guest_headers
        )
        self.assertEqual(guest_confirmation.status_code, 403)

        confirmed = self.client.put(
            f"/api/v1/bookings/{booking['id']}",
            json={"status": "confirmed"},
            headers=owner_headers
        )
        self.assertEqual(confirmed.status_code, 200)
        self.assertEqual(confirmed.get_json()["status"], "confirmed")

    def test_private_notifications_and_admin_review_moderation(self):
        """Each account sees its feed and admins can remove a review."""
        other_guest = facade.create_user({
            "first_name": "Other",
            "last_name": "Guest",
            "email": "other@example.com",
            "password": "otherpass"
        })
        facade.create_notification({
            "notification_type": "guest_update",
            "content": "Only the first guest should see this.",
            "user_id": self.guest.id
        })
        facade.create_notification({
            "notification_type": "other_update",
            "content": "Only the other guest should see this.",
            "user_id": other_guest.id
        })
        admin = facade.get_user_by_email("admin@example.com")
        facade.create_notification({
            "notification_type": "admin_update",
            "content": "Only the administrator should see this.",
            "user_id": admin.id
        })

        guest_feed = self.client.get(
            "/api/v1/notifications/", headers=self.guest_headers
        ).get_json()
        self.assertEqual({item["user_id"] for item in guest_feed}, {
            self.guest.id
        })
        admin_feed = self.client.get(
            "/api/v1/notifications/", headers=self.admin_headers
        ).get_json()
        self.assertEqual({item["user_id"] for item in admin_feed}, {
            admin.id
        })

        host = facade.get_user_by_email("host@example.com")
        place = facade.create_place({
            "title": "Moderated Hotel",
            "description": "A place used to test review moderation",
            "price": 300,
            "latitude": 24.7,
            "longitude": 46.7,
            "owner_id": host.id
        })
        booking = self.post("/api/v1/bookings/", {
            "place_id": place.id,
            "start_date": "2026-11-02",
            "end_date": "2026-11-04"
        }, self.guest_headers)
        self.complete_booking(booking["id"])
        review = self.post("/api/v1/reviews/", {
            "text": "Review awaiting moderation",
            "rating": 4,
            "place_id": place.id
        }, self.guest_headers)

        response = self.client.delete(
            f"/api/v1/reviews/{review['id']}",
            headers=self.admin_headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            self.client.get(f"/api/v1/reviews/{review['id']}").status_code,
            404
        )
        guest_feed = self.client.get(
            "/api/v1/notifications/", headers=self.guest_headers
        ).get_json()
        self.assertTrue(any(
            item["notification_type"] == "review_moderation"
            for item in guest_feed
        ))

    def test_extended_entities_persist_with_authorization(self):
        """Create and connect all extended entities through protected APIs."""
        owner = self.post("/api/v1/owners/", {
            "business_name": "Stay Co",
            "contact_person": "Mona",
            "email": "owner@example.com",
            "password": "secret",
            "phone_number": "0500000000",
            "commercial_register": "CR-1"
        }, self.admin_headers)
        owner_headers = self.login("owner@example.com", "secret")
        country = self.post("/api/v1/countries/", {
            "name": "Saudi Arabia",
            "code": "SA"
        }, self.admin_headers)
        state = self.post("/api/v1/states/", {
            "name": "Riyadh",
            "country_id": country["id"]
        }, self.admin_headers)
        city = self.post("/api/v1/cities/", {
            "name": "Riyadh",
            "state_id": state["id"]
        }, self.admin_headers)
        place_type = self.post("/api/v1/place-types/", {
            "name": "Apartment"
        }, self.admin_headers)
        policy = self.post("/api/v1/cancellation-policies/", {
            "name": "Flexible",
            "description": "Full refund before seven days"
        }, self.admin_headers)
        category = self.post("/api/v1/amenity-categories/", {
            "name": "Essentials"
        }, self.admin_headers)
        amenity = self.post("/api/v1/amenities/", {
            "name": "WiFi",
            "description": "Fast internet",
            "category_id": category["id"]
        }, self.admin_headers)
        place = self.post("/api/v1/places/", {
            "title": "City Home",
            "description": "Central",
            "price": 100,
            "latitude": 24.7,
            "longitude": 46.7,
            "amenities": [amenity["id"]],
            "city_id": city["id"],
            "place_type_id": place_type["id"],
            "cancellation_policy_id": policy["id"],
            "business_owner_id": owner["id"],
            "number_rooms": 2,
            "number_bathrooms": 1,
            "max_guest": 4
        }, owner_headers)
        room = self.post("/api/v1/room-details/", {
            "place_id": place["id"],
            "room_name": "Main room",
            "bed_type": "Queen",
            "beds_count": 1
        }, owner_headers)
        availability = self.post("/api/v1/place-availability/", {
            "place_id": place["id"],
            "start_date": "2026-09-01",
            "end_date": "2026-09-30"
        }, owner_headers)
        pricing = self.post("/api/v1/seasonal-pricing/", {
            "place_id": place["id"],
            "start_date": "2026-09-10",
            "end_date": "2026-09-15",
            "special_price": 150
        }, owner_headers)
        booking = self.post("/api/v1/bookings/", {
            "place_id": place["id"],
            "start_date": "2026-09-02",
            "end_date": "2026-09-04"
        }, self.guest_headers)
        self.assertEqual(booking["user_id"], self.guest.id)
        self.post("/api/v1/booking-guests/", {
            "booking_id": booking["id"],
            "adults_count": 2
        }, self.guest_headers)
        self.complete_booking(booking["id"])
        review = self.post("/api/v1/reviews/", {
            "text": "Great",
            "rating": 5,
            "place_id": place["id"]
        }, self.guest_headers)
        self.post("/api/v1/review-ratings/", {
            "review_id": review["id"],
            "cleanliness": 5,
            "accuracy": 5,
            "communication": 4,
            "location": 5,
            "check_in": 4,
            "value": 5
        }, self.guest_headers)
        self.post("/api/v1/review-responses/", {
            "review_id": review["id"],
            "owner_id": owner["id"],
            "response_text": "Thank you"
        }, owner_headers)
        self.post("/api/v1/guest-reviews/", {
            "booking_id": booking["id"],
            "owner_id": owner["id"],
            "guest_id": self.guest.id,
            "cleanliness_rating": 5,
            "communication_rating": 5,
            "respect_rules_rating": 5,
            "review_text": "Excellent guest"
        }, owner_headers)
        notification = self.post("/api/v1/notifications/", {
            "notification_type": "booking",
            "content": "Booking created",
            "user_id": self.guest.id
        }, self.admin_headers)

        response = self.client.get(
            f"/api/v1/bookings/{booking['id']}",
            headers=self.admin_headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "completed")

        response = self.client.put(
            f"/api/v1/notifications/{notification['id']}/read",
            headers=self.guest_headers
        )
        self.assertTrue(response.get_json()["is_seen"])

        response = self.client.put(
            f"/api/v1/room-details/{room['id']}",
            json={"beds_count": 2},
            headers=self.guest_headers
        )
        self.assertEqual(response.status_code, 403)

        details = self.client.get(
            f"/api/v1/places/{place['id']}"
        ).get_json()
        self.assertIn(room["id"], details["room_detail_ids"])
        self.assertIn(availability["id"], details["availability_ids"])
        self.assertIn(pricing["id"], details["seasonal_pricing_ids"])

    def test_booking_guest_capacity_is_enforced(self):
        """Reject guest totals above a property's maximum capacity."""
        host = facade.get_user_by_email("host@example.com")
        place = facade.create_place({
            "title": "Three Guest Home",
            "description": "Capacity test property",
            "price": 250,
            "latitude": 24.7,
            "longitude": 46.7,
            "owner_id": host.id,
            "max_guest": 3
        })
        booking = self.post("/api/v1/bookings/", {
            "place_id": place.id,
            "start_date": "2026-12-02",
            "end_date": "2026-12-05"
        }, self.guest_headers)

        too_many = self.client.post(
            "/api/v1/booking-guests/",
            json={
                "booking_id": booking["id"],
                "adults_count": 2,
                "children_count": 2
            },
            headers=self.guest_headers
        )
        self.assertEqual(too_many.status_code, 400)

        details = self.post("/api/v1/booking-guests/", {
            "booking_id": booking["id"],
            "adults_count": 2,
            "children_count": 1
        }, self.guest_headers)
        invalid_update = self.client.put(
            f"/api/v1/booking-guests/{details['id']}",
            json={"children_count": 2},
            headers=self.guest_headers
        )
        self.assertEqual(invalid_update.status_code, 400)

    def test_place_reviews_require_completed_guest_stay(self):
        """Only a guest with a completed stay may review a place once."""
        owner = facade.create_owner({
            "business_name": "Review Stay",
            "contact_person": "Owner",
            "email": "review-owner@example.com",
            "password": "ownerpass",
            "phone_number": "0500000001",
            "commercial_register": "CR-REVIEW"
        })
        host = facade.get_user_by_email("host@example.com")
        place = facade.create_place({
            "title": "Completed Stay Hotel",
            "description": "Review eligibility property",
            "price": 300,
            "latitude": 24.7,
            "longitude": 46.7,
            "owner_id": host.id,
            "business_owner_id": owner.id
        })
        owner_headers = self.login("review-owner@example.com", "ownerpass")
        payload = {
            "text": "A completed stay review",
            "rating": 5,
            "place_id": place.id
        }

        self.assertEqual(self.client.post(
            "/api/v1/reviews/", json=payload, headers=self.admin_headers
        ).status_code, 403)
        self.assertEqual(self.client.post(
            "/api/v1/reviews/", json=payload, headers=owner_headers
        ).status_code, 403)
        self.assertEqual(self.client.post(
            "/api/v1/reviews/", json=payload, headers=self.guest_headers
        ).status_code, 400)

        booking = self.post("/api/v1/bookings/", {
            "place_id": place.id,
            "start_date": "2027-01-02",
            "end_date": "2027-01-05"
        }, self.guest_headers)
        self.complete_booking(booking["id"])
        review = self.post(
            "/api/v1/reviews/", payload, self.guest_headers
        )
        self.assertEqual(self.client.post(
            "/api/v1/reviews/", json=payload, headers=self.guest_headers
        ).status_code, 400)
        self.assertEqual(self.client.put(
            f"/api/v1/reviews/{review['id']}",
            json={"text": "Admin edit"},
            headers=self.admin_headers
        ).status_code, 403)

    def test_admin_can_delete_guest_and_owner_accounts(self):
        """Admins may remove accounts but not protected users."""
        guest = facade.create_user({
            "first_name": "Delete",
            "last_name": "Guest",
            "email": "delete-guest@example.com",
            "password": "guestpass"
        })
        owner = facade.create_owner({
            "business_name": "Delete Owner",
            "contact_person": "Owner",
            "email": "delete-owner@example.com",
            "password": "ownerpass",
            "phone_number": "0500000002",
            "commercial_register": "CR-DELETE"
        })
        host = facade.get_user_by_email("host@example.com")
        place = facade.create_place({
            "title": "Property Removed With Owner",
            "description": "Deletion test property",
            "price": 300,
            "latitude": 24.7,
            "longitude": 46.7,
            "owner_id": host.id,
            "business_owner_id": owner.id
        })

        forbidden = self.client.delete(
            f"/api/v1/users/{guest.id}", headers=self.guest_headers
        )
        self.assertEqual(forbidden.status_code, 403)
        self.assertEqual(self.client.delete(
            f"/api/v1/users/{guest.id}", headers=self.admin_headers
        ).status_code, 200)
        self.assertIsNone(facade.get_user(guest.id))
        admin = facade.get_user_by_email("admin@example.com")
        self.assertEqual(self.client.delete(
            f"/api/v1/users/{admin.id}", headers=self.admin_headers
        ).status_code, 400)
        self.assertEqual(self.client.delete(
            f"/api/v1/users/{host.id}", headers=self.admin_headers
        ).status_code, 400)
        self.assertEqual(self.client.delete(
            f"/api/v1/owners/{owner.id}", headers=self.admin_headers
        ).status_code, 200)
        self.assertIsNone(facade.get_extended_resource("owners", owner.id))
        self.assertIsNone(facade.get_place(place.id))

    def test_reference_writes_require_admin(self):
        """Block regular users from changing reference data."""
        response = self.client.post(
            "/api/v1/countries/",
            json={"name": "Saudi Arabia", "code": "SA"},
            headers=self.host_headers
        )
        self.assertEqual(response.status_code, 403)

    def test_swagger_lists_extended_routes(self):
        """Document every extended resource in Swagger."""
        paths = self.client.get("/swagger.json").get_json()["paths"]
        expected = {
            "/api/v1/owners/",
            "/api/v1/countries/",
            "/api/v1/states/",
            "/api/v1/cities/",
            "/api/v1/place-types/",
            "/api/v1/cancellation-policies/",
            "/api/v1/amenity-categories/",
            "/api/v1/room-details/",
            "/api/v1/place-availability/",
            "/api/v1/seasonal-pricing/",
            "/api/v1/bookings/",
            "/api/v1/booking-guests/",
            "/api/v1/booking-history/",
            "/api/v1/review-ratings/",
            "/api/v1/review-responses/",
            "/api/v1/guest-reviews/",
            "/api/v1/notifications/"
        }
        self.assertTrue(expected.issubset(paths))


if __name__ == "__main__":
    unittest.main()
