# KGL Backend

This directory holds the server-side implementation of the Karibu Groceries
management system.  The application is built with Node.js, Express and MongoDB
(Mongoose) and exposes a RESTful API consumed by the frontend.

## Requirements

- Node >= 18 (project `package.json` uses Node 25+ but anything recent should
  work)
- MongoDB running locally or accessible via a connection string
- Optional: `npm` scripts assume PowerShell/Unix shell; the server can also be
  started directly with `node server.js`.

## Setup

1. `cd Backend` from the workspace root (or simply operate from the root; the `package.json` is at the top level).
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file in the project root (same level as `server.js`) with
   any of the following variables:
   ```env
   MONGO_URI=mongodb://localhost:27017/karibu-project
   JWT_SECRET=your-very-secret-value
   PORT=3000
   ```
   Defaults are used when the variables are absent.
4. Seed the user database (creates director/manager/agent accounts):
   ```sh
   node scripts/seed.js
   # or npm run seed:users (uses the package script)
   ```
5. Start the server:
   ```sh
   npm start          # runs `node server.js`
   # or
   node server.js
   ```
   The server listens on the port specified above (default 3000) and prints a
   `KGL Server is running on port …` message.

The Express app automatically serves static files from the `public` directory
and the project root, which is where the frontend HTML/JS/CSS lives.

## Directory structure

```
Backend/
├── config/           # MongoDB connection helper
├── controllers/      # Business logic for reports, etc.
├── middleware/       # auth/validation helpers
├── models/           # Mongoose schemas (User, Sale, Produce, etc.)
├── routes/           # Express routers per feature area
├── scripts/          # CLI utilities (database seeding)
├── server.js         # application entry point
└── README.md         # this document
```

## API overview

All endpoints are prefixed with `/api` (configured in `server.js`).  JWT
bearer tokens must be included for protected routes; authentication is handled
with `auth.js` middleware.

### Authentication

- `POST /api/auth/register` &ndash; create new user (username must be unique)
- `POST /api/auth/login` &ndash; login and receive JWT
- `GET  /api/auth/me` &ndash; return profile of logged‑in user

### Users (Director only)

- `GET  /api/users/all` &ndash; list all users
- `POST /api/users/create` &ndash; add new user
- `DELETE /api/users/:id` &ndash; remove a user (cannot delete yourself)

### Stock

- `GET  /api/stock/all` &ndash; view stock across accessible branches
- `GET  /api/stock/branch/:branchName` &ndash; branch‑specific stock
- `GET  /api/stock/available` &ndash; in‑stock items for current branch
- `PUT  /api/stock/update-price` &ndash; manager updates selling price
- `PUT  /api/stock/upsert-stock` &ndash; manager adjusts quantity/price

### Procurement

- `POST /api/procurement/procurement` &ndash; record new produce purchase
- `GET  /api/procurement` &ndash; list procurement records
- `GET  /api/procurement/all` &ndash; alias of previous, used by frontend

### Sales

- `GET  /api/sales/recent` &ndash; recent cash sales (all branches for
  director)
- `POST /api/sales/cash` &ndash; record a cash sale (manager/agent only)

### Credit

- `GET  /api/credit/records` &ndash; credit sales history
- `POST /api/credit/add-credit` &ndash; create a new credit sale

### Payments

- `GET  /api/payments/history` &ndash; payment records (director sees all)
- `POST /api/payments/record` &ndash; record a payment and auto‑allocate
  it to open credit sales

### Reports (Director only)

- `GET /api/reports/totals` &ndash; aggregated business totals by branch and
  grand totals; used to populate the director dashboard

### Branch management

- `GET  /api/branch/all` &ndash; retrieve branch list
- `POST /api/branch/add` &ndash; create new branch
- `GET  /api/branch/:id` &ndash; fetch a single branch

## Authentication & Authorization

The `middleware/auth.js` file exports three helpers:

- `protect` &ndash; verifies JWT and attaches the user to `req.user`.
- `authorize(...roles)` &ndash; ensures the user has one of the given roles.
- `authorizeDirectorIdentity()` &ndash; special check restricting certain
  routes to the real director (Mr. Orban) by name/username.

Passwords are hashed with bcrypt.  Legacy plain-text passwords are still
supported for older records.

## Development & debugging

- Use the `checkLogin.js` script at project root to simulate login attempts
  and verify username normalization logic.
- The `debugRoutes.js` file (temporary) can be used to inspect registered
  Express routes.
- Mongoose models live in `models/` and include validation logic.

## Notes

- The backend currently has no automated tests; adding a test suite would be
  a logical next step.
- Logging is minimal; errors are sent as JSON responses, and certain modules
  print debug messages when loaded.
- The `seed.js` script wipes existing users with matching usernames, so use
  carefully in production-like environments.

---

With the backend running, you can exercise the system via the supplied
frontend pages or through tools like `curl`/Postman against the endpoints
listed above.