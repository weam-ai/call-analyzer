const express = require('express');
const { body } = require('express-validator');
const enhancedAnalysisController = require('../../controller/web/enhancedAnalysisController');

const router = express.Router();

// Enhanced Fathom analysis
router.post('/fathom', [
  body('url').isURL().withMessage('Valid Fathom URL is required'),
  body('options').optional().isObject().withMessage('Options must be an object')
], enhancedAnalysisController.analyzeFathom);

// Get statistics (must be before /:id)
router.get('/stats/overview', enhancedAnalysisController.getStatistics);

// Get all analyses
router.get('/', enhancedAnalysisController.getAllAnalyses);

// Get analysis by ID
router.get('/:id', enhancedAnalysisController.getAnalysisById);

// Delete analysis
router.delete('/:id', enhancedAnalysisController.deleteAnalysis);

module.exports = router;

