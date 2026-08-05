const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is missing.' });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({ message: 'Authorization token is missing.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing from backend .env');
      return res.status(500).json({ message: 'Server authentication configuration is missing.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({ message: 'Token does not contain a user ID.' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid.' });
    }

    req.user = user;
    req.user.id = user._id.toString();
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.name, error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication token expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }

    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
};

module.exports = authMiddleware;