const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authenticateToken = require('../middleware/auth');

// Dashboard statistics
router.get('/stats/dashboard', authenticateToken, projectController.getDashboardStats);

// Project CRUD
router.get('/', authenticateToken, projectController.getAllProjects);
router.post('/', authenticateToken, projectController.createProject);
router.get('/:id', authenticateToken, projectController.getProjectById);
router.put('/:id', authenticateToken, projectController.updateProject);
router.delete('/:id', authenticateToken, projectController.deleteProject);

module.exports = router;

