const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing.');
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    profilePicture: user.profilePicture || null,
    goal: user.goal || null,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const fullName =
      typeof req.body.fullName === 'string'
        ? req.body.fullName.trim()
        : '';

    const email =
      typeof req.body.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';

    const password =
      typeof req.body.password === 'string'
        ? req.body.password
        : '';

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: 'Full name, email and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must contain at least 8 characters.',
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account already exists with this email.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName,
      email,
      password: passwordHash,
      profilePicture: null,
    });

    const token = createToken(user);

    return res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Registration error:', error);

    return res.status(500).json({
      message: 'Registration failed.',
      error: error.message,
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email =
      typeof req.body.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';

    const password =
      typeof req.body.password === 'string'
        ? req.body.password
        : '';

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: 'Incorrect email or password.',
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Incorrect email or password.',
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Login failed.',
      error: error.message,
    });
  }
});

// POST /api/auth/google — accepts a Google ID token from the frontend, verifies it
// server-side (never trust a client-sent email/name directly), then logs the user
// in if they exist or creates a new account if this is their first time.
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token is required.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email?.toLowerCase();
    const fullName = payload.name || 'Google User';
    const profilePicture = payload.picture || null;

    if (!email) {
      return res.status(400).json({ message: 'Google account has no email.' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // First time signing in with this Google account — create a new user.
      // No password is set for Google-only accounts; a random unusable hash
      // is stored so the schema's `required: true` on password is satisfied.
      const randomPassword = await bcrypt.hash(
        require('crypto').randomBytes(32).toString('hex'),
        12
      );

      user = await User.create({
        fullName,
        email,
        password: randomPassword,
        profilePicture,
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    return res.status(401).json({
      message: 'Google sign-in failed.',
      error: error.message,
    });
  }
});

// PUT /api/auth/personalize
router.put('/personalize', authMiddleware, async (req, res) => {
  try {
    const allowedGoals = [
      'buying',
      'selling',
      'investing',
      'analysis',
    ];

    const goal = req.body.goal;

    if (!allowedGoals.includes(goal)) {
      return res.status(400).json({
        message: 'Invalid personalization goal.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { goal },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Personalization error:', error);

    return res.status(500).json({
      message: 'Failed to save personalization.',
      error: error.message,
    });
  }
});

module.exports = router;