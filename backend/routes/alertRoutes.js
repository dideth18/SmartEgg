// backend/routes/alertRoutes.js
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { read, severity, incubationId } = req.query;
    
    let queryText = 'SELECT * FROM alerts WHERE user_id = $1';
    let params = [req.user.id];
    let paramCount = 1;
    
    if (read !== undefined) {
      paramCount++;
      queryText += ` AND read = $${paramCount}`;
      params.push(read === 'true');
    }
    
    if (severity) {
      paramCount++;
      queryText += ` AND severity = $${paramCount}`;
      params.push(severity);
    }
    
    if (incubationId) {
      paramCount++;
      queryText += ` AND incubation_id = $${paramCount}`;
      params.push(incubationId);
    }
    
    queryText += ' ORDER BY created_at DESC LIMIT 50';

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: { alerts: result.rows }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener alertas',
      error: error.message 
    });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const result = await query(
      'UPDATE alerts SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Alerta no encontrada' 
      });
    }

    res.json({
      success: true,
      message: 'Alerta marcada como leída',
      data: { alert: result.rows[0] }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar alerta',
      error: error.message 
    });
  }
});

router.put('/read-all', protect, async (req, res) => {
  try {
    const { incubationId } = req.body;
    
    let queryText = 'UPDATE alerts SET read = true WHERE user_id = $1';
    let params = [req.user.id];
    
    if (incubationId) {
      queryText += ' AND incubation_id = $2';
      params.push(incubationId);
    }

    const result = await query(queryText, params);

    res.json({
      success: true,
      message: 'Todas las alertas marcadas como leídas',
      data: { count: result.rowCount }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar alertas',
      error: error.message 
    });
  }
});

module.exports = router;