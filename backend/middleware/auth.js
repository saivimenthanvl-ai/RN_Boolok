const jwt = require('jsonwebtoken');

const TOKEN_ISSUER = 'boolok-gpt-api';
const TOKEN_AUDIENCE = 'boolok-gpt-client';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      message: 'Authentication token is missing.',
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error(
      'authMiddleware: JWT_SECRET is not set — cannot verify any token.'
    );
    return res.status(500).json({
      message: 'Server auth configuration error.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });

    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Your session has expired. Please sign in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      console.error('authMiddleware: token rejected —', error.message);
      return res.status(401).json({
        message: 'Authentication token is invalid.',
      });
    }

    console.error('authMiddleware: unexpected error —', error);
    return res.status(500).json({
      message: 'Failed to verify authentication token.',
    });
  }
}

module.exports = authMiddleware;