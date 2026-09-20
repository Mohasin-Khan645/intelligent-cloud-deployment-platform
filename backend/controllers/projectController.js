const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const Environment = require('../models/Environment');
const logger = require('../utils/logger');

exports.getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.findAll();
    res.status(200).json({ data: projects });
  } catch (error) {
    next(error);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.status(200).json({ data: project });
  } catch (error) {
    next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const { name, description, github_repository, github_branch } = req.body;

    if (!name || !github_repository) {
      return res.status(400).json({ error: 'Project name and GitHub repository are required.' });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      github_repository: github_repository.trim(),
      github_branch: github_branch ? github_branch.trim() : 'main'
    });

    logger.info(`Project created: ${project.name} (ID: ${project.id})`);
    res.status(201).json({ message: 'Project created successfully', data: project });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, github_repository, github_branch } = req.body;
    const updated = await Project.update(req.params.id, {
      name,
      description,
      github_repository,
      github_branch
    });

    if (!updated) {
      return res.status(404).json({ error: 'Project not found or update failed.' });
    }

    logger.info(`Project updated: ${updated.name} (ID: ${updated.id})`);
    res.status(200).json({ message: 'Project updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const success = await Project.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    logger.info(`Project deleted (ID: ${req.params.id})`);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [projects, deployments, environments] = await Promise.all([
      Project.findAll(),
      Deployment.findAll(),
      Environment.findAll()
    ]);

    const totalProjects = projects.length;
    const totalDeployments = deployments.length;
    const successfulDeployments = deployments.filter(d => d.status === 'SUCCESS').length;
    const failedDeployments = deployments.filter(d => d.status === 'FAILED').length;
    const activeEnvironments = environments.filter(e => e.status === 'Healthy').length;

    const recentDeployments = deployments.slice(0, 5);

    res.status(200).json({
      data: {
        totalProjects,
        totalDeployments,
        successfulDeployments,
        failedDeployments,
        activeEnvironments,
        recentDeployments
      }
    });
  } catch (error) {
    next(error);
  }
};

