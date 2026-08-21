# Space Escaper - Full Stack Retro Arcade Game

An immersive, full-stack browser-based vertical shooter arcade game. Avoid tumbling asteroids, fire lasers to clear paths, combat armored boss asteroids, collect power-ups, and log your high scores on the global galactic leaderboard!

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite) + HTML5 Canvas Rendering Engine
- **Backend**: Node.js + Express REST API
- **Database**: SQLite (persistent high score tables)
- **Audio**: Web Audio API Synth Engine (generates sound effects & background rhythms programmatically)
- **Styling**: Cyberpunk Glassmorphic CSS Theme with accessibility colorblind overrides

---

## 📂 Project Structure

```text
/space_escaper
├── /backend
│   ├── database.js     # SQLite schema, tables, and seeding
│   ├── package.json    # Express, sqlite3, cors, nodemon
│   └── server.js       # Express server API endpoints
├── /frontend
│   ├── index.html      # HTML entry point (SEO optimized)
│   ├── package.json    # React, Vite configuration
│   └── /src
│       ├── App.jsx            # State Router & global settings
│       ├── index.css          # Design system & cyberpunk styles
│       ├── main.jsx           # React DOM Entry
│       ├── /components
│       │   ├── GameCanvas.jsx    # Canvas component & mobile input listener
│       │   ├── HUD.jsx           # Live score, combo, active power-up trackers
│       │   ├── StartScreen.jsx   # Game launcher, difficulty switches
│       │   ├── GameOverScreen.jsx# End results, leaderboard fetcher
│       │   ├── Leaderboards.jsx  # Overall / difficulty lists & pilot lookup
│       │   └── Settings.jsx      # Audio sliders & accessibility toggles
│       └── /utils
│           ├── audio.js          # Procedural sound effects & ambient loops
│           └── gameEngine.js     # Collision grids, particles, entity lifecycles
└── README.md
```

---

## 🚀 How to Run Locally

### 1. Start the Backend Server

Enter the backend folder, install dependencies, and start the API:
```bash
cd backend
npm install
npm start
```
*Note: The server runs on **port 5000**. The database will initialize as `database.sqlite` in the `/backend` directory and automatically seed initial leaderboard scores.*

### 2. Start the Frontend Dev Client

In a new terminal, enter the frontend folder, install dependencies, and launch Vite:
```bash
cd frontend
npm install
npm run dev
```
*Note: The web client will run on **localhost** (usually `http://localhost:5173`).*

### 📱 Testing Mobile Responsiveness

1. **Browser Device Emulation**: Open Chrome DevTools (`F12`), toggle Device Toolbar (`Ctrl+Shift+M`), and test responsiveness across various templates (e.g., iPhone SE, Pixel 7, iPad Air) in both portrait and landscape.
2. **Local Network Access (Physical Phone)**: 
   - Ensure your phone and development computer are on the same Wi-Fi network.
   - Start the Vite dev server with the host flag to expose it:
     ```bash
     npm run dev -- --host
     ```
   - Connect to the URL listed under "Network" (e.g., `http://192.168.1.50:5173`) from your mobile device.
3. **PWA Installation**: When loaded on a mobile device or Chrome desktop, click the "Install" or "Add to Home Screen" prompt to install Space Escaper as a standalone PWA.

### 📱 Expo Go Mobile App (iOS / Android)

The `/mobile-app` directory contains an Expo-powered React Native wrapper.

#### 1. Why the WebView Wrapper Approach?
We selected **Approach A (WebView Wrapper)** utilizing `react-native-webview` for the native application instead of a full native rewrite (`react-native-game-engine`) for several critical reasons:
- **Zero Porting Latency**: Reuses 100% of the custom HTML5 Canvas collision vectors, parallax stars, combo displays, and CSS design system.
- **Synthesized Web Audio**: Allows the procedurally generated synth laser, blast, and tempo rhythms to play natively on the mobile client.
- **Integrated Haptics Bridge**: Uses a `postMessage` gateway to trigger native physical haptics (`expo-haptics`) in response to web collisions, powerup collections, and shield snaps.

#### 2. Known Limitations
- **Network Dependency**: The mobile wrapper relies on loading the web application. If the server is offline, it drops to a native offline screen rather than serving local offline web files.
- **Double Audio Warning**: If physical phone sound profiles are toggled, webview sound permissions must be authorized for browser-based sound loops.

#### 3. How to Run & Test
1. Install the **Expo Go** application on your physical device from the iOS App Store or Android Play Store.
2. In a terminal, enter the mobile-app folder, install dependencies, and start the packager:
   ```bash
   cd mobile-app
   npm install
   npx expo start --tunnel
   ```
3. Scan the terminal's **QR Code** using:
   - Android: The built-in scanner in the Expo Go app.
   - iOS: The default System Camera app (which prompts to redirect into Expo Go).
4. Configure the loading host inside `/mobile-app/App.js` under the `DEFAULT_GAME_URL` variable to point to your local machine IP or deployed backend.

---



## 🎮 Controls

### Desktop Keyboard
- **A / D** or **Left / Right Arrow**: Move Spaceship left/right
- **Spacebar**: Hold or tap to fire lasers
- **Shift** or **Double-tap movement keys**: Dash Boost (3s cooldown, awards brief speed burst and invulnerability)
- **Escape**: Pause / Resume game

### Mobile / Touch Devices
- On-screen touch layout displays automatically on touch-supported devices:
  - **◀️ / ▶️ Buttons**: Move ship
  - **🔥 Button**: Hold to fire lasers
  - **⚡ Button**: Tap to trigger Dash Boost (shows cooldown ring around ship)
  - **Pause Button**: Top right of HUD

---

## 🚀 Gameplay Features

1. **Procedural Web Audio**: Real-time synthesized zaps, noise-based explosions, metallic shield breaks, and a dynamic ambient background rhythm that speeds up as your score increases.
2. **Power-ups**:
   - 🛡️ **Shield (Green)**: Absorbs the next asteroid collision.
   - ⏱️ **Slow-Mo (Blue)**: Drops game speed by 50% for 5 seconds.
   - 🪙 **Double Points (Gold)**: Multiplies all points earned by 2x for 8 seconds.
   - 🧲 **Magnet (Purple)**: Draws falling powerups towards the ship.
3. **Enemy Variety**:
   - **Splitting Asteroid (Orange)**: Breaks into two faster, diagonal-moving shards on laser impact.
   - **Homing Asteroid (Red)**: Slowly shifts and tracks the ship's horizontal position as it falls.
   - **Mini-Boss (Armored)**: Spawns every 500 points. Features a boss health bar, demands multiple hits, shoots particles, and yields large scores.
4. **Combos & Near-Misses**: Dodge asteroids by narrow margins to increment your combo counter and earn escalating bonus points.
5. **Accessibility Options**: Toggle the **Accessibility Palette** in Settings to swap colors for high-contrast, colorblind-friendly alternatives.
6. **Robust Offline Support**: Plays perfectly fine if the backend is unreachable—automatically falls back to Saving and Fetching high scores using `localStorage`!

---

## 📡 REST API Documentation

- **POST `/api/players`**: Creates or registers a player by username.
  - Body: `{ "username": "string" }`
  - Response: `201 Created` / `200 OK` with player object.
- **POST `/api/scores`**: Submits a new score.
  - Body: `{ "username": "string", "score": 100, "difficulty": "easy|normal|hard" }`
  - Response: `201 Created` with score record.
- **GET `/api/leaderboard`**: Returns the top 10 scores overall, sorted descending.
- **GET `/api/leaderboard/:difficulty`**: Returns the top 10 scores filtered by difficulty (`easy`, `normal`, `hard`).
- **GET `/api/players/:username/scores`**: Returns a player's personal history and personal best score.
