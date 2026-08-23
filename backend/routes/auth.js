const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// IMPORTANT: GOOGLE_CLIENT_ID here must be the *Web application* OAuth
// client ID (the same value as EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID on the
// frontend) — NOT the Android client ID shown in your Google Cloud
// "Clients" screenshot. The Android client (package name + SHA-1) is only
// used by Google Play Services on-device to authorize the sign-in UI; the
// ID token it hands back is always issued with the Web client as its
// audience. Verifying against the wrong audience makes every Google
// sign-in fail here with a 401, even though the client-side sign-in
// itself succeeded.
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error(
    '[auth] GOOGLE_CLIENT_ID is not set. Google sign-in will fail for every user until this is configured ' +
    '(use the Web application OAuth client ID from Google Cloud Console).'
  );
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const TOKEN_ISSUER = 'boolok-gpt-api';
const TOKEN_AUDIENCE = 'boolok-gpt-client';

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
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    username: user.username || user.fullName?.replace(/\s+/g, '').toLowerCase() || 'sai',
    email: user.email,
    profilePicture: user.profilePicture || null,
    bio: user.bio || '',
    goal: user.goal || null,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: 'An account already exists with this email.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName,
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

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
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
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const token = createToken(user);

    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Server is missing GOOGLE_CLIENT_ID configuration.' });
    }

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
    const googleSubject = payload.sub || null;

    if (!email) {
      return res.status(400).json({ message: 'Google account has no email.' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = await bcrypt.hash(require('crypto').randomBytes(32).toString('hex'), 12);

      user = await User.create({
        fullName,
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

    const user = await User.findByIdAndUpdate(req.user.id, { goal }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

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