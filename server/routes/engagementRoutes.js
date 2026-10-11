const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { requireMatchmaker } = require('../middlewares/requireMatchmaker');
const { listCandidates, requestEngagement, approveEngagement } = require('../controllers/engagementController');

const router = express.Router();

router.post('/approve', approveEngagement);
router.get('/candidates', authMiddleware, requireMatchmaker, listCandidates);
router.post('/request', authMiddleware, requireMatchmaker, requestEngagement);

module.exports = router;
