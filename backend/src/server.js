/**
 * Serveur Express + Socket.IO pour WaveLength
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './socket/socketHandlers.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configuration CORS - Accepter plusieurs origines
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (Postman, mobile, etc.)
    if (!origin) return callback(null, true);

    // Autoriser si l'origin est dans la liste OU si elle se termine par .onrender.com
    if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Configuration Socket.IO avec CORS
const io = new Server(httpServer, {
  cors: corsOptions
});

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: '🎮 WaveLength Game Server',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Configuration des gestionnaires Socket.IO
setupSocketHandlers(io);

// Démarrage du serveur
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log('');
  console.log('🎮 ═══════════════════════════════════════');
  console.log('   WaveLength Game Server');
  console.log('🎮 ═══════════════════════════════════════');
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO: ws://localhost:${PORT}`);
  console.log(`🎯 Frontend autorisé: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log('');
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non gérée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
});
