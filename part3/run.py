#!/usr/bin/python3
"""Run the HBnB Flask application."""

import os

from app import create_app


app = create_app()


if __name__ == "__main__":
    app.run(
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "5001")),
        debug=app.config.get("DEBUG", False)
    )
