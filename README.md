# Karibu Groceries (KGL) Management System

This repository contains a simple wholesale produce distribution management
application split into two folders:

- **Backend/** – Node.js/Express REST API with MongoDB (Mongoose).
- **Frontend/** – static HTML/CSS/JavaScript pages used as the client.

The server serves the static front‑end and handles all business logic; the
HTML pages call the API under `/api` for authentication, sales, stock,
reports, etc.

---

## Prerequisites

- **Node.js** (v18 or later – the package.json uses v25 but anything recent
  works).
- **npm** (bundled with Node).
- **MongoDB** running locally or reachable via network.
- (Optional) a shell/PowerShell environment for running the npm scripts.


## Getting started

1. **Clone / open the workspace**. You should see the top‑level
   `package.json`, `Backend/` and `Frontend/` directories.

2. **Install dependencies** (this will install the server packages inside
   `Backend/`):

   ```powershell
   cd C:\Users\Hana\Desktop\PROJECT   # adjust path as needed
   npm install
   ```

3. **Configure environment variables**. Create a `.env` file at the project
   root (same directory as `server.js`) with any of the following values:

   ```env
   MONGO_URI=mongodb://localhost:27017/karibu-project
   JWT_SECRET=<your-secret>
   PORT=3000
   ```

   Defaults are used when variables are omitted.

4. **Seed the database** with the default user accounts (director, two
   managers, two sales agents):

   ```powershell
   npm run seed:users    # runs Backend/scripts/seed.js
   ```

   The credentials printed at the end of the script are the ones you can use
   to log in.

5. **Start the application**. One of the following commands will boot the
   backend server and automatically serve the frontend files:

   ```powershell
   npm run dev           # runs the backend from the workspace root
   # or
   npm start             # alias for npm run backend
   # or (directly inside Backend)
   # cd Backend && npm start
   ```

   The server listens on the port from `.env` (default 3000). You should see
   a console message `KGL Server is running on port …` when it’s ready.

6. **Open the browser** and navigate to:

   - `http://localhost:3000/` or `http://localhost:3000/login.html` &ndash;
     the common login page.
   - After signing in, you will be redirected to the appropriate dashboard
     depending on your role (`/html/Directors-dashboard.html`,
     `/html/managers-dashboard.html`, or `/html/sales-agent.html`).


## Project layout

```
PROJECT/
├── Backend/               # API server code (Node/Express/Mongoose)
│   ├── config/            # MongoDB connection helper
│   ├── controllers/       # business logic (reports, etc.)
│   ├── middleware/        # auth & validation helpers
│   ├── models/            # Mongoose schemas (User, Stock, Sale, ...)
│   ├── routes/            # Express routers per feature
│   ├── scripts/           # CLI tools (seed.js)
│   ├── server.js          # app entry point
│   └── README.md          # backend-specific documentation
├── Frontend/              # static client files
│   ├── public/            # served at web root (login page, CSS, JS)
│   ├── html/              # dashboards for each role
│   └── README.md          # frontend-specific notes
├── package.json           # root scripts and metadata
└── README.md              # this document
```


## Scripts

The root `package.json` exposes a few convenient npm scripts:

- `npm run backend` – start the backend server (`npm start --prefix backend`)
- `npm run dev` – same as above (used during development)
- `npm run seed:users` – run the user seeding script

You can also run scripts directly inside `Backend/` if you prefer.


## Using the application

1. Visit the login page and enter one of the seeded usernames/passwords.
2. After authentication the frontend will redirect based on your role:
   - Director → director dashboard
   - Manager → manager dashboard
   - Sales Agent → sales‑agent interface
3. The UI pages call the backend API (`/api/...`) to fetch and manipulate
   data. See `Backend/README.md` for a complete API reference.


## Notes & tips

- The frontend is vanilla HTML/JS; no build step is required. Just edit the
  files and reload the page.
- All static content lives in `Frontend/public` (login page, shared assets)
  and `Frontend/html` (role‑specific dashboards).
- Passwords are hashed with bcrypt. JWTs are used for secure API access.
- The server currently logs to the console; `server.log` was used during
  development but is not strictly necessary and may be removed.
- There is no automated test suite yet; adding tests would be a good
  next step.


## Troubleshooting

- **500 errors or missing files** &ndash; ensure the backend is running and the
  correct working directory is used when starting it. Static routes expect the
  `Frontend` folder to be at the project root.
- **Port conflicts** &ndash; change `PORT` in `.env` or set `process.env.PORT`
  before starting the server.
- **MongoDB connection issues** &ndash; check `MONGO_URI` and verify the
  database is running.
- **Login not redirecting** &ndash; open the browser’s developer console and
  inspect network requests; the login page’s JS (`/login.js`) handles the
  redirect logic.


## License

ISC (same as package.json). Feel free to adapt or extend this code for your
own projects.

---

This README provides a high‑level overview; more detailed API and frontend
notes live in the corresponding subdirectories.