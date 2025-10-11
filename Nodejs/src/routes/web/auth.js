const express = require('express');
const authController = require('../../controller/web/authController');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// Get current user session
router.get('/session', auth, authController.getSession);

module.exports = router;
