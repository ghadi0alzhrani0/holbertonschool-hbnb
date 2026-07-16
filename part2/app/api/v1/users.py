#!/usr/bin/python3
"""Define user API endpoints."""

from flask_restx import Namespace, Resource, fields

from app.services import facade


api = Namespace("users", description="User operations")

user_model = api.model("User", {
    "first_name": fields.String(required=True, description="First name"),
    "last_name": fields.String(required=True, description="Last name"),
    "email": fields.String(required=True, description="Email address")
})


def serialize_user(user):
    """Return a JSON-ready user dictionary."""
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email
    }


@api.route("/")
class UserList(Resource):
    """Handle operations for the user collection."""

    @api.expect(user_model, validate=True)
    @api.response(201, "User successfully created")
    @api.response(400, "Invalid input data")
    def post(self):
        """Register a new user."""
        try:
            new_user = facade.create_user(api.payload or {})
        except ValueError as exc:
            return {"error": str(exc)}, 400

        return serialize_user(new_user), 201

    @api.response(200, "List of users retrieved successfully")
    def get(self):
        """Retrieve all users."""
        return [serialize_user(user) for user in facade.get_all_users()], 200


@api.route("/<user_id>")
class UserResource(Resource):
    """Handle operations for a single user."""

    @api.response(200, "User details retrieved successfully")
    @api.response(404, "User not found")
    def get(self, user_id):
        """Retrieve user details by ID."""
        user = facade.get_user(user_id)
        if not user:
            return {"error": "User not found"}, 404

        return serialize_user(user), 200

    @api.expect(user_model, validate=True)
    @api.response(200, "User updated successfully")
    @api.response(404, "User not found")
    @api.response(400, "Invalid input data")
    def put(self, user_id):
        """Update user details."""
        try:
            user = facade.update_user(user_id, api.payload or {})
        except ValueError as exc:
            return {"error": str(exc)}, 400

        if not user:
            return {"error": "User not found"}, 404

        return serialize_user(user), 200
