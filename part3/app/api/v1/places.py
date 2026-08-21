#!/usr/bin/python3
"""Define place API endpoints."""

from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.services import facade


api = Namespace("places", description="Place operations")

amenity_model = api.model("PlaceAmenity", {
    "id": fields.String(description="Amenity ID"),
    "name": fields.String(description="Name of the amenity")
})

user_model = api.model("PlaceUser", {
    "id": fields.String(description="User ID"),
    "first_name": fields.String(description="First name of the owner"),
    "last_name": fields.String(description="Last name of the owner"),
    "email": fields.String(description="Email of the owner")
})

review_model = api.model("PlaceReview", {
    "id": fields.String(description="Review ID"),
    "text": fields.String(description="Text of the review"),
    "rating": fields.Integer(description="Rating of the place"),
    "user_id": fields.String(description="ID of the user")
})

place_model = api.model("Place", {
    "title": fields.String(required=True, description="Title of the place"),
    "description": fields.String(description="Description of the place"),
    "price": fields.Float(required=True, description="Price per night"),
    "latitude": fields.Float(required=True, description="Latitude"),
    "longitude": fields.Float(required=True, description="Longitude"),
    "city_id": fields.String(description="ID of the city"),
    "place_type_id": fields.String(description="ID of the place type"),
    "cancellation_policy_id": fields.String(
        description="ID of the cancellation policy"
    ),
    "business_owner_id": fields.String(
        description="ID of the business owner"
    ),
    "number_rooms": fields.Integer(description="Number of rooms"),
    "number_bathrooms": fields.Integer(description="Number of bathrooms"),
    "max_guest": fields.Integer(description="Maximum number of guests"),
    "amenities": fields.List(
        fields.String,
        required=False,
        description="List of amenity IDs"
    )
})

place_update_model = api.model("PlaceUpdate", {
    "title": fields.String(description="Title of the place"),
    "description": fields.String(description="Description of the place"),
    "price": fields.Float(description="Price per night"),
    "latitude": fields.Float(description="Latitude"),
    "longitude": fields.Float(description="Longitude"),
    "city_id": fields.String(description="ID of the city"),
    "place_type_id": fields.String(description="ID of the place type"),
    "cancellation_policy_id": fields.String(
        description="ID of the cancellation policy"
    ),
    "business_owner_id": fields.String(
        description="ID of the business owner"
    ),
    "number_rooms": fields.Integer(description="Number of rooms"),
    "number_bathrooms": fields.Integer(description="Number of bathrooms"),
    "max_guest": fields.Integer(description="Maximum number of guests"),
    "amenities": fields.List(
        fields.String,
        required=False,
        description="List of amenity IDs"
    )
})


def serialize_owner(owner):
    """Return a JSON-ready owner dictionary."""
    return {
        "id": owner.id,
        "first_name": owner.first_name,
        "last_name": owner.last_name,
        "email": owner.email
    }


def serialize_amenity(amenity):
    """Return a JSON-ready amenity dictionary."""
    return {
        "id": amenity.id,
        "name": amenity.name
    }


def serialize_review_summary(review):
    """Return a JSON-ready review summary."""
    return {
        "id": review.id,
        "text": review.text,
        "rating": review.rating,
        "user_id": review.user.id
    }


def serialize_place_creation(place):
    """Return the place creation response."""
    return {
        "id": place.id,
        "title": place.title,
        "description": place.description,
        "price": place.price,
        "latitude": place.latitude,
        "longitude": place.longitude,
        "owner_id": place.owner.id,
        "city_id": place.city.id if place.city else None,
        "place_type_id": place.place_type.id if place.place_type else None,
        "cancellation_policy_id": (
            place.cancellation_policy.id
            if place.cancellation_policy else None
        ),
        "business_owner_id": (
            place.business_owner.id if place.business_owner else None
        ),
        "number_rooms": place.number_rooms,
        "number_bathrooms": place.number_bathrooms,
        "max_guest": place.max_guest,
        "amenities": [amenity.id for amenity in place.amenities],
        "created_at": place.created_at.isoformat(),
        "updated_at": place.updated_at.isoformat()
    }


def serialize_place_summary(place):
    """Return the place list response."""
    return {
        "id": place.id,
        "title": place.title,
        "description": place.description,
        "price": place.price,
        "latitude": place.latitude,
        "longitude": place.longitude,
        "city_id": place.city.id if place.city else None,
        "place_type_id": place.place_type.id if place.place_type else None,
        "cancellation_policy_id": (
            place.cancellation_policy.id
            if place.cancellation_policy else None
        ),
        "business_owner_id": (
            place.business_owner.id if place.business_owner else None
        ),
        "number_rooms": place.number_rooms,
        "number_bathrooms": place.number_bathrooms,
        "max_guest": place.max_guest,
        "amenities": [
            serialize_amenity(amenity) for amenity in place.amenities
        ]
    }


def serialize_place_details(place):
    """Return full place details."""
    return {
        "id": place.id,
        "title": place.title,
        "description": place.description,
        "price": place.price,
        "latitude": place.latitude,
        "longitude": place.longitude,
        "owner": serialize_owner(place.owner),
        "city_id": place.city.id if place.city else None,
        "place_type_id": place.place_type.id if place.place_type else None,
        "cancellation_policy_id": (
            place.cancellation_policy.id
            if place.cancellation_policy else None
        ),
        "business_owner_id": (
            place.business_owner.id if place.business_owner else None
        ),
        "number_rooms": place.number_rooms,
        "number_bathrooms": place.number_bathrooms,
        "max_guest": place.max_guest,
        "room_detail_ids": [item.id for item in place.room_details],
        "availability_ids": [
            item.id for item in place.availability_periods
        ],
        "seasonal_pricing_ids": [
            item.id for item in place.seasonal_pricing
        ],
        "booking_ids": [item.id for item in place.bookings],
        "amenities": [
            serialize_amenity(amenity)
            for amenity in place.amenities
        ],
        "reviews": [
            serialize_review_summary(review)
            for review in place.reviews
        ],
        "created_at": place.created_at.isoformat(),
        "updated_at": place.updated_at.isoformat()
    }


@api.route("/")
class PlaceList(Resource):
    """Handle operations for the place collection."""

    @jwt_required()
    @api.expect(place_model, validate=True)
    @api.response(201, "Place successfully created")
    @api.response(400, "Invalid input data")
    def post(self):
        """Register a new place."""
        claims = get_jwt()
        data = (api.payload or {}).copy()
        identity = get_jwt_identity()

        if claims.get("is_owner", False):
            administrators = [
                user for user in facade.get_all_users() if user.is_admin
            ]
            if not administrators:
                return {
                    "error": "An administrator account is required"
                }, 503
            data["owner_id"] = administrators[0].id
            data["business_owner_id"] = identity
        else:
            data["owner_id"] = identity
            if not claims.get("is_admin", False):
                data.pop("business_owner_id", None)

        try:
            place = facade.create_place(data)
        except ValueError as exc:
            return {"error": str(exc)}, 400

        return serialize_place_creation(place), 201

    @api.response(200, "List of places retrieved successfully")
    def get(self):
        """Retrieve all places."""
        places = facade.get_all_places()
        return [serialize_place_summary(place) for place in places], 200


@api.route("/<place_id>")
class PlaceResource(Resource):
    """Handle operations for a single place."""

    @api.response(200, "Place details retrieved successfully")
    @api.response(404, "Place not found")
    def get(self, place_id):
        """Retrieve place details by ID."""
        place = facade.get_place(place_id)
        if not place:
            return {"error": "Place not found"}, 404

        return serialize_place_details(place), 200

    @jwt_required()
    @api.expect(place_update_model, validate=True)
    @api.response(200, "Place updated successfully")
    @api.response(404, "Place not found")
    @api.response(400, "Invalid input data")
    @api.response(403, "Unauthorized action")
    def put(self, place_id):
        """Update place details."""
        place = facade.get_place(place_id)
        if not place:
            return {"error": "Place not found"}, 404
        claims = get_jwt()
        identity = get_jwt_identity()
        is_business_owner = (
            claims.get("is_owner", False)
            and place.business_owner is not None
            and place.business_owner.id == identity
        )
        if (
            not claims.get("is_admin", False)
            and not is_business_owner
            and place.owner.id != identity
        ):
            return {"error": "Unauthorized action"}, 403

        try:
            place = facade.update_place(place_id, api.payload or {})
        except ValueError as exc:
            return {"error": str(exc)}, 400

        return serialize_place_details(place), 200

    @jwt_required()
    @api.response(200, "Place deleted successfully")
    @api.response(404, "Place not found")
    @api.response(403, "Unauthorized action")
    def delete(self, place_id):
        """Delete a place as its owner or an administrator."""
        place = facade.get_place(place_id)
        if not place:
            return {"error": "Place not found"}, 404

        claims = get_jwt()
        identity = get_jwt_identity()
        is_business_owner = (
            claims.get("is_owner", False)
            and place.business_owner is not None
            and place.business_owner.id == identity
        )
        if (
            not claims.get("is_admin", False)
            and not is_business_owner
            and place.owner.id != identity
        ):
            return {"error": "Unauthorized action"}, 403

        facade.delete_place(place_id)
        return {"message": "Place deleted successfully"}, 200


@api.route("/<place_id>/reviews")
class PlaceReviewList(Resource):
    """Handle review lookup for a single place."""

    @api.response(200, "List of reviews for the place retrieved successfully")
    @api.response(404, "Place not found")
    def get(self, place_id):
        """Retrieve all reviews for a specific place."""
        reviews = facade.get_reviews_by_place(place_id)
        if reviews is None:
            return {"error": "Place not found"}, 404

        return [serialize_review_summary(review) for review in reviews], 200
