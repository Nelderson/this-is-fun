# This Is Fun

A real-time multiplayer party game inspired by Cards Against Humanity and Apples to Apples. One player draws a prompt card, everyone else plays their funniest response, and the selector picks a winner. First to the target score wins.

## How It Works

- Players join a room using a 4-letter code
- Each player gets 7 white cards
- Every round, one player is the **selector** who draws a black (prompt) card
- Everyone else picks a white card from their hand to play
- The selector sees cards flip over one by one, picks their favorite, and awards a point
- First to 5 points wins (configurable)

## Features

- **Real-time multiplayer** via WebSockets (Socket.IO)
- **Custom decks** — upload your own cards as a JSON file
- **Card flip animations** with staggered reveal
- **Live submission tracking** — the selector sees face-down cards arrive in real time
- **Built-in default deck** — works out of the box, no card file needed
- **Mobile friendly**

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Socket.IO
- **Deployment:** Docker / Railway

---

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/this-is-fun.git
cd this-is-fun
npm run install:all
```

### Run

```bash
npm run dev
```

This starts both the server (port 3001) and client (port 5173) concurrently. Open `http://localhost:5173` in your browser.

You'll need at least 3 players to start a game. Open multiple browser tabs or have friends join from their devices on the same network.

---

## Deployment

### Option 1: Railway (Recommended)

The easiest way to get this running on the internet. Costs ~$5/month or less for a party game with occasional use.

1. Clone this repo to your account, or download and push to a new repo
3. Sign up at [railway.com](https://railway.com) with your GitHub account
4. Click **New Project** → **Deploy from GitHub Repo** → select this repo
5. Railway auto-detects the Dockerfile, builds, and deploys
6. Once deployed, go to **Settings** → **Networking** → **Generate Domain** to get your public URL

That's it. Railway handles HTTPS, port mapping, and auto-redeploys on every push to `main`.

**Custom domain:** In Railway's service settings, add your domain and point a CNAME record to the provided Railway hostname.

### Option 2: Docker

Build and run locally or on any server with Docker:

```bash
docker build -t this-is-fun .
docker run -p 3001:3001 this-is-fun
```

Open `http://localhost:3001`. The Node server serves both the API and the built React app.

### Option 3: Docker Compose

If you prefer compose:

```bash
docker compose up -d --build
```

The app will be available on port 8080.

---

## Custom Decks

The host can upload a custom deck in the lobby before starting the game. The file should be a JSON file with this structure:

```json
{
  "blackCards": [
    "Why is _ always so fun?",
    "_ + _ = disaster"
  ],
  "whiteCards": [
    "A rubber duck",
    "Existential dread",
    "Free WiFi"
  ]
}
```

**Requirements:**
- At least 5 black cards
- At least 20 white cards
- All card values must be strings
- Use `_` as a placeholder in black cards for where the white card answer goes

If no custom deck is uploaded, the game uses a built-in default deck.

---

## Project Structure

```
├── Dockerfile              # Production build (Railway / Docker)
├── docker-compose.yml      # Local Docker Compose setup
├── railway.json            # Railway deployment config
├── shared/
│   └── constants.js        # Shared enums and config
├── server/
│   ├── index.js            # Express + Socket.IO server
│   ├── gameManager.js      # Game state and logic
│   └── deck.js             # Card shuffling + default deck
├── client/
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── context/
│       │   └── GameContext.jsx
│       └── components/
│           ├── Home.jsx
│           ├── Lobby.jsx
│           ├── GameBoard.jsx
│           ├── GameOver.jsx
│           ├── FlipCard.jsx
│           └── CardImport.jsx
└── nginx/
    └── default.conf        # Nginx config (Docker Compose only)
```

---

## License

Do whatever you want with it. It's fun.