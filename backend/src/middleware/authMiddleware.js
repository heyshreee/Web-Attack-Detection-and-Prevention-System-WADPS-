import jwt from 'jsonwebtoken';
import { dbStore } from '../services/dbStore.js';
import logger from '../config/logger.js';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_super_secret_key_wadps_12345');
    
    // Find user using dbStore abstraction to support transparent fallback when DB is disconnected
    const user = await dbStore.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'The user session is no longer active.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.warn(`Failed authentication attempt: ${err.message}`);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token.',
    });
  }
};

export default authMiddleware;
