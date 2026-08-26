PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

INSERT OR IGNORE INTO users (
    id, first_name, last_name, email, password, is_admin
) VALUES (
    '36c9050e-ddd3-4c3b-9731-9f487208bbc1',
    'Admin',
    'HBnB',
    'admin@hbnb.io',
    '$2b$12$zeuhQ.xNzO2vG7PZ.b8/z.pS13bby3ses.WExKypcAhTOd3.R.twu',
    TRUE
);

INSERT OR IGNORE INTO users (
    id, first_name, last_name, email, password, is_admin
) VALUES (
    '11111111-1111-4111-8111-111111111111',
    'Reem',
    'Alotaibi',
    'guest@hbnb.io',
    '$2b$12$/WAkNUsxXhu3Snbl6XzYreaP7zfRwyMiH4w8HaNICTlu/PjBK75im',
    FALSE
);

UPDATE users
SET first_name = 'Reem', last_name = 'Alotaibi'
WHERE id = '11111111-1111-4111-8111-111111111111';

INSERT OR IGNORE INTO users (
    id, first_name, last_name, email, password, is_admin
) VALUES
    (
        '12121212-1212-4121-8121-121212121212',
        'Layan',
        'Almutairi',
        'layan@hbnb.io',
        '$2b$12$Y7jrJKwWSNOCTzVWvq9DEO0cdZG6m.PCGdY1sHoXbXh.acvjaG82a',
        FALSE
    ),
    (
        '13131313-1313-4131-8131-131313131313',
        'Hessa',
        'Aldosari',
        'hessa@hbnb.io',
        '$2b$12$vuVmElpr8vNsKzhMkpMeAeID3oUx1TQhIH822hayYppqTwM0yTS.W',
        FALSE
    );

UPDATE users
SET password = '$2b$12$Y7jrJKwWSNOCTzVWvq9DEO0cdZG6m.PCGdY1sHoXbXh.acvjaG82a'
WHERE id = '12121212-1212-4121-8121-121212121212';

UPDATE users
SET password = '$2b$12$vuVmElpr8vNsKzhMkpMeAeID3oUx1TQhIH822hayYppqTwM0yTS.W'
WHERE id = '13131313-1313-4131-8131-131313131313';

INSERT OR IGNORE INTO users (
    id, first_name, last_name, email, password, is_admin
) VALUES (
    '22222222-2222-4222-8222-222222222222',
    'Noura',
    'Alharbi',
    'host@hbnb.io',
    '$2b$12$J3Z4I474MZHjwtWzkQEQ7etmhieLRHnwBGsr6eHOw78DjoRig4/3S',
    FALSE
);

INSERT OR IGNORE INTO owners (
    id, business_name, contact_person, email, password,
    phone_number, commercial_register
) VALUES (
    '33333333-3333-4333-8333-333333333333',
    'Najd Hospitality',
    'Noura Alharbi',
    'owner@hbnb.io',
    '$2b$12$65XYWNJi/xTSdwFD5ZhTZ./eQJiVlhvInwGYsOdX0JUOC4Pma8cF6',
    '+966 55 555 0142',
    '1010876543'
);

INSERT OR IGNORE INTO countries (id, name, code)
VALUES (
    '44444444-4444-4444-8444-444444444444',
    'Saudi Arabia',
    'SAU'
);

INSERT OR IGNORE INTO states (id, country_id, name) VALUES
    ('55555551-5555-4555-8555-555555555551', '44444444-4444-4444-8444-444444444444', 'Riyadh Province'),
    ('55555552-5555-4555-8555-555555555552', '44444444-4444-4444-8444-444444444444', 'Makkah Province'),
    ('55555553-5555-4555-8555-555555555553', '44444444-4444-4444-8444-444444444444', 'Madinah Province'),
    ('55555554-5555-4555-8555-555555555554', '44444444-4444-4444-8444-444444444444', 'Asir Province');

INSERT OR IGNORE INTO cities (id, state_id, name) VALUES
    ('66666661-6666-4666-8666-666666666661', '55555551-5555-4555-8555-555555555551', 'Riyadh'),
    ('66666662-6666-4666-8666-666666666662', '55555552-5555-4555-8555-555555555552', 'Jeddah'),
    ('66666663-6666-4666-8666-666666666663', '55555553-5555-4555-8555-555555555553', 'AlUla'),
    ('66666664-6666-4666-8666-666666666664', '55555554-5555-4555-8555-555555555554', 'Abha');

INSERT OR IGNORE INTO place_types (id, name) VALUES
    ('77777771-7777-4777-8777-777777777771', 'Hotel'),
    ('77777772-7777-4777-8777-777777777772', 'Villa'),
    ('77777773-7777-4777-8777-777777777773', 'Apartment'),
    ('77777774-7777-4777-8777-777777777774', 'Resort');

INSERT OR IGNORE INTO cancellation_policies (id, name, description) VALUES
    ('88888881-8888-4888-8888-888888888881', 'Flexible', 'Cancel up to 24 hours before check-in for a full refund.'),
    ('88888882-8888-4888-8888-888888888882', 'Moderate', 'Cancel five days before check-in for a full refund.');

INSERT OR IGNORE INTO amenity_categories (id, name) VALUES
    ('99999991-9999-4999-8999-999999999991', 'Essentials'),
    ('99999992-9999-4999-8999-999999999992', 'Wellness'),
    ('99999993-9999-4999-8999-999999999993', 'Family');

INSERT OR IGNORE INTO amenities (id, category_id, name, description) VALUES
    ('88c9d062-eaff-4485-a494-b279317cd379', '99999991-9999-4999-8999-999999999991', 'WiFi', 'High-speed wireless internet.'),
    ('c8bc96c8-ac00-4d0d-a903-f73677e2dc54', '99999992-9999-4999-8999-999999999992', 'Swimming Pool', 'Temperature-controlled swimming pool.'),
    ('75d0eb05-2d07-463e-9c73-8592cd0c9be0', '99999991-9999-4999-8999-999999999991', 'Air Conditioning', 'Individual climate control.'),
    ('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '99999991-9999-4999-8999-999999999991', 'Free Parking', 'Complimentary on-site parking.'),
    ('aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '99999991-9999-4999-8999-999999999991', 'Breakfast', 'Daily breakfast with local options.'),
    ('aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '99999992-9999-4999-8999-999999999992', 'Fitness Center', 'Modern cardio and strength equipment.'),
    ('aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '99999992-9999-4999-8999-999999999992', 'Sea View', 'Rooms overlooking the Red Sea.'),
    ('aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5', '99999991-9999-4999-8999-999999999991', 'Workspace', 'A quiet desk and ergonomic chair.'),
    ('aaaaaaa6-aaaa-4aaa-8aaa-aaaaaaaaaaa6', '99999993-9999-4999-8999-999999999993', 'Kids Club', 'Supervised activities for children.');

UPDATE amenities SET category_id = '99999991-9999-4999-8999-999999999991', description = 'High-speed wireless internet.' WHERE id = '88c9d062-eaff-4485-a494-b279317cd379';
UPDATE amenities SET category_id = '99999992-9999-4999-8999-999999999992', description = 'Temperature-controlled swimming pool.' WHERE id = 'c8bc96c8-ac00-4d0d-a903-f73677e2dc54';
UPDATE amenities SET category_id = '99999991-9999-4999-8999-999999999991', description = 'Individual climate control.' WHERE id = '75d0eb05-2d07-463e-9c73-8592cd0c9be0';

INSERT OR IGNORE INTO places (
    id, title, description, price, latitude, longitude, owner_id,
    business_owner_id, city_id, place_type_id, cancellation_policy_id,
    number_rooms, number_bathrooms, max_guest
) VALUES
    ('b0000001-0000-4000-8000-000000000001', 'Riyadh Skyline Hotel', 'A polished city hotel near King Abdullah Financial District with skyline views and quiet work-friendly rooms.', 850, 24.7743, 46.6435, '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '66666661-6666-4666-8666-666666666661', '77777771-7777-4777-8777-777777777771', '88888881-8888-4888-8888-888888888881', 2, 2, 4),
    ('b0000002-0000-4000-8000-000000000002', 'Jeddah Corniche Suites', 'Bright suites on the Corniche with Red Sea views, generous living areas, and breakfast included.', 950, 21.6259, 39.1044, '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '66666662-6666-4666-8666-666666666662', '77777773-7777-4777-8777-777777777773', '88888882-8888-4888-8888-888888888882', 2, 2, 5),
    ('b0000003-0000-4000-8000-000000000003', 'AlUla Desert Villa', 'A private sandstone villa surrounded by desert scenery, designed for peaceful evenings and stargazing.', 1500, 26.6085, 37.9232, '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '66666663-6666-4666-8666-666666666663', '77777772-7777-4777-8777-777777777772', '88888882-8888-4888-8888-888888888882', 3, 3, 6),
    ('b0000004-0000-4000-8000-000000000004', 'Abha Cloud Retreat', 'A mountain retreat with cool weather, garden terraces, and wide views across the Asir highlands.', 720, 18.2164, 42.5053, '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '66666664-6666-4666-8666-666666666664', '77777774-7777-4777-8777-777777777774', '88888881-8888-4888-8888-888888888881', 2, 2, 5),
    ('b0000005-0000-4000-8000-000000000005', 'Olaya Boutique Apartment', 'A calm central apartment with fast WiFi, a dedicated workspace, and easy access to Olaya restaurants.', 480, 24.7117, 46.6744, '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '66666661-6666-4666-8666-666666666661', '77777773-7777-4777-8777-777777777773', '88888881-8888-4888-8888-888888888881', 1, 1, 2),
    ('b0000006-0000-4000-8000-000000000006', 'Red Sea Family Resort', 'A relaxed family resort with pools, a kids club, spacious rooms, and direct access to the waterfront.', 1100, 21.6327, 39.1016, '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '66666662-6666-4666-8666-666666666662', '77777774-7777-4777-8777-777777777774', '88888882-8888-4888-8888-888888888882', 3, 3, 7);

INSERT OR IGNORE INTO place_amenity (place_id, amenity_id) VALUES
    ('b0000001-0000-4000-8000-000000000001', '88c9d062-eaff-4485-a494-b279317cd379'),
    ('b0000001-0000-4000-8000-000000000001', '75d0eb05-2d07-463e-9c73-8592cd0c9be0'),
    ('b0000001-0000-4000-8000-000000000001', 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
    ('b0000001-0000-4000-8000-000000000001', 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3'),
    ('b0000001-0000-4000-8000-000000000001', 'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5'),
    ('b0000002-0000-4000-8000-000000000002', '88c9d062-eaff-4485-a494-b279317cd379'),
    ('b0000002-0000-4000-8000-000000000002', '75d0eb05-2d07-463e-9c73-8592cd0c9be0'),
    ('b0000002-0000-4000-8000-000000000002', 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
    ('b0000002-0000-4000-8000-000000000002', 'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4'),
    ('b0000003-0000-4000-8000-000000000003', '88c9d062-eaff-4485-a494-b279317cd379'),
    ('b0000003-0000-4000-8000-000000000003', 'c8bc96c8-ac00-4d0d-a903-f73677e2dc54'),
    ('b0000003-0000-4000-8000-000000000003', '75d0eb05-2d07-463e-9c73-8592cd0c9be0'),
    ('b0000003-0000-4000-8000-000000000003', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
    ('b0000004-0000-4000-8000-000000000004', '88c9d062-eaff-4485-a494-b279317cd379'),
    ('b0000004-0000-4000-8000-000000000004', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
    ('b0000004-0000-4000-8000-000000000004', 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
    ('b0000005-0000-4000-8000-000000000005', '88c9d062-eaff-4485-a494-b279317cd379'),
    ('b0000005-0000-4000-8000-000000000005', '75d0eb05-2d07-463e-9c73-8592cd0c9be0'),
    ('b0000005-0000-4000-8000-000000000005', 'aaaaaaa5-aaaa-4aaa-8aaa-aaaaaaaaaaa5'),
    ('b0000006-0000-4000-8000-000000000006', 'c8bc96c8-ac00-4d0d-a903-f73677e2dc54'),
    ('b0000006-0000-4000-8000-000000000006', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
    ('b0000006-0000-4000-8000-000000000006', 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2'),
    ('b0000006-0000-4000-8000-000000000006', 'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4'),
    ('b0000006-0000-4000-8000-000000000006', 'aaaaaaa6-aaaa-4aaa-8aaa-aaaaaaaaaaa6');

INSERT OR IGNORE INTO room_details (id, place_id, room_name, bed_type, beds_count) VALUES
    ('c0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', 'Skyline King Room', 'King', 1),
    ('c0000002-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001', 'Twin City Room', 'Single', 2),
    ('c0000003-0000-4000-8000-000000000003', 'b0000002-0000-4000-8000-000000000002', 'Sea View Suite', 'King', 1),
    ('c0000004-0000-4000-8000-000000000004', 'b0000003-0000-4000-8000-000000000003', 'Desert Master Suite', 'King', 1),
    ('c0000005-0000-4000-8000-000000000005', 'b0000003-0000-4000-8000-000000000003', 'Garden Twin Room', 'Single', 2),
    ('c0000006-0000-4000-8000-000000000006', 'b0000004-0000-4000-8000-000000000004', 'Mountain Room', 'Queen', 1),
    ('c0000007-0000-4000-8000-000000000007', 'b0000005-0000-4000-8000-000000000005', 'Olaya Studio', 'Queen', 1),
    ('c0000008-0000-4000-8000-000000000008', 'b0000006-0000-4000-8000-000000000006', 'Family Suite', 'Queen', 2);

INSERT OR IGNORE INTO place_availability (id, place_id, start_date, end_date, is_booked) VALUES
    ('d0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', '2026-08-21', '2026-12-31', FALSE),
    ('d0000002-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001', '2026-09-10', '2026-09-13', TRUE),
    ('d0000003-0000-4000-8000-000000000003', 'b0000002-0000-4000-8000-000000000002', '2026-08-21', '2026-12-31', FALSE),
    ('d0000004-0000-4000-8000-000000000004', 'b0000003-0000-4000-8000-000000000003', '2026-08-21', '2026-12-31', FALSE),
    ('d0000005-0000-4000-8000-000000000005', 'b0000003-0000-4000-8000-000000000003', '2026-10-05', '2026-10-08', TRUE),
    ('d0000006-0000-4000-8000-000000000006', 'b0000004-0000-4000-8000-000000000004', '2026-08-21', '2026-12-31', FALSE),
    ('d0000007-0000-4000-8000-000000000007', 'b0000005-0000-4000-8000-000000000005', '2026-08-21', '2026-12-31', FALSE),
    ('d0000008-0000-4000-8000-000000000008', 'b0000006-0000-4000-8000-000000000006', '2026-08-21', '2026-12-31', FALSE),
    ('d0000009-0000-4000-8000-000000000009', 'b0000004-0000-4000-8000-000000000004', '2026-10-18', '2026-10-21', TRUE),
    ('d0000010-0000-4000-8000-000000000010', 'b0000003-0000-4000-8000-000000000003', '2026-06-12', '2026-06-15', TRUE),
    ('d0000011-0000-4000-8000-000000000011', 'b0000006-0000-4000-8000-000000000006', '2026-11-12', '2026-11-15', TRUE),
    ('d0000012-0000-4000-8000-000000000012', 'b0000001-0000-4000-8000-000000000001', '2026-06-20', '2026-06-22', TRUE);

INSERT OR IGNORE INTO seasonal_pricing (id, place_id, start_date, end_date, special_price) VALUES
    ('e0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', '2026-09-20', '2026-09-30', 790),
    ('e0000002-0000-4000-8000-000000000002', 'b0000002-0000-4000-8000-000000000002', '2026-09-22', '2026-09-26', 1090),
    ('e0000003-0000-4000-8000-000000000003', 'b0000003-0000-4000-8000-000000000003', '2026-11-01', '2026-11-30', 1750),
    ('e0000004-0000-4000-8000-000000000004', 'b0000004-0000-4000-8000-000000000004', '2026-10-01', '2026-10-20', 680),
    ('e0000005-0000-4000-8000-000000000005', 'b0000006-0000-4000-8000-000000000006', '2026-12-15', '2026-12-31', 1350);

INSERT OR IGNORE INTO bookings (id, place_id, user_id, start_date, end_date, total_price, status) VALUES
    ('f0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '2026-09-10', '2026-09-13', 2550, 'confirmed'),
    ('f0000002-0000-4000-8000-000000000002', 'b0000003-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', '2026-10-05', '2026-10-08', 4500, 'pending'),
    ('f0000003-0000-4000-8000-000000000003', 'b0000002-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '2026-07-01', '2026-07-04', 2850, 'completed'),
    ('f0000004-0000-4000-8000-000000000004', 'b0000004-0000-4000-8000-000000000004', '12121212-1212-4121-8121-121212121212', '2026-10-18', '2026-10-21', 2160, 'confirmed'),
    ('f0000005-0000-4000-8000-000000000005', 'b0000003-0000-4000-8000-000000000003', '12121212-1212-4121-8121-121212121212', '2026-06-12', '2026-06-15', 4500, 'completed'),
    ('f0000006-0000-4000-8000-000000000006', 'b0000006-0000-4000-8000-000000000006', '13131313-1313-4131-8131-131313131313', '2026-11-12', '2026-11-15', 3300, 'pending'),
    ('f0000007-0000-4000-8000-000000000007', 'b0000001-0000-4000-8000-000000000001', '13131313-1313-4131-8131-131313131313', '2026-06-20', '2026-06-22', 1700, 'completed');

INSERT OR IGNORE INTO booking_guests (id, booking_id, adults_count, children_count, infants_count) VALUES
    ('a1000001-0000-4000-8000-000000000001', 'f0000001-0000-4000-8000-000000000001', 2, 0, 0),
    ('a1000002-0000-4000-8000-000000000002', 'f0000002-0000-4000-8000-000000000002', 2, 1, 0),
    ('a1000003-0000-4000-8000-000000000003', 'f0000003-0000-4000-8000-000000000003', 2, 2, 0),
    ('a1000004-0000-4000-8000-000000000004', 'f0000004-0000-4000-8000-000000000004', 1, 0, 0),
    ('a1000005-0000-4000-8000-000000000005', 'f0000005-0000-4000-8000-000000000005', 2, 0, 0),
    ('a1000006-0000-4000-8000-000000000006', 'f0000006-0000-4000-8000-000000000006', 2, 2, 0),
    ('a1000007-0000-4000-8000-000000000007', 'f0000007-0000-4000-8000-000000000007', 1, 0, 0);

INSERT OR IGNORE INTO booking_history (id, booking_id, old_status, new_status, changed_at) VALUES
    ('a2000001-0000-4000-8000-000000000001', 'f0000001-0000-4000-8000-000000000001', 'pending', 'confirmed', '2026-08-18 09:30:00'),
    ('a2000002-0000-4000-8000-000000000002', 'f0000003-0000-4000-8000-000000000003', 'confirmed', 'checked_in', '2026-07-01 15:00:00'),
    ('a2000003-0000-4000-8000-000000000003', 'f0000003-0000-4000-8000-000000000003', 'checked_in', 'completed', '2026-07-04 12:00:00'),
    ('a2000004-0000-4000-8000-000000000004', 'f0000004-0000-4000-8000-000000000004', 'pending', 'confirmed', '2026-08-22 10:15:00'),
    ('a2000005-0000-4000-8000-000000000005', 'f0000005-0000-4000-8000-000000000005', 'pending', 'confirmed', '2026-05-28 14:10:00'),
    ('a2000006-0000-4000-8000-000000000006', 'f0000005-0000-4000-8000-000000000005', 'confirmed', 'checked_in', '2026-06-12 15:00:00'),
    ('a2000007-0000-4000-8000-000000000007', 'f0000005-0000-4000-8000-000000000005', 'checked_in', 'completed', '2026-06-15 12:00:00'),
    ('a2000008-0000-4000-8000-000000000008', 'f0000007-0000-4000-8000-000000000007', 'pending', 'confirmed', '2026-06-01 11:25:00'),
    ('a2000009-0000-4000-8000-000000000009', 'f0000007-0000-4000-8000-000000000007', 'confirmed', 'checked_in', '2026-06-20 15:00:00'),
    ('a2000010-0000-4000-8000-000000000010', 'f0000007-0000-4000-8000-000000000007', 'checked_in', 'completed', '2026-06-22 12:00:00');

INSERT OR IGNORE INTO reviews (id, text, rating, user_id, place_id) VALUES
    ('a3000001-0000-4000-8000-000000000001', 'The suite was bright, quiet, and exactly as described. The Corniche view at sunset was excellent.', 5, '11111111-1111-4111-8111-111111111111', 'b0000002-0000-4000-8000-000000000002'),
    ('a3000002-0000-4000-8000-000000000002', 'Beautiful mountain weather and a very calm garden. Check-in instructions could be a little clearer.', 4, '11111111-1111-4111-8111-111111111111', 'b0000004-0000-4000-8000-000000000004'),
    ('a3000003-0000-4000-8000-000000000003', 'The desert villa felt private and peaceful, and the stargazing terrace was the highlight of our stay.', 5, '12121212-1212-4121-8121-121212121212', 'b0000003-0000-4000-8000-000000000003'),
    ('a3000004-0000-4000-8000-000000000004', 'A comfortable city stay with a quiet room, helpful staff, and an easy check-in experience.', 4, '13131313-1313-4131-8131-131313131313', 'b0000001-0000-4000-8000-000000000001');

INSERT OR IGNORE INTO review_rating_details (id, review_id, cleanliness, accuracy, communication, location, check_in, value) VALUES
    ('a4000001-0000-4000-8000-000000000001', 'a3000001-0000-4000-8000-000000000001', 5, 5, 5, 5, 5, 4),
    ('a4000002-0000-4000-8000-000000000002', 'a3000002-0000-4000-8000-000000000002', 5, 4, 4, 5, 3, 4),
    ('a4000003-0000-4000-8000-000000000003', 'a3000003-0000-4000-8000-000000000003', 5, 5, 5, 5, 5, 4),
    ('a4000004-0000-4000-8000-000000000004', 'a3000004-0000-4000-8000-000000000004', 4, 5, 5, 5, 5, 4);

INSERT OR IGNORE INTO review_responses (id, review_id, owner_id, response_text) VALUES
    ('a5000001-0000-4000-8000-000000000001', 'a3000001-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'Thank you, Reem. We are glad you enjoyed the sunset view and quiet suite.'),
    ('a5000002-0000-4000-8000-000000000002', 'a3000003-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'Thank you, Layan. We are happy the terrace made your AlUla stay memorable.');

UPDATE review_responses
SET response_text = 'Thank you, Reem. We are glad you enjoyed the sunset view and quiet suite.'
WHERE id = 'a5000001-0000-4000-8000-000000000001';

INSERT OR IGNORE INTO guest_reviews (id, booking_id, owner_id, guest_id, cleanliness_rating, communication_rating, respect_rules_rating, review_text) VALUES
    ('a6000001-0000-4000-8000-000000000001', 'f0000003-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 5, 5, 5, 'Reem communicated clearly and left the suite in excellent condition.'),
    ('a6000002-0000-4000-8000-000000000002', 'f0000005-0000-4000-8000-000000000005', '33333333-3333-4333-8333-333333333333', '12121212-1212-4121-8121-121212121212', 5, 5, 5, 'Layan was thoughtful, communicative, and treated the villa with care.'),
    ('a6000003-0000-4000-8000-000000000003', 'f0000007-0000-4000-8000-000000000007', '33333333-3333-4333-8333-333333333333', '13131313-1313-4131-8131-131313131313', 5, 5, 4, 'Hessa communicated well and left the room neat after checkout.');

UPDATE guest_reviews
SET review_text = 'Reem communicated clearly and left the suite in excellent condition.'
WHERE id = 'a6000001-0000-4000-8000-000000000001';

INSERT OR IGNORE INTO system_notifications (id, user_id, owner_id, notification_type, content, is_seen) VALUES
    ('a7000001-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', NULL, 'booking_status', 'Your Riyadh Skyline Hotel reservation is confirmed.', FALSE),
    ('a7000002-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', NULL, 'trip_reminder', 'Your Riyadh stay begins on 10 September. Check your booking details before arrival.', FALSE),
    ('a7000003-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', NULL, 'review_response', 'Najd Hospitality replied to your Jeddah Corniche Suites review.', TRUE),
    ('a7000004-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', NULL, 'booking_created', 'Your AlUla Desert Villa reservation request was received.', TRUE),
    ('a7000005-0000-4000-8000-000000000005', NULL, '33333333-3333-4333-8333-333333333333', 'new_booking', 'New reservation from Reem for Riyadh Skyline Hotel.', FALSE),
    ('a7000006-0000-4000-8000-000000000006', NULL, '33333333-3333-4333-8333-333333333333', 'new_review', 'A new 5-heart review was added to Jeddah Corniche Suites.', FALSE),
    ('a7000007-0000-4000-8000-000000000007', NULL, '33333333-3333-4333-8333-333333333333', 'booking_status', 'The AlUla Desert Villa reservation is waiting for confirmation.', TRUE),
    ('a7000008-0000-4000-8000-000000000008', '12121212-1212-4121-8121-121212121212', NULL, 'booking_status', 'Your Abha Cloud Retreat reservation is confirmed.', FALSE),
    ('a7000009-0000-4000-8000-000000000009', '12121212-1212-4121-8121-121212121212', NULL, 'review_response', 'Najd Hospitality replied to your AlUla Desert Villa review.', TRUE),
    ('a7000010-0000-4000-8000-000000000010', '13131313-1313-4131-8131-131313131313', NULL, 'booking_created', 'Your Red Sea Family Resort reservation request was received.', FALSE),
    ('a7000011-0000-4000-8000-000000000011', '13131313-1313-4131-8131-131313131313', NULL, 'trip_history', 'Your Riyadh Skyline Hotel stay is complete.', TRUE),
    ('a7000012-0000-4000-8000-000000000012', NULL, '33333333-3333-4333-8333-333333333333', 'new_booking', 'New reservation from Layan for Abha Cloud Retreat.', FALSE),
    ('a7000013-0000-4000-8000-000000000013', NULL, '33333333-3333-4333-8333-333333333333', 'new_booking', 'New reservation from Hessa for Red Sea Family Resort.', FALSE),
    ('a7000014-0000-4000-8000-000000000014', NULL, '33333333-3333-4333-8333-333333333333', 'new_review', 'A new 5-heart review was added to AlUla Desert Villa.', FALSE),
    ('a7000015-0000-4000-8000-000000000015', NULL, '33333333-3333-4333-8333-333333333333', 'new_review', 'A new 4-heart review was added to Riyadh Skyline Hotel.', TRUE),
    ('a7000016-0000-4000-8000-000000000016', '36c9050e-ddd3-4c3b-9731-9f487208bbc1', NULL, 'property_added', 'Najd Hospitality added Red Sea Family Resort.', FALSE),
    ('a7000017-0000-4000-8000-000000000017', '36c9050e-ddd3-4c3b-9731-9f487208bbc1', NULL, 'review_added', 'Layan added a 5-heart review to AlUla Desert Villa.', FALSE),
    ('a7000018-0000-4000-8000-000000000018', '36c9050e-ddd3-4c3b-9731-9f487208bbc1', NULL, 'review_added', 'Hessa added a 4-heart review to Riyadh Skyline Hotel.', TRUE);

UPDATE system_notifications
SET content = 'New reservation from Reem for Riyadh Skyline Hotel.'
WHERE id = 'a7000005-0000-4000-8000-000000000005';

UPDATE system_notifications
SET content = 'A new 5-heart review was added to Jeddah Corniche Suites.'
WHERE id = 'a7000006-0000-4000-8000-000000000006';

COMMIT;
