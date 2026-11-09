const express = require('express');
const { getDatabaseStatus } = require('../config/database');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BookHub API is running.',
    data: {
      environment: process.env.NODE_ENV || 'development',
      database: getDatabaseStatus(),
      timestamp: new Date().toISOString(),
    },
    requestId: req.requestId,
  });
});

module.exports = router;
