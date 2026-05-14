# The Chat App

A full-stack chat application built with React, Vite, Express, and JSON Web Tokens. The app lets users register, log in, browse members, update profiles, post statuses, and create direct or group conversations with text and attachment-style message payloads.

The project is split into a Vite frontend in `client/` and an Express API in `server/`. During local development, the Vite dev server proxies `/api` requests to the backend so the client can use the same relative API paths locally and in production.

## Features

- Email and password authentication with access and refresh tokens
- User registration, login, logout, and current-user lookup
- Member directory and public profile pages
- Direct and group conversations
- Message history, unread counts, and read tracking
- Status updates and profile editing
- Local JSON-file persistence for demo data

## Project Structure

```text
.
|-- api/                 # Vercel serverless entry point
|-- client/              # React + Vite frontend
|-- scripts/dev.mjs      # Starts client and server together
|-- server/              # Express API, auth, routes, and local data store
|-- package.json         # Root scripts for development and deployment
`-- vercel.json          # Vercel routing/build configuration
```

## Prerequisites

- Node.js 18 or newer
- npm

## Environment Variables

Create a `.env` file in the project root for local secrets. The app has development defaults, but setting your own values is recommended:

```env
PORT=3001
ACCESS_SECRET=replace_with_a_long_random_secret
REFRESH_SECRET=replace_with_another_long_random_secret
CORS_ORIGIN=http://localhost:5173
```

Optional:

```env
DATA_FILE=server/data.json
```

If `DATA_FILE` is not set, the server writes demo data to `server/data.json`.

## Install

Install dependencies for the root project, client, and server:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

## Run Locally

Start both the backend API and frontend dev server from the project root:

```bash
npm run dev
```

Then open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

The backend API runs on:

```text
http://localhost:3001
```

You can confirm the API is running at:

```text
http://localhost:3001/api/health
```

## Useful Commands

```bash
npm run dev          # Run client and server together
npm run dev:client   # Run only the Vite frontend
npm run dev:server   # Run only the Express backend with nodemon
npm run build        # Install client dependencies and build the frontend
npm run preview      # Preview the built frontend
npm start            # Start the Express server
```

## Production Notes

The project includes `api/index.js` and `vercel.json` for Vercel deployment. The Vercel build runs the client build, serves the built frontend, and routes API requests to the Express app.

Set production values for `ACCESS_SECRET`, `REFRESH_SECRET`, and any allowed `CORS_ORIGIN` values in the deployment environment. Do not rely on the development JWT defaults outside local demos.

## License

This project is proprietary and intended solely for portfolio and recruiter evaluation purposes.

Unauthorized reproduction, redistribution, sublicensing, resale, or production use is prohibited.
