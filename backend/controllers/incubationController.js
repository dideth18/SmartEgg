// backend/controllers/incubationController.js
const { query } = require('../config/database');

exports.createIncubation = async (req, res) => {
  try {
    const { name, numberOfEggs, settings } = req.body;

    const startDate = new Date();
    const expectedHatchDate = new Date();
    expectedHatchDate.setDate(startDate.getDate() + 21);

    const result = await query(
      `INSERT INTO incubations 
       (user_id, name, number_of_eggs, start_date, expected_hatch_date, temp_min, temp_max, humidity_min, humidity_max, turn_interval_hours) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        req.user.id,
        name || `Lote ${startDate.toLocaleDateString()}`,
        numberOfEggs,
        startDate,
        expectedHatchDate,
        settings?.tempMin || 37.0,
        settings?.tempMax || 37.8,
        settings?.humidityMin || 50,
        settings?.humidityMax || 60,
        settings?.turnIntervalHours || 4
      ]
    );

    await query('INSERT INTO actuators (incubation_id) VALUES ($1)', [result.rows[0].id]);

    res.status(201).json({
      success: true,
      message: 'Incubación creada exitosamente',
      data: { incubation: result.rows[0] }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear incubación',
      error: error.message 
    });
  }
};

exports.getIncubations = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM incubations WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: { incubations: result.rows }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener incubaciones',
      error: error.message 
    });
  }
};

exports.getIncubation = async (req, res) => {
  try {
    const incubationResult = await query(
      'SELECT * FROM incubations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (incubationResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Incubación no encontrada' 
      });
    }

    const sensorResult = await query(
      'SELECT * FROM sensor_data WHERE incubation_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [req.params.id]
    );

    res.json({
      success: true,
      data: { 
        incubation: incubationResult.rows[0],
        latestSensorData: sensorResult.rows[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener incubación',
      error: error.message 
    });
  }
};

exports.updateIncubation = async (req, res) => {
  try {
    const { name, status, notes, hatched_eggs, temp_min, temp_max, humidity_min, humidity_max } = req.body;

    const result = await query(
      `UPDATE incubations 
       SET name = COALESCE($1, name),
           status = COALESCE($2, status),
           notes = COALESCE($3, notes),
           hatched_eggs = COALESCE($4, hatched_eggs),
           temp_min = COALESCE($5, temp_min),
           temp_max = COALESCE($6, temp_max),
           humidity_min = COALESCE($7, humidity_min),
           humidity_max = COALESCE($8, humidity_max)
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [name, status, notes, hatched_eggs, temp_min, temp_max, humidity_min, humidity_max, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Incubación no encontrada' 
      });
    }

    res.json({
      success: true,
      message: 'Incubación actualizada exitosamente',
      data: { incubation: result.rows[0] }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar incubación',
      error: error.message 
    });
  }
};

exports.deleteIncubation = async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM incubations WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Incubación no encontrada' 
      });
    }

    res.json({
      success: true,
      message: 'Incubación eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar incubación',
      error: error.message 
    });
  }
};

exports.getIncubationStats = async (req, res) => {
  try {
    const statsResult = await query(
      'SELECT * FROM incubation_stats WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (statsResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Incubación no encontrada' 
      });
    }

    const sensorResult = await query(
      `SELECT * FROM sensor_data 
       WHERE incubation_id = $1 
       AND timestamp >= NOW() - INTERVAL '24 hours'
       ORDER BY timestamp ASC`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: { 
        stats: statsResult.rows[0],
        sensorData: sensorResult.rows
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
};