import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbStore } from '../services/dbStore.js';
import logger from '../config/logger.js';

// Helper to sign JWT tokens
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET || 'default_super_secret_key_wadps_12345', 
    { expiresIn: '24h' }
  );
};

// @desc    Register a new admin
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Validation Error', message: 'All registration fields are required.' });
    }

    // Check if admin already exists
    const existingUser = await dbStore.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Validation Error', message: 'Email address is already in use.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save admin to DB (everyone is an admin)
    const user = await dbStore.createUser({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    logger.info(`New admin registered: ${user.name} (${user.email})`);

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    logger.error(`Registration Controller Error: ${err.message}`);
    res.status(500).json({ error: 'Server Error', message: 'Registration process failed.' });
  }
};

// @desc    Authenticate admin & get token
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Validation Error', message: 'Email and password are required.' });
    }

    // Check if admin exists
    const user = await dbStore.findUserByEmail(email);
    if (!user) {
      logger.warn(`Failed login attempt: non-existent email "${email}"`);
      return res.status(400).json({ error: 'Authentication Error', message: 'Invalid credentials provided.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Failed login attempt: incorrect password for admin "${email}"`);
      return res.status(400).json({ error: 'Authentication Error', message: 'Invalid credentials provided.' });
    }

    logger.info(`Admin authenticated: ${user.name} (${user.email})`);

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    logger.error(`Login Controller Error: ${err.message}`);
    res.status(500).json({ error: 'Server Error', message: 'Authentication process failed.' });
  }
};

// @desc    Get current authenticated admin profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    // req.user has already been loaded by authMiddleware (excluding the password)
    res.status(200).json(req.user);
  } catch (err) {
    logger.error(`Profile fetch error: ${err.message}`);
    res.status(500).json({ error: 'Server Error', message: 'Could not fetch admin profile details.' });
  }
};
