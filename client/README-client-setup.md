# Tuniv Client Setup Guide

This guide explains how to run the Tuniv client locally and build it for GitHub Pages deployment.

## Running Locally

### Prerequisites
- Node.js (v18 or later recommended)
- npm

### Development Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure the API backend:
   - Copy `.env.example` to `.env` and edit if needed
   - By default, the client connects to the production backend at `https://tuniv-backend-production.up.railway.app`
   - To connect to a local backend, set:
     ```
     VITE_API_BASE=http://localhost:8000
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:5176`

## Building for GitHub Pages

The client is configured to deploy to GitHub Pages under the `/tuniv/` base path.

### Build Process

1. Ensure dependencies are installed:
   ```bash
   npm install
   ```

2. Build the production bundle:
   ```bash
   npm run build
   ```
   
   The build output will be in the `dist` directory.

3. (Optional) Preview the production build:
   ```bash
   npm run preview
   ```

### Deploy to GitHub Pages

To deploy to GitHub Pages:
```bash
npm run deploy
```

This will build the app and push the `dist` folder to the `gh-pages` branch.

## Environment Variables

- `VITE_API_BASE`: The base URL for the backend API
  - Default: `https://tuniv-backend-production.up.railway.app`
  - Set this in a `.env` file (not committed to git)
  - Example: `VITE_API_BASE=http://localhost:8000`

## Notes

- The client uses Vite for development and building
- All API calls are made through the centralized `api()` function in `src/lib/api.ts`
- During development, API requests are proxied through Vite's dev server to avoid CORS issues
- In production builds, `VITE_API_BASE` is embedded at build time
