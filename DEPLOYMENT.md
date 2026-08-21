# Space Escaper - Deployment Guide

This guide describes how to deploy the frontend React app and backend Node.js Express server to cloud platforms or a private Virtual Private Server (VPS).

---

## 🔑 Environment Variables Reference

### Backend Settings
- `PORT`: The port Express will bind to (defaults to `5000` in dev).
- `DATABASE_PATH`: Relative or absolute path where the SQLite database file will be stored (e.g. `database.sqlite` or `/var/data/db.sqlite`).
- `CORS_ORIGIN`: Configures authorized clients. List multiple comma-separated URLs or use `*` (e.g., `https://space-escaper.vercel.app,http://localhost:5173`).
- `NODE_ENV`: Set to `production` to activate static hosting fallbacks and suppress detailed error stack logs.

### Frontend Settings
- `VITE_API_URL`: Fully qualified path to the backend REST endpoint (e.g., `https://space-escaper-backend.onrender.com/api`). Defaults to `http://localhost:5000/api` in development.

---

## 🚀 Option A: Cloud Platform Deployment (Render, Railway, Vercel)

For a free-tier serverless or microservice setup, you can split the frontend and backend.

### 1. Deploy the Backend to Render or Railway
1. Push your repository to GitHub.
2. In **Render**, create a new **Web Service** pointing to the repository.
3. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
4. Set the **Environment Variables**:
   - `NODE_ENV` = `production`
   - `DATABASE_PATH` = `/opt/render/project/src/backend/database.sqlite` *(For Render persistent disks, set path outside volatile folders)*
   - `CORS_ORIGIN` = `https://your-frontend-domain.vercel.app`
5. Note the generated Web Service URL (e.g. `https://space-escaper-backend.onrender.com`).

### 2. Deploy the Frontend to Vercel or Netlify
1. Create a new project in **Vercel** pointing to the repository.
2. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set the **Environment Variables**:
   - `VITE_API_URL` = `https://your-backend-render-url.com/api`
4. Click **Deploy**. Vercel will build the React bundles and serve them from its global CDN with PWA service caching.

---

## 🐳 Option B: Unified Single-Server Deploy (VPS, Docker, etc.)

In production mode (`NODE_ENV=production`), the Express backend is designed to serve the static frontend dist folder automatically. This allows you to host both layers on a single VPS port.

### 1. Build the Frontend Package
On your development machine or inside your CI/CD runner, compile the frontend assets:
```bash
cd frontend
npm install
npm run build
```
This writes the final HTML/CSS/JS shell into `/frontend/dist`.

### 2. VPS Server Setup (PM2 + Nginx)
Assuming you are deploying on an Ubuntu server:

1. Clone your project onto the VPS and install backend dependencies:
   ```bash
   cd space_escaper/backend
   npm install --production
   ```
2. Make sure the `/frontend/dist` folder compiled in step 1 is present in the parent directory `/frontend`.
3. Install **PM2** globally to run Node in the background:
   ```bash
   sudo npm install -y pm2 -g
   pm2 start server.js --name "space-escaper"
   pm2 save
   pm2 startup
   ```
4. Set environment variables on the VPS shell (or add a `.env` file to `/backend`):
   ```text
   PORT=5000
   NODE_ENV=production
   DATABASE_PATH=database.sqlite
   CORS_ORIGIN=https://space-escaper.yourdomain.com
   ```
5. Configure **Nginx** as a reverse proxy. Create `/etc/nginx/sites-available/space-escaper`:
   ```nginx
   server {
       listen 80;
       server_name space-escaper.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
6. Enable the configuration and load Certbot for SSL (HTTPS compatibility):
   ```bash
   sudo ln -s /etc/nginx/sites-available/space-escaper /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d space-escaper.yourdomain.com
   ```

Now, navigating to `https://space-escaper.yourdomain.com` will serve the frontend client, and all AJAX requests will hit the local backend without mixed-content console warnings!

---

## 📱 Option C: Mobile App App Store Preview (Expo Go)

To deploy the React Native shell for testing or to build binaries:

### 1. Build Standalone App Previews
Expo uses the Application Services (EAS) CLI to compile native binaries (`.ipa` / `.apk`) in the cloud:
1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log in or create an account with Expo:
   ```bash
   eas login
   ```
3. Initialize the project credentials:
   ```bash
   cd mobile-app
   eas project:init
   ```
4. Build the application for testing (e.g. creating an Android `.apk` or an iOS simulator build):
   - **Android APK**:
     Configure a build profile inside `eas.json` with `android.buildType = "apk"`, and run:
     ```bash
     eas build --platform android --profile preview
     ```
   - **iOS Simulator**:
     ```bash
     eas build --platform ios --profile preview
     ```

### 2. Expo Go Dev Server (Tunneling)
When running the development packager locally and loading the code on a real device on a cellular network or a different Wi-Fi subnet:
1. Ensure the web server is running and accessible externally (or use your local IP in `mobile-app/App.js` `DEFAULT_GAME_URL`).
2. Run the start script with tunneling enabled:
   ```bash
   cd mobile-app
   npx expo start --tunnel
   ```
3. Scan the terminal's QR code in the Expo Go app. The tunnel acts as a reverse proxy, routing requests from your phone through Expo's secure proxy back to your development machine's port `8081` (and `5000` / `5173` via the WebView bridge).
