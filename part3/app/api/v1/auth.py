#!/usr/bin/python3
"""Define authentication API endpoints."""

from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required
)
from flask_restx import Namespace, Resource, fields

from app.services import facade


api = Namespace("auth", description="Authentication operations")

login_model = api.model("Login", {
    "email": fields.String(required=True, description="User email"),
    "password": fields.String(required=True, description="User password"),
    "account_type": fields.String(
        enum=["guest", "owner"],
        description="Account type selected by the web client"
    )
})

register_model = api.model("Register", {
    "first_name": fields.String(required=True, description="First name"),
    "last_name": fields.String(required=True, description="Last name"),
    "email": fields.String(required=True, description="Email address"),
    "password": fields.String(required=True, description="Password")
})

owner_register_model = api.model("OwnerRegister", {
    "business_name": fields.String(required=True),
    "contact_person": fields.String(required=True),
    "email": fields.String(required=True),
    "password": fields.String(required=True),
    "phone_number": fields.String(required=True),
    "commercial_register": fields.String(required=True)
})

password_model = api.model("PasswordChange", {
    "current_password": fields.String(required=True),
    "new_password": fields.String(required=True)
})


def create_user_token(user):
    """Create a JWT containing the user's role."""
    role = "admin" if user.is_admin else "user"
    return create_access_token(
        identity=str(user.id),
        additional_claims={
            "is_admin": user.is_admin,
            "is_owner": False,
            "role": role
        }
    )


def create_owner_token(owner):
    """Create a JWT for a business owner account."""
    return create_access_token(
        identity=str(owner.id),
        additional_claims={
            "is_admin": False,
            "is_owner": True,
            "role": "owner"
        }
    )


@api.route("/login")
class Login(Resource):
    """Authenticate a user and issue an access token."""

    @api.expect(login_model, validate=True)
    @api.response(200, "Login successful")
    @api.response(401, "Invalid credentials")
    def post(self):
        """Return a JWT token when the credentials are valid."""
        credentials = api.payload or {}
        account_type = credentials.get("account_type")
        user = None
        owner = None

        if account_type != "owner":
            user = facade.get_user_by_email(credentials.get("email"))

        if user and user.verify_password(credentials.get("password")):
            access_token = create_user_token(user)
            role = "admin" if user.is_admin else "user"
            return {"access_token": access_token, "role": role}, 200

        if account_type != "guest":
            owner = facade.get_owner_by_email(credentials.get("email"))
        if owner and owner.verify_password(credentials.get("password")):
            return {
                "access_token": create_owner_token(owner),
                "role": "owner"
            }, 200

        return {"error": "Invalid credentials"}, 401


@api.route("/register")
class Register(Resource):
    """Create a regular user account from the web client."""

    @api.expect(register_model, validate=True)
    @api.response(201, "User registered successfully")
    @api.response(400, "Invalid input data")
    def post(self):
        """Register a non-administrator and return a JWT."""
        data = (api.payload or {}).copy()
        data["is_admin"] = False

        if facade.get_owner_by_email(data.get("email")):
            return {"error": "Email already registered"}, 400

        try:
            user = facade.create_user(data)
        except ValueError as exc:
            return {"error": str(exc)}, 400

        return {
            "id": user.id,
            "message": "User registered successfully",
            "access_token": create_user_token(user)
        }, 201


@api.route("/register-owner")
class RegisterOwner(Resource):
    """Create a business-owner account from the web client."""

    @api.expect(owner_register_model, validate=True)
    @api.response(201, "Owner registered successfully")
    @api.response(400, "Invalid input data")
    def post(self):
        """Register an owner without granting administrator privileges."""
        data = (api.payload or {}).copy()
        if facade.get_user_by_email(data.get("email")):
            return {"error": "Email already registered"}, 400

        try:
            owner = facade.create_owner(data)
        except ValueError as exc:
            return {"error": str(exc)}, 400

        return {
            "id": owner.id,
            "message": "Owner registered successfully"
        }, 201


@api.route("/change-password")
class ChangePassword(Resource):
    """Change the signed-in account password securely."""

    @api.expect(password_model, validate=True)
    @jwt_required()
    @api.response(200, "Password changed successfully")
    @api.response(401, "Current password is incorrect")
    def put(self):
        """Verify the current password before storing a new hash."""
        data = api.payload or {}
        if get_jwt().get("is_owner", False):
            account = facade.get_extended_resource(
                "owners", get_jwt_identity()
            )
        else:
            account = facade.get_user(get_jwt_identity())
        if account is None:
            return {"error": "Account not found"}, 404
        if not account.verify_password(data.get("current_password")):
            return {"error": "Current password is incorrect"}, 401
        try:
            account.hash_password(data.get("new_password"))
            account.save()
        except ValueError as exc:
            return {"error": str(exc)}, 400
        return {"message": "Password changed successfully"}, 200
