const Environment = require('../models/Environment');
const Project = require('../models/Project');
const logger = require('../utils/logger');

exports.getAllEnvironments = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const environments = await Environment.findAll({ projectId });
    res.status(200).json({ data: environments });
  } catch (error) {
    next(error);
  }
};

exports.getEnvironmentById = async (req, res, next) => {
  try {
    const environment = await Environment.findById(req.params.id);
    if (!environment) {
      return res.status(404).json({ error: 'Environment not found.' });
    }
    res.status(200).json({ data: environment });
  } catch (error) {
    next(error);
  }
};

exports.createEnvironment = async (req, res, next) => {
  try {
    const { project_id, name, status, current_version, application_url } = req.body;

    if (!project_id || !name) {
      return res.status(400).json({ error: 'project_id and name are required.' });
    }

    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Referenced project does not exist.' });
    }

    const environment = await Environment.create({
      project_id,
      name: name.trim(),
      status: status || 'Healthy',
      current_version: current_version || 'v1.0.0',
      application_url: application_url || `https://${name.toLowerCase()}.${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.local`
    });

    logger.info(`Environment created: ${environment.name} for Project #${project_id}`);
    res.status(201).json({ message: 'Environment created successfully', data: environment });
  } catch (error) {
    next(error);
  }
};

exports.updateEnvironment = async (req, res, next) => {
  try {
    const { name, status, current_version, application_url } = req.body;
    const updated = await Environment.update(req.params.id, {
      name,
      status,
      current_version,
      application_url
    });

    if (!updated) {
      return res.status(404).json({ error: 'Environment not found or update failed.' });
    }

    logger.info(`Environment updated: ${updated.name} (ID: ${updated.id})`);
    res.status(200).json({ message: 'Environment updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

