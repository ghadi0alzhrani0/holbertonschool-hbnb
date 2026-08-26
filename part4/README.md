# HBnB Part 4

Part 4 is the web client for the HBnB API. It uses HTML5, CSS3, and
JavaScript to display places, authenticate users, and submit reviews.

## Required pages

- `index.html`: loads places from the API and filters them by price.
- `login.html`: authenticates a user and stores the JWT in a cookie.
- `place.html`: displays place, host, amenity, and review details.
- `add_review.html`: submits a review for an authenticated user.

The project also includes signup, profile, booking, notification, owner,
and administrator pages for the additional entities carried through Parts
1 to 3. Owners can upload a cover image while creating or editing a place.

## Run locally

Start the API from `part3`:

```bash
python3 run.py
```

Serve the client from `part4`:

```bash
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

## Demo accounts

- Guest: `guest@hbnb.io` / `guest1234`
- Guest: `layan@hbnb.io` / `Layan@2026`
- Guest: `hessa@hbnb.io` / `Hessa@2026`
- Property owner: `owner@hbnb.io` / `owner1234`
- Administrator: `admin@hbnb.io` / `admin1234`
- Seed host record: `host@hbnb.io` / `host1234`

The guest account can browse, book, and review places. The property owner
opens a separate dashboard for properties, reservations, and guest activity.
The administrator opens a site dashboard for account and activity totals.
The notification bell appears only after login and refreshes automatically.

The default API URL is `http://127.0.0.1:5001/api/v1`. It can be changed
from the browser console when needed:

```javascript
localStorage.setItem("HBnB_API_BASE", "http://127.0.0.1:5001/api/v1");
```
