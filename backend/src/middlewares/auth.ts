import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'xtermweb_fallback_secure_key_12987391823';

export function generateToken(user: { id: number; username: string; role: 'admin' | 'user' }) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export function decodeToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && typeof decoded === 'object' && 'id' in decoded) {
      return {
        id: Number(decoded.id),
        username: String(decoded.username),
        role: decoded.role as 'admin' | 'user'
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/auth')) return next();

  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) return res.status(401).json({ error: 'No token provided' });

  const decoded = decodeToken(token);
  if (!decoded || isNaN(decoded.id)) return res.status(401).json({ error: 'Invalid token' });

  req.user = decoded;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
