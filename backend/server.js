const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

/*
 * Windows can occasionally fail MongoDB Atlas SRV lookups through c-ares.
 * Using public DNS resolvers is acceptable for local development.
 */
if (process.env.DISABLE_CUSTOM_DNS !== 'true') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (error) {
    console.warn('Unable to configure custom DNS resolvers:', error.message);
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 5000;

function requireEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`${name} is missing from the backend environment.`);
  }

  return value.trim();
}

app.disable('x-powered-by');

/*
 * Robust CORS setup allowing requests from mobile apps (no Origin header)
 * as well as web applications.
 */
app.use(
  cors({
    origin(origin, callback) {
      // Mobile apps, Postman, curl, and server-to-server calls don't send an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      // Allow all local subnet IP addresses (192.168.x.x, 10.x.x.x, 172.x.x.x), localhost, and configured origins
      const isLocalSubnet = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);

      if (isLocalSubnet) {
        return callback(null, true);
      }

      const configuredOrigins = [
        process.env.FRONTEND_URL,
        process.env.WEB_APP_URL,
        process.env.CORS_ORIGINS,
      ]
        .filter(Boolean)
        .flatMap((val) => String(val).split(',').map((s) => s.trim()).filter(Boolean));

      if (configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`Blocked by CORS: ${origin}`);
      return callback(new Error('This origin is not allowed by the API CORS policy.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(
  express.json({
    limit: '20mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '20mb',
  })
);

/*
 * API routes
 */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/feed', require('./routes/feedRoutes'));
app.use('/api/reels', require('./routes/reels'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));

/*
 * Public uploaded files
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/*
 * Health route
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    database:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected',
    time: new Date().toISOString(),
  });
});

/*
 * Base route
 */
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'BOOLOK GPT API',
    status: 'running',
  });
});

/*
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
 * Global error handler
 */
app.use((error, req, res, next) => {
  console.error('GLOBAL SERVER ERROR:', error);

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      message: 'Image is too large. Maximum size is 10 MB.',
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Request payload is too large.',
    });
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({
      message: error.message || 'File upload failed.',
    });
  }

  if (
    typeof error.message === 'string' &&
    error.message.includes('CORS policy')
  ) {
    return res.status(403).json({
      message: error.message,
    });
  }

  return res.status(error.status || 500).json({
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error.'
        : error.message || 'Internal server error.',
  });
});

let httpServer;

async function startServer() {
  try {
    const mongoUri = requireEnvironmentVariable('MONGO_URI');
    requireEnvironmentVariable('JWT_SECRET');

    await mongoose.connect(mongoUri, {
      family: 4,
      serverSelectionTimeoutMS: 15000,
    });

    console.log(`MongoDB connected: ${mongoose.connection.host}`);

    httpServer = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('SERVER STARTUP ERROR:', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully.`);

  try {
    if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Shutdown error:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED PROMISE REJECTION:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

startServer();

module.exports = app;