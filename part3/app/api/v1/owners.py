#!/usr/bin/python3
"""Define business owner API endpoints."""

from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.api.v1.extended_helpers import serialize_booking, serialize_owner
from app.services import facade


api = Namespace("owners", description="Business owner operations")

owner_model = api.model("Owner", {
    "business_name": fields.String(required=True),
    "contact_person": fields.String(required=True),
    "email": fields.String(required=True),
    "password": fields.String(required=True),
    "phone_number": fields.String(required=True),
    "commercial_register": fields.String(required=True)
})

owner_update_model = api.model("OwnerUpdate", {
    "business_name": fields.String(),
    "contact_person": fields.String(),
    "email": fields.String(),
    "password": fields.String(),
    "phone_number": fields.String(),
    "commercial_register": fields.String()
})


def _admin_error():
    """Return an authorization response for a non-admin user."""
    if not get_jwt().get("is_admin", False):
        return {"error": "Admin privileges required"}, 403
    return None


def _owner_error():
    """Return an authorization response for a non-owner account."""
    if not get_jwt().get("is_owner", False):
        return {"error": "Owner account required"}, 403
    return None


def _serialize_owner_place(place):
    """Return the place fields needed by the owner dashboard."""
    return {
        "id": place.id,
        "title": place.title,
        "description": place.description,
        "image_url": place.image_url,
        "price": place.price,
        "city_id": place.city.id if place.city else None,
        "number_rooms": place.number_rooms,
        "number_bathrooms": place.number_bathrooms,
        "max_guest": place.max_guest,
        "booking_count": len(place.bookings),
        "review_count": len(place.reviews)
    }


@api.route("/")
class OwnerList(Resource):
    """Handle the business owner collection."""

    @api.expect(owner_model, validate=True)
    @jwt_required()
    def post(self):
        """Create a business owner."""
        error = _admin_error()
        if error:
            return error
        try:
            owner = facade.create_owner(api.payload or {})
        except ValueError as exc:
            return {"error": str(exc)}, 400
        return serialize_owner(owner), 201

    @jwt_required()
    def get(self):
        """Retrieve every business owner."""
        error = _admin_error()
        if error:
            return error
        owners = facade.get_all_extended_resources("owners")
        return [serialize_owner(owner) for owner in owners], 200


@api.route("/me")
class CurrentOwnerResource(Resource):
    """Handle the signed-in business owner profile."""

    @jwt_required()
    def get(self):
        """Retrieve the current owner profile."""
        error = _owner_error()
        if error:
            return error
        owner = facade.get_extended_resource(
            "owners", get_jwt_identity()
        )
        if owner is None:
            return {"error": "Owner not found"}, 404
        return serialize_owner(owner), 200

    @jwt_required()
    def put(self):
        """Update the current owner's public business details."""
        error = _owner_error()
        if error:
            return error
        allowed = {"business_name", "contact_person", "phone_number"}
        data = api.payload or {}
        unknown = set(data) - allowed
        if unknown:
            return {"error": "Unsupported owner field"}, 400
        try:
            owner = facade.update_extended_resource(
                "owners", get_jwt_identity(), data
            )
        except ValueError as exc:
            return {"error": str(exc)}, 400
        return serialize_owner(owner), 200


@api.route("/me/places")
class CurrentOwnerPlaces(Resource):
    """List places managed by the signed-in business owner."""

    @jwt_required()
    def get(self):
        """Retrieve the current owner's properties."""
        error = _owner_error()
        if error:
            return error
        owner_id = get_jwt_identity()
        places = [
            place for place in facade.get_all_places()
            if place.business_owner is not None
            and place.business_owner.id == owner_id
        ]
        return [_serialize_owner_place(place) for place in places], 200


@api.route("/me/bookings")
class CurrentOwnerBookings(Resource):
    """List reservations for the signed-in owner's properties."""

    @jwt_required()
    def get(self):
        """Retrieve bookings received by the current owner."""
        error = _owner_error()
        if error:
            return error
        owner_id = get_jwt_identity()
        bookings = [
            booking
            for booking in facade.get_all_extended_resources("bookings")
            if booking.place.business_owner is not None
            and booking.place.business_owner.id == owner_id
        ]
        return [serialize_booking(booking) for booking in bookings], 200


@api.route("/<owner_id>")
class OwnerResource(Resource):
    """Handle one business owner."""

    @jwt_required()
    def get(self, owner_id):
        """Retrieve a business owner."""
        error = _admin_error()
        if error:
            return error
        owner = facade.get_extended_resource("owners", owner_id)
        if owner is None:
            return {"error": "Owner not found"}, 404
        return serialize_owner(owner), 200

    @api.expect(owner_update_model, validate=True)
    @jwt_required()
    def put(self, owner_id):
        """Update a business owner."""
        error = _admin_error()
        if error:
            return error
        try:
            owner = facade.update_extended_resource(
                "owners", owner_id, api.payload or {}
            )
        except ValueError as exc:
            return {"error": str(exc)}, 400
        if owner is None:
            return {"error": "Owner not found"}, 404
        return serialize_owner(owner), 200

    @jwt_required()
    def delete(self, owner_id):
        """Delete a business owner and its managed properties."""
        error = _admin_error()
        if error:
            return error
        if not facade.delete_owner(owner_id):
            return {"error": "Owner not found"}, 404
        return {"message": "Owner deleted successfully"}, 200
