-- Creates (or promotes) the platform admin account: admin@myownshop.com
--
-- HOW TO USE:
--   1. Replace CHANGE_ME_TO_YOUR_PASSWORD below with the real password
--      you want for the admin account.
--   2. Paste this whole file into pgAdmin4's Query Tool (connected to the
--      "My Own Shop" database) and run it.
--
-- Your password is hashed with bcrypt (cost factor 12 — same as the app
-- uses for every other user) directly inside Postgres via the pgcrypto
-- extension. It is never sent anywhere else and is not stored in plain
-- text anywhere, including in this file after you run it.
--
-- Safe to re-run: if admin@myownshop.com already exists (e.g. you already
-- registered it as a normal user through the website), this promotes it
-- to admin and resets its password to whatever you put below, instead of
-- creating a duplicate.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
VALUES (
    'Admin',
    'admin@myownshop.com',
    '9999999999',                                          -- change this if it collides with a real user's phone number
    crypt('CHANGE_ME_TO_YOUR_PASSWORD', gen_salt('bf', 12)),
    'ADMIN',
    TRUE
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = 'ADMIN',
    is_active = TRUE;

-- Verify it worked:
SELECT id, full_name, email, phone, role, is_active FROM users WHERE email = 'admin@myownshop.com';
