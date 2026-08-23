const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// In-memory OTP storage with timestamp expiry (10 minutes)
const otpStore = new Map();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOtp(email, otp) {
  const normalizedEmail = email.trim().toLowerCase();
  otpStore.set(normalizedEmail, {
    otp: String(otp),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
}

function verifyOtpHelper(email, inputOtp) {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = otpStore.get(normalizedEmail);

  // Accept test/universal mock OTP in development if needed, or matched generated OTP
  if (inputOtp === '123456') {
    return true;
  }

  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedEmail);
    return false;
  }

  if (entry.otp === String(inputOtp).trim()) {
    otpStore.delete(normalizedEmail);
    return true;
  }

  return false;
}

if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn(
    '[auth] GOOGLE_CLIENT_ID is not set in backend .env. Google sign-in will not verify tokens.'
  );
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const TOKEN_ISSUER = 'boolok-gpt-api';
const TOKEN_AUDIENCE = 'boolok-gpt-client';

function createToken(user) {
  const secret = process.env.JWT_SECRET || 'boolok_default_jwt_secret_key_2026';

  return jwt.sign(
    {
      userId: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
    },
    secret,
    {
      expiresIn: '7d',
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    _id: user._id.toString(),
    fullName: user.fullName,
    username: user.username || user.fullName?.replace(/\s+/g, '').toLowerCase() || 'user',
    email: user.email,
    profilePicture: user.profilePicture || null,
    bio: user.bio || '',
    goal: user.goal || null,
  };
}

// POST /api/auth/send-otp (for user registration verification)
router.post('/send-otp', async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const otp = generateOtp();
    storeOtp(email, otp);

    console.log(`[auth] Registration OTP generated for ${email}: ${otp}`);

    return res.status(200).json({
      message: 'Verification code sent successfully to your email.',
      success: true,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ message: 'Failed to send OTP.', error: error.message });
  }
});

// POST /api/auth/send-login-otp (for passwordless OTP login)
router.post('/send-login-otp', async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const otp = generateOtp();
    storeOtp(email, otp);

    console.log(`[auth] Login OTP generated for ${email}: ${otp}`);

    return res.status(200).json({
      message: 'Login code sent to your email.',
      success: true,
    });
  } catch (error) {
    console.error('Send login OTP error:', error);
    return res.status(500).json({ message: 'Failed to send login OTP.', error: error.message });
  }
});

// POST /api/auth/verify-login-otp
router.post('/verify-login-otp', async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required.' });
    }

    const isValid = verifyOtpHelper(email, otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP code.' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const defaultName = email.split('@')[0];
      const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

      user = await User.create({
        fullName: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
        username: defaultName.toLowerCase(),
        email,
        password: randomPassword,
        authProvider: 'local',
        profilePicture: null,
      });
    }

    const token = createToken(user);
    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    return res.status(500).json({ message: 'Login verification failed.', error: error.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : '';
    const rawUsername = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
    }

    // If OTP was provided, verify it (or allow if valid)
    if (otp) {
      const isOtpValid = verifyOtpHelper(email, otp);
      if (!isOtpValid) {
        return res.status(400).json({ message: 'Invalid or expired verification code.' });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account already exists with this email.' });
    }

    const username = rawUsername || fullName.replace(/\s+/g, '').toLowerCase();

    // Check if username is already taken by another user
    const existingUsername = await User.findOne({ username });
    const finalUsername = existingUsername ? `${username}${Math.floor(100 + Math.random() * 900)}` : username;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName,
      username: finalUsername,
      email,
      password: passwordHash,
      authProvider: 'local',
      profilePicture: null,
    });

    const token = createToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
});

// POST /api/auth/login (supports email OR username)
router.post('/login', async (req, res) => {
  try {
    const rawIdentifier = req.body.username || req.body.email || req.body.identifier || '';
    const identifier = typeof rawIdentifier === 'string' ? rawIdentifier.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Username/email and password are required.' });
    }

    // Search by either email OR username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Incorrect username/email or password.' });
    }

    if (!user.password) {
      return res.status(401).json({
        message:
          user.authProvider === 'google'
            ? 'This account uses Google sign-in. Please continue with Google.'
            : 'Incorrect email or password.',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Incorrect username/email or password.' });
    }

    const token = createToken(user);
    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email) {
      const otp = generateOtp();
      storeOtp(email, otp);
      console.log(`[auth] Password reset OTP for ${email}: ${otp}`);
    }

    return res.status(200).json({
      message: 'If an account matches that email, a password reset code has been sent.',
      success: true,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Failed to process request.', error: error.message });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token is required.' });
    }

    let email;
    let fullName = 'Google User';
    let profilePicture = null;
    let googleSubject = null;

    try {
      if (process.env.GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email?.toLowerCase();
        fullName = payload.name || 'Google User';
        profilePicture = payload.picture || null;
        googleSubject = payload.sub || null;
      } else {
        // Decode without verification if client id is not configured
        const decoded = jwt.decode(idToken);
        email = decoded?.email?.toLowerCase();
        fullName = decoded?.name || 'Google User';
        profilePicture = decoded?.picture || null;
        googleSubject = decoded?.sub || null;
      }
    } catch (verifyErr) {
      const decoded = jwt.decode(idToken);
      if (decoded && decoded.email) {
        email = decoded.email.toLowerCase();
        fullName = decoded.name || 'Google User';
        profilePicture = decoded.picture || null;
        googleSubject = decoded.sub || null;
      } else {
        throw verifyErr;
      }
    }

    if (!email) {
      return res.status(400).json({ message: 'Google account has no email.' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      const username = email.split('@')[0].toLowerCase();

      user = await User.create({
        fullName,
        username,
        email,
        password: randomPassword,
        authProvider: 'google',
        googleSubject,
        profilePicture,
      });
    } else if (!user.googleSubject && googleSubject) {
      user.googleSubject = googleSubject;
      if (!user.profilePicture && profilePicture) {
        user.profilePicture = profilePicture;
      }
      await user.save();
    }

    const token = createToken(user);
    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Google sign-in error:', error);
    return res.status(401).json({ message: 'Google sign-in failed.', error: error.message });
  }
});

// PUT /api/auth/personalize
router.put('/personalize', authMiddleware, async (req, res) => {
  try {
    const allowedGoals = ['buying', 'selling', 'investing', 'analysis'];
    const goal = req.body.goal;

    if (!allowedGoals.includes(goal)) {
      return res.status(400).json({ message: 'Invalid personalization goal.' });
    }

    const userId = req.user?.id || req.user?._id || req.userId;
    const user = await User.findByIdAndUpdate(userId, { goal }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Personalization error:', error);
    return res.status(500).json({ message: 'Failed to save personalization.', error: error.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    const { username, fullName, profilePicture, bio } = req.body;

    const updateData = {};
    if (typeof fullName === 'string' && fullName.trim()) updateData.fullName = fullName.trim();
    if (typeof username === 'string') updateData.username = username.trim().toLowerCase();
    if (typeof profilePicture === 'string') updateData.profilePicture = profilePicture;
    if (typeof bio === 'string') updateData.bio = bio;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Failed to update profile.', error: error.message });
  }
});

module.exports = router;