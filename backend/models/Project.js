const db = require('../config/database');

class Project {
  static async findAll() {
    try {
      const query = `
        SELECT 
          p.id, 
          p.name, 
          p.description, 
          p.github_repository, 
          p.github_branch, 
          p.created_at, 
          p.updated_at,
          (
            SELECT d.status 
            FROM deployments d 
            WHERE d.project_id = p.id 
            ORDER BY d.started_at DESC 
            LIMIT 1
          ) as last_deployment_status,
          (
            SELECT d.version 
            FROM deployments d 
            WHERE d.project_id = p.id 
            ORDER BY d.started_at DESC 
            LIMIT 1
          ) as current_version,
          (
            SELECT d.started_at 
            FROM deployments d 
            WHERE d.project_id = p.id 
            ORDER BY d.started_at DESC 
            LIMIT 1
          ) as last_deployed_at
        FROM projects p
        ORDER BY p.created_at DESC
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (err) {
      return db.memoryStore.projects.map(p => {
        const pDeployments = db.memoryStore.deployments
          .filter(d => d.project_id === p.id)
          .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
        const lastDep = pDeployments[0];

        return {
          ...p,
          last_deployment_status: lastDep ? lastDep.status : 'NO_DEPLOYMENTS',
          current_version: lastDep ? lastDep.version : 'v1.0.0',
          last_deployed_at: lastDep ? lastDep.started_at : p.created_at
        };
      });
    }
  }

  static async findById(id) {
    const projectId = parseInt(id, 10);
    try {
      const projectQuery = `
        SELECT 
          p.id, 
          p.name, 
          p.description, 
          p.github_repository, 
          p.github_branch, 
          p.created_at, 
          p.updated_at
        FROM projects p
        WHERE p.id = $1
      `;
      const projectRes = await db.query(projectQuery, [projectId]);
      if (projectRes.rows.length === 0) return null;
      const project = projectRes.rows[0];

      // Fetch environments
      const envRes = await db.query(
        'SELECT * FROM environments WHERE project_id = $1 ORDER BY id ASC',
        [projectId]
      );
      project.environments = envRes.rows;

      // Fetch recent deployments
      const depRes = await db.query(
        'SELECT * FROM deployments WHERE project_id = $1 ORDER BY started_at DESC LIMIT 10',
        [projectId]
      );
      project.recent_deployments = depRes.rows;

      return project;
    } catch (err) {
      const project = db.memoryStore.projects.find(p => p.id === projectId);
      if (!project) return null;

      const environments = db.memoryStore.environments.filter(e => e.project_id === projectId);
      const recent_deployments = db.memoryStore.deployments
        .filter(d => d.project_id === projectId)
        .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));

      return {
        ...project,
        environments,
        recent_deployments
      };
    }
  }

  static async create({ name, description, github_repository, github_branch = 'main' }) {
    try {
      const result = await db.query(
        `INSERT INTO projects (name, description, github_repository, github_branch) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [name, description, github_repository, github_branch]
      );
      const newProject = result.rows[0];

      // Create default environments for this new project
      const defaultEnvs = ['Development', 'Staging', 'Production'];
      for (const envName of defaultEnvs) {
        await db.query(
          `INSERT INTO environments (project_id, name, status, current_version, application_url)
           VALUES ($1, $2, 'Healthy', 'v1.0.0', $3)
           ON CONFLICT DO NOTHING`,
          [
            newProject.id, 
            envName, 
            `https://${envName.toLowerCase()}.${newProject.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.local`
          ]
        );
      }

      return newProject;
    } catch (err) {
      const newId = db.memoryStore.projects.length
        ? Math.max(...db.memoryStore.projects.map(p => p.id)) + 1
        : 1;

      const newProject = {
        id: newId,
        name,
        description,
        github_repository,
        github_branch,
        created_at: new Date(),
        updated_at: new Date()
      };
      db.memoryStore.projects.unshift(newProject);

      // Default environments in memory
      const defaultEnvs = ['Development', 'Staging', 'Production'];
      defaultEnvs.forEach((envName, idx) => {
        const envId = db.memoryStore.environments.length ? Math.max(...db.memoryStore.environments.map(e => e.id)) + 1 : idx + 1;
        db.memoryStore.environments.push({
          id: envId,
          project_id: newId,
          name: envName,
          status: 'Healthy',
          current_version: 'v1.0.0',
          application_url: `https://${envName.toLowerCase()}.${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.local`,
          created_at: new Date()
        });
      });

      return newProject;
    }
  }

  static async update(id, { name, description, github_repository, github_branch }) {
    const projectId = parseInt(id, 10);
    try {
      const result = await db.query(
        `UPDATE projects 
         SET name = COALESCE($1, name), 
             description = COALESCE($2, description), 
             github_repository = COALESCE($3, github_repository), 
             github_branch = COALESCE($4, github_branch),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 
         RETURNING *`,
        [name, description, github_repository, github_branch, projectId]
      );
      return result.rows[0] || null;
    } catch (err) {
      const project = db.memoryStore.projects.find(p => p.id === projectId);
      if (!project) return null;
      if (name !== undefined) project.name = name;
      if (description !== undefined) project.description = description;
      if (github_repository !== undefined) project.github_repository = github_repository;
      if (github_branch !== undefined) project.github_branch = github_branch;
      project.updated_at = new Date();
      return project;
    }
  }

  static async delete(id) {
    const projectId = parseInt(id, 10);
    try {
      const result = await db.query('DELETE FROM projects WHERE id = $1 RETURNING id', [projectId]);
      return result.rows.length > 0;
    } catch (err) {
      const index = db.memoryStore.projects.findIndex(p => p.id === projectId);
      if (index === -1) return false;
      db.memoryStore.projects.splice(index, 1);
      db.memoryStore.deployments = db.memoryStore.deployments.filter(d => d.project_id !== projectId);
      db.memoryStore.environments = db.memoryStore.environments.filter(e => e.project_id !== projectId);
      return true;
    }
  }
}

module.exports = Project;

