const db = require('../config/database');

class Environment {
  static async findAll({ projectId } = {}) {
    try {
      let query = `
        SELECT 
          e.id, 
          e.project_id, 
          p.name as project_name, 
          e.name, 
          e.status, 
          e.current_version, 
          e.application_url, 
          e.created_at,
          (
            SELECT d.started_at 
            FROM deployments d 
            WHERE d.project_id = e.project_id AND d.environment = e.name 
            ORDER BY d.started_at DESC 
            LIMIT 1
          ) as last_deployed_at
        FROM environments e
        LEFT JOIN projects p ON e.project_id = p.id
      `;
      const params = [];
      if (projectId) {
        params.push(parseInt(projectId, 10));
        query += ' WHERE e.project_id = $1';
      }
      query += ' ORDER BY e.id ASC';

      const result = await db.query(query, params);
      return result.rows;
    } catch (err) {
      let envs = db.memoryStore.environments.map(e => {
        const project = db.memoryStore.projects.find(p => p.id === e.project_id);
        const lastDep = db.memoryStore.deployments
          .filter(d => d.project_id === e.project_id && d.environment === e.name)
          .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];

        return {
          ...e,
          project_name: project ? project.name : 'Demo Project',
          last_deployed_at: lastDep ? lastDep.started_at : e.created_at
        };
      });

      if (projectId) {
        envs = envs.filter(e => e.project_id === parseInt(projectId, 10));
      }

      return envs;
    }
  }

  static async findById(id) {
    const envId = parseInt(id, 10);
    try {
      const query = `
        SELECT 
          e.id, 
          e.project_id, 
          p.name as project_name, 
          e.name, 
          e.status, 
          e.current_version, 
          e.application_url, 
          e.created_at
        FROM environments e
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE e.id = $1
      `;
      const result = await db.query(query, [envId]);
      return result.rows[0] || null;
    } catch (err) {
      const env = db.memoryStore.environments.find(e => e.id === envId);
      if (!env) return null;
      const project = db.memoryStore.projects.find(p => p.id === env.project_id);
      return {
        ...env,
        project_name: project ? project.name : 'Demo Project'
      };
    }
  }

  static async create({ project_id, name, status = 'Healthy', current_version = 'v1.0.0', application_url }) {
    const pId = parseInt(project_id, 10);
    try {
      const result = await db.query(
        `INSERT INTO environments (project_id, name, status, current_version, application_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [pId, name, status, current_version, application_url]
      );
      return result.rows[0];
    } catch (err) {
      const newId = db.memoryStore.environments.length
        ? Math.max(...db.memoryStore.environments.map(e => e.id)) + 1
        : 1;
      const newEnv = {
        id: newId,
        project_id: pId,
        name,
        status,
        current_version,
        application_url: application_url || `https://${name.toLowerCase()}.internal`,
        created_at: new Date()
      };
      db.memoryStore.environments.push(newEnv);
      return newEnv;
    }
  }

  static async update(id, { name, status, current_version, application_url }) {
    const envId = parseInt(id, 10);
    try {
      const result = await db.query(
        `UPDATE environments 
         SET name = COALESCE($1, name), 
             status = COALESCE($2, status), 
             current_version = COALESCE($3, current_version), 
             application_url = COALESCE($4, application_url)
         WHERE id = $5 
         RETURNING *`,
        [name, status, current_version, application_url, envId]
      );
      return result.rows[0] || null;
    } catch (err) {
      const env = db.memoryStore.environments.find(e => e.id === envId);
      if (!env) return null;
      if (name !== undefined) env.name = name;
      if (status !== undefined) env.status = status;
      if (current_version !== undefined) env.current_version = current_version;
      if (application_url !== undefined) env.application_url = application_url;
      return env;
    }
  }
}

module.exports = Environment;

