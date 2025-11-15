// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { query } = require('../config/database');
const telegramBot = require('../utils/telegramBot');

// Importar rutas
const authRoutes = require('../routes/authRoutes');
const incubationRoutes = require('../routes/incubationRoutes');
const sensorRoutes = require('../routes/sensorRoutes');
const actuatorRoutes = require('../routes/actuatorRoutes');
const alertRoutes = require('../routes/alertRoutes');

// Middleware
const errorHandler = require('../middleware/errorHandler');

// Inicializar Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Hacer io disponible globalmente
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🐣 SmartEgg API - Sistema de Incubación Inteligente',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      auth: '/api/auth',
      incubations: '/api/incubations',
      sensors: '/api/sensors',
      actuators: '/api/actuators',
      alerts: '/api/alerts'
    },
    documentation: 'Proyecto SmartEgg - Sistema IoT de Incubación'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/incubations', incubationRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/actuators', actuatorRoutes);
app.use('/api/alerts', alertRoutes);

// Ruta de health check
app.get('/health', async (req, res) => {
  try {
    await query('SELECT NOW()');
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Manejador de errores (debe ir al final)
app.use(errorHandler);

// WebSocket - Manejo de conexiones en tiempo real
io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);

  socket.on('join-incubation', (incubationId) => {
    socket.join(`incubation-${incubationId}`);
    console.log(`📡 Cliente ${socket.id} unido a incubación: ${incubationId}`);
  });

  socket.on('leave-incubation', (incubationId) => {
    socket.leave(`incubation-${incubationId}`);
    console.log(`📡 Cliente ${socket.id} salió de incubación: ${incubationId}`);
  });

  socket.on('control-actuator', (data) => {
    console.log('🎮 Control manual de actuador:', data);
    io.to(`incubation-${data.incubationId}`).emit('actuator-updated', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🐣 SmartEgg Backend Server');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🚀 Servidor corriendo en puerto: ${PORT}`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 WebSocket activo en puerto: ${PORT}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log('═══════════════════════════════════════════════════════');
  
  // Inicializar Telegram Bot
  telegramBot.initBot();
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err.message);
  process.exit(1);
});

module.exports = { app, server, io };