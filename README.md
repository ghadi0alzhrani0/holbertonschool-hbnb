# HBnB Project  

## 1. Introduction

**HBnB project** is a rental booking system inspired by Airbnb. The system connects guests who want to book places with owners who manage rental listings.

The project includes more than basic places and reviews. It also supports bookings, booking status history, room details, amenities, availability, seasonal pricing, guest reviews, owner responses, and notifications.

## 2. Main Actors

The system has two main actors:

| Actor | Description |
| --- | --- |
| Guest/User | A person who can browse places, create bookings, and write reviews. |
| Owner | A person or business that can add places, manage bookings, and respond to reviews. |

## 3.main Features

The main features of the system are:

- Login for guests and owners.
- Add and manage rental places.
- Store room details for each place.
- Add amenities to places.
- Add seasonal prices for special date ranges.
- Save booking status history.
- Allow owners to approve bookings.
- Send system notifications.
- Allow guests to write reviews.
- Store detailed review ratings.
- Allow owners to respond to reviews.
- Allow owners to review guests after bookings.

## 4. Architecture Overview

The system uses a layered architecture. Each layer has a specific responsibility.

```mermaid
flowchart LR
    A[Guest / Owner] --> B[API Layer]
    B --> C[Business Logic Layer]
    C --> D[Database Layer]
```

### 4.1 API Layer

The API Layer receives requests from guests and owners.

Responsibilities:

- Receive login, place, booking, and review requests.
- Send valid requests to the Business Logic Layer.
- Return success or error responses.
- Format the response that goes back to the user.

The API Layer should not contain the main rules of the application.

### 4.2 Business Logic Layer

The Business Logic Layer contains the rules of the system.

Responsibilities:

- Validate login information.
- Check if a user or owner exists.
- Validate place data.
- Check booking dates.
- Check place availability.
- Calculate total booking price.
- Apply seasonal pricing when needed.
- Update booking status.
- Save booking history.
- Create notifications.
- Validate reviews and rating details.

This layer decides whether an action is allowed or not.

### 4.3 Database Layer

The Database Layer stores all project data.

Responsibilities:

- Store users and owners.
- Store places and related details.
- Store bookings and booking history.
- Store reviews and rating details.
- Store notifications.
- Keep relationships between tables organized.

## 5. Domain Model

The domain model describes the main objects in the system and how they are related.

```mermaid
%%{init: {'theme': 'neutral'}}%%
classDiagram
    class User {
        +String id
        +String first_name
        +String last_name
        +String email
        +String password
        +register() Boolean
        +login() Boolean
        +bookPlace() Booking
        +addReview() Review
    }
    class Owner {
        +String id
        +String business_name
        +String contact_person
        +String email
        +String phone_number
        +String commercial_register
        +registerOwner() Boolean
        +addPlace() Place
        +addSeasonalPricing() SeasonalPricing
        +respondToReview() ReviewResponse
        +reviewGuest() GuestReview
    }
    class Country {
        +String id
        +String name
        +String code
    }
    class State {
        +String id
        +String name
    }
    class City {
        +String id
        +String name
    }
    class PlaceType {
        +String id
        +String name
    }
    class CancellationPolicy {
        +String id
        +String name
        +String description
        +calculateRefund(total_price, days_before) Float
    }
    class Place {
        +String id
        +String name
        +String description
        +Integer number_rooms
        +Integer number_bathrooms
        +Integer max_guest
        +Float price_by_night
        +Float latitude
        +Float longitude
        +checkAvailability(start_date, end_date) Boolean
        +calculateTotalPrice(start_date, end_date) Float
        +getAverageRatings() ReviewRatingDetails
    }
    class RoomDetail {
        +String id
        +String room_name
        +String bed_type
        +Integer beds_count
    }
    class PlaceAvailability {
        +String id
        +DateTime start_date
        +DateTime end_date
        +Boolean is_booked
        +toggleAvailability() Boolean
    }
    class SeasonalPricing {
        +String id
        +DateTime start_date
        +DateTime end_date
        +Float special_price
        +isActive(date) Boolean
    }
    class AmenityCategory {
        +String id
        +String name
    }
    class Amenity {
        +String id
        +String name
        +String description
    }
    class Booking {
        +String id
        +DateTime start_date
        +DateTime end_date
        +Float total_price
        +String status
        +confirm() Boolean
        +cancel() Boolean
        +checkIn() Boolean
    }
    class BookingGuest {
        +String id
        +Integer adults_count
        +Integer children_count
        +Integer infants_count
        +getTotalGuestsCount() Integer
    }
    class BookingHistory {
        +String id
        +String old_status
        +String new_status
        +DateTime changed_at
        +logStatusChange() Boolean
    }
    class Review {
        +String id
        +String review_text
        +DateTime created_at
    }
    class ReviewRatingDetails {
        +String id
        +Integer cleanliness
        +Integer accuracy
        +Integer communication
        +Integer location
        +Integer check_in
        +Integer value
        +calculateAverageRating() Float
    }
    class ReviewResponse {
        +String id
        +String response_text
        +DateTime created_at
    }
    class GuestReview {
        +String id
        +Integer cleanliness_rating
        +Integer communication_rating
        +Integer respect_rules_rating
        +String review_text
    }
    class SystemNotification {
        +String id
        +String notification_type
        +String content
        +Boolean is_seen
        +sendNotification() Boolean
        +markAsRead() Boolean
    }

    Country "1" *-- "0..*" State : "contains"
    State "1" *-- "0..*" City : "contains"
    City "1" --> "0..*" Place : "hosts"
    Owner "1" --> "0..*" Place : "owns_and_manages"
    PlaceType "1" --> "0..*" Place : "categorizes"
    CancellationPolicy "1" --> "0..*" Place : "governs"
    Place "1" *-- "0..*" RoomDetail : "composed_of"
    Place "1" *-- "0..*" PlaceAvailability : "manages_schedule"
    Place "1" *-- "0..*" SeasonalPricing : "applies"
    AmenityCategory "1" *-- "0..*" Amenity : "groups"
    Place "0..*" --> "0..*" Amenity : "features"
    User "1" --> "0..*" Booking : "rents"
    Place "1" --> "0..*" Booking : "booked_for"
    Booking "1" *-- "1" BookingGuest : "includes"
    Booking "1" *-- "0..*" BookingHistory : "logs"
    Place "1" --> "0..*" Review : "receives"
    User "1" --> "0..*" Review : "writes"
    Review "1" *-- "1" ReviewRatingDetails : "details"
    ReviewResponse "0..1" --> "1" Review : "answered_by"
    Owner "1" --> "0..*" ReviewResponse : "responds"
    Booking "1" --> "0..1" GuestReview : "triggers"
    Owner "1" --> "0..*" GuestReview : "conducts"
    User "1" --> "0..*" GuestReview : "evaluated"
    User "1" --> "0..*" SystemNotification : "user_notified"
    Owner "1" --> "0..*" SystemNotification : "owner_notified"
```


### 5.1 Main Entities

| Entity | Purpose |
| --- | --- |
| User | Stores guest information and connects guests to bookings and reviews. |
| Owner | Stores owner and business information. |
| Place | Stores rental listing information. |
| Booking | Stores reservation information. |
| Booking History | Stores booking status changes. |
| Room Detail | Stores room name, bed type, and bed count. |
| Amenity | Stores features available in places. |
| Review | Stores guest feedback about places. |
| Review Rating Detail | Stores detailed rating scores. |
| Review Response | Stores owner replies to reviews. |
| Guest Review | Stores owner feedback about guests. |
| Notification | Stores messages sent by the system. |

### 5.2 Entity Details

**User** stores guest data such as name, email, password, and timestamps. A user can create bookings and write reviews.

**Owner** stores business data such as business name, contact person, email, phone number, commercial register, and timestamps. An owner can create places and approve bookings.

**Place** stores listing data such as owner, city, place type, cancellation policy, name, description, room count, bathroom count, maximum guests, nightly price, latitude, and longitude.

**Booking** stores the selected place, guest, start date, end date, total price, and booking status.

**Review** stores feedback text written by guests. Detailed rating values are stored in a separate table.

**Amenity** stores services or features that can be attached to a place, such as Wi-Fi, parking, or kitchen.

**Notification** stores system messages for guests and owners, such as booking confirmation updates.

## 6. Database Design

The database is designed to separate information into clear tables. This avoids repeated data and makes the system easier to update.

```mermaid
erDiagram
    USER {
        string id PK
        string first_name
        string last_name
        string email
        string password
        datetime created_at
        datetime updated_at
    }
    OWNER {
        string id PK
        string business_name
        string contact_person
        string email
        string password
        string phone_number
        string commercial_register
        datetime created_at
        datetime updated_at
    }
    COUNTRY {
        string id PK
        string name
        string code
    }
    STATE {
        string id PK
        string country_id FK
        string name
    }
    CITY {
        string id PK
        string state_id FK
        string name
    }
    PLACE_TYPE {
        string id PK
        string name
    }
    CANCELLATION_POLICY {
        string id PK
        string name
        string description
    }
    PLACE {
        string id PK
        string owner_id FK
        string city_id FK
        string place_type_id FK
        string cancellation_policy_id FK
        string name
        string description
        integer number_rooms
        integer number_bathrooms
        integer max_guest
        float price_by_night
        float latitude
        float longitude
        datetime created_at
        datetime updated_at
    }
    ROOM_DETAIL {
        string id PK
        string place_id FK
        string room_name
        string bed_type
        integer beds_count
    }
    PLACE_AVAILABILITY {
        string id PK
        string place_id FK
        datetime start_date
        datetime end_date
        boolean is_booked
    }
    SEASONAL_PRICING {
        string id PK
        string place_id FK
        datetime start_date
        datetime end_date
        float special_price
    }
    AMENITY_CATEGORY {
        string id PK
        string name
    }
    AMENITY {
        string id PK
        string category_id FK
        string name
        string description
    }
    PLACE_AMENITY {
        string place_id FK
        string amenity_id FK
    }
    BOOKING {
        string id PK
        string place_id FK
        string user_id FK
        datetime start_date
        datetime end_date
        float total_price
        string status
        datetime created_at
        datetime updated_at
    }
    BOOKING_GUEST {
        string id PK
        string booking_id FK
        integer adults_count
        integer children_count
        integer infants_count
    }
    BOOKING_HISTORY {
        string id PK
        string booking_id FK
        string old_status
        string new_status
        datetime changed_at
    }
    REVIEW {
        string id PK
        string place_id FK
        string user_id FK
        string review_text
        datetime created_at
    }
    REVIEW_RATING_DETAILS {
        string id PK
        string review_id FK
        integer cleanliness
        integer accuracy
        integer communication
        integer location
        integer check_in
        integer value
    }
    REVIEW_RESPONSE {
        string id PK
        string review_id FK
        string owner_id FK
        string response_text
        datetime created_at
    }
    GUEST_REVIEW {
        string id PK
        string booking_id FK
        string owner_id FK
        string guest_id FK
        integer cleanliness_rating
        integer communication_rating
        integer respect_rules_rating
        string review_text
    }
    SYSTEM_NOTIFICATION {
        string id PK
        string user_id FK
        string owner_id FK
        string notification_type
        string content
        boolean is_seen
        datetime created_at
    }

    COUNTRY ||--o{ STATE : "has"
    STATE ||--o{ CITY : "has"
    CITY ||--o{ PLACE : "hosts"
    OWNER ||--o{ PLACE : "owns_and_manages"
    PLACE_TYPE ||--o{ PLACE : "categorizes"
    CANCELLATION_POLICY ||--o{ PLACE : "governs"
    PLACE ||--o{ ROOM_DETAIL : "contains"
    PLACE ||--o{ PLACE_AVAILABILITY : "scheduled_at"
    PLACE ||--o{ SEASONAL_PRICING : "priced_at"
    AMENITY_CATEGORY ||--o{ AMENITY : "groups"
    PLACE ||--o{ PLACE_AMENITY : "features"
    AMENITY ||--o{ PLACE_AMENITY : "provides"
    PLACE ||--o{ BOOKING : "booked_for"
    USER ||--o{ BOOKING : "rents_user_id"
    BOOKING ||--|| BOOKING_GUEST : "includes"
    BOOKING ||--o{ BOOKING_HISTORY : "logs"
    PLACE ||--o{ REVIEW : "receives"
    USER ||--o{ REVIEW : "writes_user_id"
    REVIEW ||--|| REVIEW_RATING_DETAILS : "rated_by"
    REVIEW ||--|| REVIEW_RESPONSE : "answered_by_owner"
    OWNER ||--o{ REVIEW_RESPONSE : "writes_response"
    BOOKING ||--|| GUEST_REVIEW : "evaluates"
    OWNER ||--o{ GUEST_REVIEW : "conducts_review"
    USER ||--o{ GUEST_REVIEW : "receives_rating"
    USER ||--o{ SYSTEM_NOTIFICATION : "user_notified"
    OWNER ||--o{ SYSTEM_NOTIFICATION : "owner_notified"
```


### 6.1 Main Tables

| Table | Description |
| --- | --- |
| `users` | Stores guest accounts. |
| `owners` | Stores owner and business accounts. |
| `countries` | Stores country data. |
| `states` | Stores state or region data. |
| `cities` | Stores city data. |
| `place_types` | Stores place type options. |
| `cancellation_policies` | Stores cancellation policy details. |
| `places` | Stores main place information. |
| `room_details` | Stores room and bed details for each place. |
| `amenity_categories` | Stores amenity groups. |
| `amenities` | Stores available amenities. |
| `place_amenities` | Connects places with amenities. |
| `place_availability` | Stores available or booked date ranges. |
| `seasonal_pricing` | Stores special prices for certain dates. |
| `bookings` | Stores booking records. |
| `booking_guests` | Stores adults, children, and infants count. |
| `booking_history` | Stores booking status changes. |
| `reviews` | Stores guest reviews for places. |
| `review_rating_details` | Stores rating scores for reviews. |
| `review_responses` | Stores owner replies to reviews. |
| `guest_reviews` | Stores owner reviews for guests. |
| `system_notifications` | Stores notifications. |

### 6.2 Important Relationships

- One owner can create many places.
- One place belongs to one owner.
- One city can contain many places.
- One user can create many bookings.
- One booking belongs to one user and one place.
- One booking can have guest count details.
- One booking can have many history records.
- One place can have many room details.
- One place can have many availability records.
- One place can have many seasonal pricing records.
- One place can have many reviews.
- One review belongs to one user and one place.
- One review can have rating details.
- One review can have an owner response.
- One place can have many amenities.
- One amenity can be used by many places.
- A notification can be linked to a user or an owner.

## 7. Business Rules

The system follows these rules:

- A user must have a valid email.
- An owner must have a valid email.
- A place must belong to an existing owner.
- A place must be connected to an existing city.
- A place must have a valid place type.
- A place must have a valid cancellation policy.
- A booking must belong to an existing user and place.
- The start date must be before the end date.
- The system must check availability before creating a booking.
- The system must calculate the total price before saving the booking.
- Seasonal pricing should be used when the booking date matches a special price period.
- A new booking starts with the `Pending` status.
- Only the owner can approve a booking for their place.
- Every booking status change should be saved in `booking_history`.
- A review must belong to an existing user and place.
- Rating values should be within the accepted range.
- Owner responses should be linked to existing reviews.
- Guest reviews should be linked to valid bookings.

## 8. Main System Flows

This section contains the sequence diagrams for the main functions in the Accommodation Booking System. Each diagram shows how the frontend, backend, and database work together to complete a task.

## 8.1 User Authentication Flow

This diagram shows how a user logs into the system. The user enters their email and password, then the system checks the information. If everything is correct, the user can access the dashboard.

```mermaid
sequenceDiagram
    autonumber
    title Flow 1: User Authentication (Login)

    actor User as User / Owner
    participant FE as Frontend (UI / JS)
    participant BE as Backend API (Server)
    participant DB as Database

    User->>FE: Fill Login Form & Click "Submit"
    FE->>BE: POST /api/auth/login (email, password, role)

    alt If Role is Owner
        BE->>DB: SELECT * FROM owners WHERE email = input_email
        DB-->>BE: Return Owner Record (hashed_password)
    else If Role is Guest
        BE->>DB: SELECT * FROM users WHERE email = input_email
        DB-->>BE: Return Guest Record (hashed_password)
    end

    BE->>BE: Verify Password (inputPassword, storedPassword)

    alt Credentials Valid
        BE->>BE: Generate JWT Token (actorId, roleType)
        BE-->>FE: HTTP 200 OK (Token & Redirect URL)
        FE->>User: Display Dashboard & Store Token
    else Credentials Invalid
        BE-->>FE: HTTP 401 Unauthorized (Error Message)
        FE->>User: Display "Invalid Credentials" Alert
    end
```

## 8.2 Place Management Flow

This diagram shows how the property owner adds a new place. The system checks the entered information, saves the property, rooms, and amenities, then confirms that the listing was created successfully.

```mermaid
sequenceDiagram
    autonumber
    title Flow 2: Place Management (Property Listing)

    actor Owner as Property Owner
    participant FE as Frontend (UI / JS)
    participant BE as Backend API (Server)
    participant DB as Database

    Owner->>FE: Input Property Details, Rooms & Amenities
    Owner->>FE: Click "List Place"

    FE->>BE: POST /api/places (placeDetails, roomDetails, amenitiesList)

    BE->>BE: Validate Place Structure & Fields

    BE->>DB: SELECT id FROM cities WHERE id = cityId
    DB-->>BE: City Exists (True)

    BE->>DB: INSERT INTO places (ownerId, cityId, title, price)
    DB-->>BE: Return placeId

    BE->>DB: INSERT INTO rooms (placeId, type, capacity)
    DB-->>BE: Rooms Saved

    BE->>DB: INSERT INTO place_amenities (placeId, amenityId)
    DB-->>BE: Amenities Linked

    BE-->>FE: HTTP 201 Created (Place Listed Successfully)
    FE->>Owner: Display Success Message
    FE->>Owner: Refresh Property Listings
```

## 8.3 Booking Process Flow

This diagram explains the booking process. The guest sends a booking request, the system checks if the place is available, calculates the total price, and saves the booking. After that, the owner can approve the booking.

```mermaid
sequenceDiagram
    autonumber
    title Flow 3: Booking Process

    actor Guest as Guest User
    participant FE as Frontend App
    participant BE as Backend API (Server)
    participant DB as Database
    actor Owner as Property Owner

    Guest->>FE: Select Dates
    Guest->>FE: Click "Book Now"

    FE->>BE: POST /api/bookings (placeId, startDate, endDate)

    BE->>BE: Validate Date Constraints

    BE->>DB: Check Existing Bookings
    DB-->>BE: Property Available

    BE->>DB: Retrieve Seasonal Pricing
    DB-->>BE: Pricing Information

    BE->>BE: Calculate Total Cost

    BE->>DB: INSERT Booking (Status = Pending)
    DB-->>BE: Return bookingId

    BE-->>FE: HTTP 201 Created
    FE->>Guest: Booking Pending Approval

    Owner->>FE: Open Dashboard
    Owner->>FE: Click "Approve Booking"

    FE->>BE: PUT /api/bookings/{id}/status

    BE->>BE: Validate Booking Rules

    BE->>DB: UPDATE Booking Status = Confirmed
    DB-->>BE: Status Updated

    BE->>DB: Insert Booking History
    DB-->>BE: History Saved

    BE->>DB: Insert Notification
    DB-->>BE: Notification Stored

    BE-->>FE: HTTP 200 OK
    FE->>Owner: Display Confirmation
```

## 8.4 Review and Rating Flow

This diagram shows how a guest submits a review after staying at a property. The system saves the review and ratings, then shows a confirmation message.

```mermaid
sequenceDiagram
    autonumber
    title Flow 4: Review and Rating

    actor Guest as Guest User
    participant FE as Frontend (UI / JS)
    participant BE as Backend API (Server)
    participant DB as Database

    Guest->>FE: Fill Review Form
    Guest->>FE: Select Rating Stars
    Guest->>FE: Click "Submit Review"

    FE->>BE: POST /api/reviews (placeId, reviewText, ratingsDict)

    BE->>BE: Validate User Session

    BE->>DB: INSERT Review
    DB-->>BE: Return reviewId

    BE->>DB: INSERT Rating Categories
    DB-->>BE: Ratings Saved

    BE-->>FE: HTTP 201 Created

    FE->>Guest: Display "Thank You for Your Feedback"
```

## 9. Suggested API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/login` | Login as guest or owner. |
| `POST` | `/places` | Create a new place. |
| `GET` | `/places` | Get all places. |
| `GET` | `/places/{placeId}` | Get one place. |
| `POST` | `/bookings` | Create a new booking. |
| `PATCH` | `/bookings/{bookingId}/status` | Update booking status. |
| `GET` | `/bookings/{bookingId}/history` | Get booking history. |
| `POST` | `/places/{placeId}/reviews` | Add a review for a place. |
| `POST` | `/reviews/{reviewId}/responses` | Add owner response to a review. |
| `POST` | `/bookings/{bookingId}/guest-review` | Add owner review for a guest. |
| `GET` | `/notifications` | Get system notifications. |

## 10. Booking Status Values

| Status | Meaning |
| --- | --- |
| `Pending` | The booking is waiting for owner approval. |
| `Confirmed` | The booking has been approved by the owner. |
| `Rejected` | The booking has been rejected by the owner. |
| `Cancelled` | The booking has been cancelled. |

## 11. Project Diagrams

| Diagram | Link |
| --- | --- |
| Class Diagram | [Domain Model](#5-domain-model) |
| Database ERD | [Database Design](#6-database-design) |
| User Authentication Flow | [User Authentication Flow](#81-user-authentication-flow) |
| Place Management Flow | [Place Management Flow](#82-place-management-flow) |
| Booking Process Flow | [Booking Process Flow](#83-booking-process-flow) |
| Review and Rating Flow | [Review and Rating Flow](#84-review-and-rating-flow) |

## 12. Conclusion

This document explains the main technical design of the HBnB Booking Platform. It describes the system actors, architecture, entities, database tables, relationships, business rules, and important system flows.

The design separates the API, business logic, and database responsibilities. This makes the project easier to build, understand, and improve in future stages.

## Team Members
Abeer Alsayari ،
Ghadi Alzhrani ،
Tala Alhudhaybi ،
Aseel Alzhrani ،
