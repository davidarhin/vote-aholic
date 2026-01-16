/**
 * Authentication Middleware
 * Checks user role and permissions
 */

const db = require('./db');

// Check if user is an admin
function checkAdmin(req, res, next) {
  const userId = req.body.userId || req.query.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required. Only administrators can perform this action.' });
    }

    req.user = { id: userId, role: user.role };
    next();
  });
}

// Get user info with role
function getUserInfo(userId, callback) {
  db.get('SELECT id, username, email, role, createdAt FROM users WHERE id = ?', [userId], callback);
}

module.exports = {
  checkAdmin,
  getUserInfo
};
