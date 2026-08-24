# 🃏 Cards Against Humanity - Real-Time Multiplayer Web Game

A sleek, real-time multiplayer web application inspired by *Cards Against Humanity*. Built with **Next.js (App Router)**, **Tailwind CSS**, **Zustand**, **Node.js (Express)**, **Socket.io**, and hybrid **Redis / MongoDB** state engine.

---

## ✨ Features

- **🎮 Lobby & Room System**:
  - Instant private room creation with 6-character room codes.
  - Shareable 1-click invite link (`/room/[code]`).
  - Host controls: custom score limits (5, 7, 10, 15), customizable selection timers, active card pack toggles, player kick privilege.
- **⚡ Sub-50ms Real-Time Gameplay**:
  - Authoritative game state machine syncing round stages instantly via WebSocket.
  - Rotating **Card Czar** designation every round.
  - Dealing and replenishing 10 white cards per player hand.
  - Multi-card pick support (Pick 1, Pick 2, Pick 3 prompts).
- **🔒 Anti-Cheat Server Architecture**:
  - Submissions are anonymized and cryptographically shuffled on the server using Fisher-Yates with `crypto.randomInt` before broadcasting to the Card Czar.
- **🎭 Card Czar Reveal & Judging Station**:
  - Czar flips cards one-by-one with real-time 3D flip animation synced to all players.
  - Czar selects the winning card combination.
  - Celebratory confetti effects and podium screen when score limit is reached.
- **🔊 Web Audio Synthesizer**:
  - Zero-asset sound effects (card selection, flip swooshes, timer countdown ticks, victory fanfare).
  - Audio mute/unmute toggle in navbar.
- **💬 In-Game Chat & Reactions**:
  - Collapsible live drawer for player banter.
- **📦 Deck Library & Custom Deck Builder**:
  - Preloaded with **Main Deck (Classic)**, **Tech & Dev Pack**, and **Absurd & Chaos Pack**.
  - Custom Deck Builder with JSON export/import.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Zustand, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express, Socket.io, TypeScript |
| **State & Storage** | In-Memory Engine (Zero-Config Default) + Redis (ioredis) + MongoDB (Mongoose ready) |
| **Monorepo** | Shared TypeScript contracts (`shared/types.ts`, `shared/events.ts`, `shared/decks.ts`) |

---

## 🚀 Quick Start Guide

### 1. Install Dependencies

```bash
# In project root:
npm install

# In server directory:
cd server && npm install

# In client directory:
cd ../client && npm install
```

### 2. Run the Application

From the root directory, start both the backend server and frontend client concurrently:

```bash
npm run dev
```

- **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
- **Backend API & WebSocket Server**: [http://localhost:4000](http://localhost:4000)

---

## 📂 Project Structure

```text
cards-against-humanity/
├── client/                     # Next.js (App Router), Tailwind CSS, Zustand
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # Landing page & Room creation / join
│   │   │   ├── room/[code]/
│   │   │   │   └── page.tsx    # Live Game Room (Lobby & Game Table)
│   │   │   └── decks/
│   │   │       └── page.tsx    # Custom Deck Builder & Browser
│   │   ├── components/
│   │   │   ├── cards/          # BlackCard, WhiteCard, CardHand
│   │   │   ├── game/           # TableArea, Scoreboard, RoundSummaryModal, GameOverModal
│   │   │   ├── lobby/          # LobbyView
│   │   │   ├── chat/           # InGameChat
│   │   │   └── ui/             # Navbar
│   │   ├── hooks/              # useSound (Web Audio API)
│   │   └── stores/             # gameStore.ts (Zustand)
│   ├── package.json
│   └── tailwind.config.js
│
├── server/                     # Node.js, Express, Socket.io
│   ├── src/
│   │   ├── game/               # GameEngine (CAH state machine), RoomManager
│   │   ├── sockets/            # Socket.io event registry
│   │   ├── storage/            # Dual Memory / Redis storage adapter
│   │   └── server.ts           # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                     # Shared TypeScript interfaces & card decks
│   ├── types.ts                # Player, Room, Card, Submission interfaces
│   ├── events.ts               # Socket.io payload schemas
│   ├── decks.ts                # Curated card packs (Base, Geek, Absurd)
│   └── index.ts
│
├── package.json                # Monorepo root script runner
└── README.md
```

---

## 🧪 Testing Multiplayer Locally

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Enter nickname **"Player 1 (Host)"** and click **Create Private Room**.
3. Copy the 6-character room code.
4. Open a **new Incognito window** (or another browser) and visit [http://localhost:3000](http://localhost:3000).
5. Enter nickname **"Player 2"**, paste the room code, and join.
6. Return to the Host tab and click **START GAME**!
7. Experience full round cycles: deal, submit white card, Czar reveals & awards point, round reset!
