// backend/routes/sensorRoutes.js
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { protect } = require('../middleware/auth');

router.post('/data', async (req, res) => {
  try {
    const { incubationId, temperature, humidity, gasLevel, waterLevel, apiKey } = req.body;

    if (apiKey !== process.env.ESP32_API_KEY) {
      return res.status(401).json({ 
        success: false, 
        message: 'API Key inválida' 
      });
    }

    const incubationCheck = await query('SELECT * FROM incubations WHERE id = $1', [incubationId]);
    
    if (incubationCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Incubación no encontrada' 
      });
    }

    const incubation = incubationCheck.rows[0];

    const result = await query(
      `INSERT INTO sensor_data (incubation_id, temperature, humidity, gas_level, water_level) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [incubationId, temperature, humidity, gasLevel || 0, waterLevel || 'Medio']
    );

    const sensorData = result.rows[0];

    const io = req.app.get('io');
    io.to(`incubation-${incubationId}`).emit('sensor-update', sensorData);

    const alerts = [];
    
    if (temperature < incubation.temp_min || temperature > incubation.temp_max) {
      const alertResult = await query(
        `INSERT INTO alerts (incubation_id, user_id, type, severity, title, message, value) 
         VALUES ($1, $2, 'temperature', 'warning', 'Temperatura fuera de rango', $3, $4)
         RETURNING *`,
        [incubationId, incubation.user_id, `Temperatura actual: ${temperature}°C`, temperature.toString()]
      );
      alerts.push(alertResult.rows[0]);
      io.to(`incubation-${incubationId}`).emit('new-alert', alertResult.rows[0]);
    }

    if (humidity < incubation.humidity_min || humidity > incubation.humidity_max) {
      const alertResult = await query(
        `INSERT INTO alerts (incubation_id, user_id, type, severity, title, message, value) 
         VALUES ($1, $2, 'humidity', 'warning', 'Humedad fuera de rango', $3, $4)
         RETURNING *`,
        [incubationId, incubation.user_id, `Humedad actual: ${humidity}%`, humidity.toString()]
      );
      alerts.push(alertResult.rows[0]);
      io.to(`incubation-${incubationId}`).emit('new-alert', alertResult.rows[0]);
    }

    if (waterLevel === 'Bajo') {
      const alertResult = await query(
        `INSERT INTO alerts (incubation_id, user_id, type, severity, title, message, value) 
         VALUES ($1, $2, 'water', 'critical', 'Nivel de agua bajo', 'Se recomienda rellenar el depósito', 'Bajo')
         RETURNING *`,
        [incubationId, incubation.user_id]
      );
      alerts.push(alertResult.rows[0]);
      io.to(`incubation-${incubationId}`).emit('new-alert', alertResult.rows[0]);
    }

    res.json({
      success: true,
      message: 'Datos de sensores guardados',
      data: { sensorData },
      alerts
    });
  } catch (error) {
    console.error('Error guardando datos de sensores:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al guardar datos de sensores',
      error: error.message 
    });
  }
});

router.get('/:incubationId/latest', protect, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM sensor_data WHERE incubation_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [req.params.incubationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No hay datos de sensores disponibles' 
      });
    }

    res.json({
      success: true,
      data: { sensorData: result.rows[0] }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener datos de sensores',
      error: error.message 
    });
  }
});

router.get('/:incubationId/history', protect, async (req, res) => {
  try {
    const { hours = 24 } = req.query;

    const result = await query(
      `SELECT * FROM sensor_data 
       WHERE incubation_id = $1 
       AND timestamp >= NOW() - INTERVAL '${parseInt(hours)} hours'
       ORDER BY timestamp ASC`,
      [req.params.incubationId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: { sensorData: result.rows }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener histórico',
      error: error.message 
    });
  }
});

module.exports = router;