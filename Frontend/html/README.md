# KGL Frontend

This folder contains the static client-side views used by the Karibu Groceries
wholesale management system.  It was built as a lightweight HTML/JavaScript/CSS
frontend that interacts with the backend API exposed under `/api`.

## Structure

- `Directors-dashboard.html` &ndash; full system overview for the director.
- `managers-dashboard.html` &ndash; branch‑level dashboard and tools for
  managers.
- `sales-agent.html` &ndash; simplified interface for sales agents to record
  cash/credit sales and payments.

> **Note:** there is also a small login page located at the workspace root
> under `public/login.html` which is served by the server and used by all
> roles.  The three HTML files above are referenced by the login logic when a
> user authenticates.

Each page contains embedded JavaScript functions (look for `fetchJson` and
`load…` helpers) that call the backend endpoints (e.g. `/api/sales/recent`).
Styling is provided by the shared stylesheets in `/styles` and icons via the
[Lucide](https://lucide.dev/) CDN.

## Running the frontend

1. **Start the backend** (see `Backend/README.md` for instructions). The
   Express server automatically serves all files in the `public` directory
   (which includes the login page) and also exposes the `kgl-frontend` folder
   so the dashboards can be reached at e.g. `http://localhost:3000/kgl-frontend/managers-dashboard.html`.

2. Open a browser and navigate to `http://localhost:3000/login.html` (or
   simply `http://localhost:3000/`).

3. Log in with one of the seeded credentials (e.g. `director` /
   `Director@123`, `manager.maganjo` / `Manager@123`, `agent.maganjo` /
   `Agent@123`). After authentication the script will redirect you to the
   appropriate dashboard page.

> Tip: you can serve the frontend files from any static HTTP server, but the
> pages require the backend API to be running and reachable at the same host
> or via CORS.

## Development notes

- The pages use vanilla JS and do not rely on any build tools or package
  managers.  Editing them only requires a text editor.
- Most of the interactive UI is implemented within `<script>` blocks toward
  the bottom of each HTML file.  Look for functions named `load…` or
  `render…` to modify behaviour.
- When adding new API calls, update `fetchJson` in each page as needed.
- Static assets (stylesheets, images, etc.) are shared with the root `public`
  directory.

---

This README is intentionally minimal; the backend documentation contains the
API reference required to understand how the frontend works.