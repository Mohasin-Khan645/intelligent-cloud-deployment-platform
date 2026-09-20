const db = require('../config/database');

class User {
  static async findByEmail(email) {
    try {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (err) {
      // Fallback to memory store if database is offline
      return db.memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
  }

  static async findById(id) {
    try {
      const result = await db.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (err) {
      const u = db.memoryStore.users.find(u => u.id === parseInt(id, 10));
      if (!u) return null;
      return { id: u.id, name: u.name, email: u.email, created_at: u.created_at };
    }
  }

  static async create({ name, email, password_hash }) {
    try {
      const result = await db.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
        [name, email, password_hash]
      );
      return result.rows[0];
    } catch (err) {
      const newUser = {
        id: db.memoryStore.users.length ? Math.max(...db.memoryStore.users.map(u => u.id)) + 1 : 1,
        name,
        email,
        password_hash,
        created_at: new Date()
      };
      db.memoryStore.users.push(newUser);
      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        created_at: newUser.created_at
      };
    }
  }
}

module.exports = User;

