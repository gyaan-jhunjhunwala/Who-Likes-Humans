import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createGameStore } from './storage/Store';
import { GameEngine } from './game/GameEngine';
import { RoomManager } from './game/RoomManager';
import { registerSocketHandlers } from './sockets/socketHandlers';
import { OFFICIAL_DECKS } from '../../shared/decks';

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Initialize State Engine & Services
const store = createGameStore();
const gameEngine = new GameEngine(store);
const roomManager = new RoomManager(store, gameEngine);

// Root & REST API Endpoints
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Cards Against Humanity Server',
    status: 'online',
    message: '🃏 WebSocket & API Server is running smoothly!',
    endpoints: {
      health: '/api/health',
      rooms: '/api/rooms',
      decks: '/api/decks'
    }
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/rooms', async (req: Request, res: Response) => {
  const rooms = await store.getPublicRooms();
  res.json({ rooms });
});

app.get('/api/decks', (req: Request, res: Response) => {
  const decks = Object.entries(OFFICIAL_DECKS).map(([id, d]: [string, any]) => ({
    id,
    name: d.name,
    description: d.description,
    blackCardCount: d.blackCards.length,
    whiteCardCount: d.whiteCards.length,
  }));
  res.json({ decks });
});

// In-Memory Custom Decks Store (MongoDB-ready)
const customDecks: any[] = [];
app.post('/api/decks', (req: Request, res: Response) => {
  const { title, description, creatorName, blackCards, whiteCards } = req.body;
  if (!title || !blackCards || !whiteCards) {
    return res.status(400).json({ error: 'Missing required deck fields' });
  }

  const newDeck = {
    id: `custom-${Date.now()}`,
    title,
    description: description || '',
    creatorName: creatorName || 'Anonymous',
    blackCards,
    whiteCards,
  };

  customDecks.push(newDeck);
  res.status(201).json({ success: true, deck: newDeck });
});

// Socket.io Connection Entry
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket, store, roomManager, gameEngine);
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🃏 CAH Game Server running on port ${PORT}`);
  console.log(`🌐 WebSocket & API ready at http://localhost:${PORT}`);
  console.log(`=========================================`);
});
