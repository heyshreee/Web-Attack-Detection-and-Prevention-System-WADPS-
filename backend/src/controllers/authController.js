import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbStore } from '../services/dbStore.js';
import logger from '../config/logger.js';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'default_super_secret_key_wadps_12345',
    { expiresIn: '24h' }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await dbStore.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await dbStore.createUser({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'operator',
    });

    logger.info(`New operator registered: ${name} (${email})`);

    // Create system alert for new registration
    await dbStore.createAlert({
      level: 'INFO',
      title: 'New Operator Registered',
      message: `A new operator account has been created for ${name} (${email}) with role ${user.role}.`,
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    logger.error(`Registration error: ${err.message}`);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  const ip = req.ip;
  const { email, password } = req.body;
  const userAgent = req.headers['user-agent'];

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Check if IP is currently manually/automatically blocked
    const isBlocked = await dbStore.findBlockedIP(ip);
    if (isBlocked) {
      if (isBlocked.expiresAt && new Date() > new Date(isBlocked.expiresAt)) {
        await dbStore.deleteBlockedIP(ip);
        logger.info(`Auto-unblocked expired blacklisted IP: ${ip}`);
      } else {
        return res.status(403).json({
          blocked: true,
          error: 'Access Denied',
          message: `Your IP address (${ip}) is currently blocked due to security reasons.`,
          reason: isBlocked.reason,
        });
      }
    }

    // 2. Check if IP has triggered brute-force limits (e.g., > 5 failures in 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const failedAttempts = await dbStore.countFailedLogins(ip, tenMinutesAgo);

    if (failedAttempts >= 5) {
      // Auto-block this IP
      const blockReason = 'Brute Force Attempts';
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins block

      await dbStore.createBlockedIP({
        ip,
        reason: blockReason,
        expiresAt,
      });

      // Log the attack
      await dbStore.createAttackLog({
        attackType: 'Brute Force Attempts',
        severity: 'HIGH',
        payload: `Failed login attempts count: ${failedAttempts + 1} for account: ${email}`,
        url: req.originalUrl,
        method: req.method,
        ip,
        userAgent,
      });

      // Create alert
      await dbStore.createAlert({
        level: 'CRITICAL',
        title: 'Brute Force Protection Triggered',
        message: `IP ${ip} was automatically blocked for 15 minutes due to exceeding 5 failed login attempts. Target account: ${email}`,
      });

      logger.warn(`[BRUTE FORCE] IP ${ip} blocked due to too many failed login attempts targeting ${email}`);

      return res.status(403).json({
        blocked: true,
        error: 'Access Denied',
        message: 'Your IP address has been blocked for 15 minutes due to too many failed login attempts.',
        reason: blockReason,
      });
    }

    // 3. Find User & Validate Password
    const user = await dbStore.findUserByEmail(email);
    if (!user) {
      // Record failed attempt
      await dbStore.createLoginHistory({ email, ip, success: false, userAgent });
      return res.status(401).json({ error: 'Invalid access credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Record failed attempt
      await dbStore.createLoginHistory({ userId: user._id, email, ip, success: false, userAgent });

      // Check if this latest failure crosses the line
      const updatedFailures = await dbStore.countFailedLogins(ip, tenMinutesAgo);

      if (updatedFailures >= 5) {
        // Auto-block IP on this failure
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await dbStore.createBlockedIP({ ip, reason: 'Brute Force Attempts', expiresAt });

        await dbStore.createAttackLog({
          attackType: 'Brute Force Attempts',
          severity: 'HIGH',
          payload: `Failed logins: ${updatedFailures} targeting ${email}`,
          url: req.originalUrl,
          method: req.method,
          ip,
          userAgent,
        });

        await dbStore.createAlert({
          level: 'CRITICAL',
          title: 'Brute Force Protection Triggered',
          message: `IP ${ip} was automatically blocked for 15 minutes after password mismatch. Target: ${email}`,
        });

        return res.status(403).json({
          blocked: true,
          error: 'Access Denied',
          message: 'Your IP address has been blocked for 15 minutes due to too many failed login attempts.',
          reason: 'Brute Force Attempts',
        });
      }

      return res.status(401).json({ error: 'Invalid access credentials' });
    }

    // 4. Successful login
    await dbStore.createLoginHistory({ userId: user._id, email, ip, success: true, userAgent });
    const token = generateToken(user);

    logger.info(`Operator logged in: ${user.name} (${user.email}) from IP ${ip}`);

    res.status(200).json({
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ error: 'Server error during authentication' });
  }
};

export const me = async (req, res) => {
  res.status(200).json({ user: req.user });
};
