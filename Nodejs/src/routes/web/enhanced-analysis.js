const express = require('express');
const { body } = require('express-validator');
const enhancedAnalysisController = require('../../controller/web/enhancedAnalysisController');

const router = express.Router();

// Enhanced Fathom Service - Advanced transcript extraction and analysis
router.post('/fathom', [
  body('url').isURL().withMessage('Valid Fathom URL is required'),
  body('options').optional().isObject().withMessage('Options must be an object')
], enhancedAnalysisController.analyzeFathom);

// Get enhanced analysis by ID
router.get('/:id', enhancedAnalysisController.getAnalysisById);

// Get all enhanced analyses
router.get('/', enhancedAnalysisController.getAllAnalyses);

// Delete enhanced analysis
router.delete('/:id', enhancedAnalysisController.deleteAnalysis);

// Get enhanced analysis statistics
router.get('/stats/overview', enhancedAnalysisController.getStatistics);

module.exports = router;

