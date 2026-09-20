const express = require('express');
const router = express.Router();
const environmentController = require('../controllers/environmentController');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, environmentController.getAllEnvironments);
router.post('/', authenticateToken, environmentController.createEnvironment);
router.get('/:id', authenticateToken, environmentController.getEnvironmentById);
router.put('/:id', authenticateToken, environmentController.updateEnvironment);

module.exports = router;

