import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'nero_aero_top_secret_jwt_key_2026';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session. Please log in again.' });
    }
    req.user = user;
    next();
  });
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Restricted action: Administrator clearance required.' });
  }
  next();
}

export function requireStaff(req, res, next) {
  const allowedRoles = ['admin', 'engineer', 'technician', 'inspector'];
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Maintenance personnel authorization required.' });
  }
  next();
}
