import jwt from 'jsonwebtoken';
import { dbStore } from '../services/dbStore.js';
import logger from '../config/logger.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No authorization token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_super_secret_key_wadps_12345');
    
    // Find the user in database / memory
    const user = await dbStore.findUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User account no longer exists.' 
      });
    }

    // Attach user metadata to request context
    req.user = user;
    next();
  } catch (err) {
    logger.warn(`Auth Middleware verification failed: ${err.message}`);
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Access token has expired or is invalid.' 
    });
  }
};

export default authMiddleware;
