const express = require('express');
const webRoutes = require('./web');
const commonController = require('../controller/commonController');

const router = express.Router();

// Health check endpoint
router.get('/health', commonController.healthCheck);

// Mount web routes
router.use('/', webRoutes);

module.exports = router;

