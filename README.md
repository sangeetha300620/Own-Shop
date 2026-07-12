# MY OWN SHOP

A marketplace for **commercial shops only** — never homes. Every listing is tagged
`RENT`, `LEASE`, or `SALE`, and the whole site (home page, search, filters) pivots
around those three categories. Any registered user can list their own shop
(self-serve, like a marketplace) and browse/inquire about others.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS — `frontend/`
- **Backend**: FastAPI + SQLAlchemy 2.0 + Alembic + JWT auth — `backend/`
- **DB**: PostgreSQL, database `My Own Shop` on `localhost:5432`

## Running it

**Backend** (from `backend/`):

```
venv\Scripts\python.exe -m uvicorn app.main:app --port 8001
```

API docs at `http://localhost:8001/docs`.

**Frontend** (from `frontend/`):

```
npm run dev
```

Opens at `http://localhost:3000` normally.

> **Note on ports**: On this machine, ports `8000` and `3000` are already held by
> unrelated processes, so during development the backend ran on `8001` and the
> frontend on `3001` instead. Next.js/Uvicorn auto-pick the next free port and
> print it on startup — just check the terminal output. If you free up 8000/3000
> (or always want fixed ports), update `frontend/.env.local`
> (`NEXT_PUBLIC_API_URL`) and `backend/.env` (`CORS_ORIGINS`) to match whatever
> ports you actually run on.

## Database

Schema is managed with Alembic migrations (`backend/alembic/versions/`) — the
initial migration already created every table in `My Own Shop`. To reapply on a
fresh database:

```
venv\Scripts\python.exe -m alembic upgrade head
venv\Scripts\python.exe seed.py   # seeds cities, localities, shop categories, amenities
```

## What's built (MVP)

- Auth: register/login (JWT), any user can list shops
- Shop listings: full CRUD, image upload, amenities, rich commercial-specific
  fields (frontage width, floor, furnishing, lease duration, etc.)
- Search/filter by listing type (Rent/Lease/Sale), city, locality, category,
  price range, area range, keyword
- Inquiries: buyers/tenants message shop owners; owners see inquiries in their
  dashboard
- Owner dashboard: manage own listings, view leads

## Not built yet (by design — see plan)

Billing/subscriptions were explicitly deferred to a later phase; the schema and
auth model are structured so they can be added without a rework (e.g. a future
`subscriptions` table keyed to `users`, gating listing counts).
