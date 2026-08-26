# HBnB Part 3 - Authentication and Database

## Description

This directory extends the HBnB business logic and REST API created in
Part 2. It adds password hashing, JWT authentication, role-based access
control, and persistent SQLite storage with SQLAlchemy.

The project keeps the same layered architecture:

- Presentation layer: Flask-RESTX API endpoints.
- Business Logic layer: User, Place, Review, and Amenity models.
- Service layer: HBnB Facade.
- Persistence layer: repository classes backed by SQLAlchemy.

## Main Features

- Password hashing with Flask-Bcrypt.
- Login with JWT access tokens.
- Authenticated user and administrator permissions.
- Ownership checks for places and reviews.
- SQLite persistence with Flask-SQLAlchemy.
- One-to-many and many-to-many entity relationships.
- SQL scripts for schema creation and initial data.
- Mermaid entity-relationship diagram.

## Project Structure

- `app/api/v1`: REST API endpoints.
- `app/models`: SQLAlchemy models and validation.
- `app/services`: Facade and specialized repositories.
- `app/persistence`: repository interface and implementations.
- `sql_scripts`: database schema and initial data.
- `tests`: automated API and persistence tests.
- `ER_DIAGRAM.md`: Mermaid database diagram.
- `ER_DIAGRAM.png`: Exported database diagram.
- `config.py`: application and database configuration.
- `run.py`: application entry point.

## Installation

```bash
python3 -m pip install -r requirements.txt
```

## Database Initialization

The development database is initialized automatically when the application
starts. Missing tables are created and `sql_scripts/seed.sql` is loaded with
the sample users, owner, places, bookings, reviews, and notifications. The
seed uses fixed identifiers and `INSERT OR IGNORE`, so restarting the server
does not duplicate data.

The sample account credentials are:

```text
Guest: guest@hbnb.io / guest1234
Guest: layan@hbnb.io / Layan@2026
Guest: hessa@hbnb.io / Hessa@2026
Owner: owner@hbnb.io / owner1234
Admin: admin@hbnb.io / admin1234
Seed host record: host@hbnb.io / host1234
```

The password is stored as a bcrypt hash, not as plaintext.

## Running the Application

```bash
python3 run.py
```

Swagger documentation is available at:

```text
http://127.0.0.1:5001/api/v1/
```

Start the Part 4 client in a second terminal:

```bash
cd ../part4
python3 -m http.server 5500
```

Open `http://127.0.0.1:5500/` in a browser.

## Authentication

Log in with:

```http
POST /api/v1/auth/login
```

Protected requests must include:

```text
Authorization: Bearer <access_token>
```

The JWT can be checked with:

```http
GET /api/v1/protected
```

Public users can retrieve places. Authenticated users can manage their
own profile, places, and reviews. Administrators can manage users and
amenities and can bypass place and review ownership restrictions.

## Running Tests

```bash
python3 -m unittest discover -s tests -v
```

See `TESTING.md` for the test coverage and manual verification commands.
