// backend/routes/incubationRoutes.js
const express = require('express');
const router = express.Router();
const {
  createIncubation,
  getIncubations,
  getIncubation,
  updateIncubation,
  deleteIncubation,
  getIncubationStats
} = require('../controllers/incubationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getIncubations)
  .post(createIncubation);

router.route('/:id')
  .get(getIncubation)
  .put(updateIncubation)
  .delete(deleteIncubation);

router.get('/:id/stats', getIncubationStats);

module.exports = router;