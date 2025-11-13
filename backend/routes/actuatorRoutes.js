// backend/routes/actuatorRoutes.js
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { protect } = require('../middleware/auth');

router.get('/:incubationId', protect, async (req, res) => {
  try {
    let result = await query(
      'SELECT * FROM actuators WHERE incubation_id = $1',
      [req.params.incubationId]
    );
    
    if (result.rows.length === 0) {
      result = await query(
        'INSERT INTO actuators (incubation_id) VALUES ($1) RETURNING *',
        [req.params.incubationId]
      );
    }

    res.json({
      success: true,
      data: { actuator: result.rows[0] }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener actuadores',
      error: error.message 
    });
  }
});

router.put('/:incubationId', protect, async (req, res) => {
  try {
    const { heater_active, humidifier_active, ventilation_active, manual_mode } = req.body;

    const result = await query(
      `UPDATE actuators 
       SET heater_active = COALESCE($1, heater_active),
           humidifier_active = COALESCE($2, humidifier_active),
           ventilation_active = COALESCE($3, ventilation_active),
           manual_mode = COALESCE($4, manual_mode),
           timestamp = CURRENT_TIMESTAMP
       WHERE incubation_id = $5
       RETURNING *`,
      [heater_active, humidifier_active, ventilation_active, manual_mode, req.params.incubationId]
    );

    if (result.rows.length === 0) {
      const createResult = await query(
        `INSERT INTO actuators (incubation_id, heater_active, humidifier_active, ventilation_active, manual_mode) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.params.incubationId, heater_active, humidifier_active, ventilation_active, manual_mode]
      );
      
      const actuator = createResult.rows[0];
      const io = req.app.get('io');
      io.to(`incubation-${req.params.incubationId}`).emit('actuator-update', actuator);
      
      return res.json({
        success: true,
        message: 'Actuadores creados y actualizados',
        data: { actuator }
      });
    }

    const actuator = result.rows[0];
    const io = req.app.get('io');
    io.to(`incubation-${req.params.incubationId}`).emit('actuator-update', actuator);

    res.json({
      success: true,
      message: 'Actuadores actualizados',
      data: { actuator }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar actuadores',
      error: error.message 
    });
  }
});

router.post('/:incubationId/turn', async (req, res) => {
  try {
    const result = await query(
      `UPDATE actuators 
       SET last_egg_turn = CURRENT_TIMESTAMP,
           egg_turn_count = egg_turn_count + 1
       WHERE incubation_id = $1
       RETURNING *`,
      [req.params.incubationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Actuador no encontrado' 
      });
    }

    const actuator = result.rows[0];
    const io = req.app.get('io');
    io.to(`incubation-${req.params.incubationId}`).emit('egg-turned', { 
      timestamp: actuator.last_egg_turn,
      count: actuator.egg_turn_count
    });

    res.json({
      success: true,
      message: 'Giro de huevos registrado',
      data: { actuator }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar giro',
      error: error.message 
    });
  }
});

module.exports = router;