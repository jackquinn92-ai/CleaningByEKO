import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Unauthorized' });

  const [, token] = header.split(' ');
  try {
    jwt.verify(token, env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
