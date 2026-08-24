const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { memoryDb } = require('../config/database');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = memoryDb.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User no longer exists' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    next();
  });
}

module.exports = authenticateToken;
