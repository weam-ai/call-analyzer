const express = require('express');
const authRoutes = require('./auth');
const analysisRoutes = require('./analysis');
const enhancedAnalysisRoutes = require('./enhanced-analysis');
const comprehensiveAnalysisRoutes = require('./comprehensive-analysis');
const audioAnalysisRoutes = require('./audioAnalysis');

const router = express.Router();

// Mount web routes
router.use('/auth', authRoutes);
router.use('/analysis', analysisRoutes);
router.use('/enhanced', enhancedAnalysisRoutes);
router.use('/comprehensive', comprehensiveAnalysisRoutes);
router.use('/audio-analysis', audioAnalysisRoutes);

module.exports = router;

