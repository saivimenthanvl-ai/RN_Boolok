const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // work around Windows/c-ares failing SRV lookups that the OS resolver handles fine

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

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

// ─────────────────────────────────────────────────────────────
// API routes
// Register each route only once
// ─────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/feed', require('./routes/feedRoutes'));
app.use('/api/reels', require('./routes/reels'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ─────────────────────────────────────────────────────────────
// Public uploaded files
// ─────────────────────────────────────────────────────────────
app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
);

// ─────────────────────────────────────────────────────────────
// Health route
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    time: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────
// Base route
// ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(
    'BOOLOK GPT API is running...'
  );
});

// ─────────────────────────────────────────────────────────────
// 404 handler
// ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─────────────────────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(
    'GLOBAL SERVER ERROR:',
    err
  );

  if (
    err.code === 'LIMIT_FILE_SIZE'
  ) {
    return res.status(413).json({
      message:
        'Image is too large. Maximum size is 10 MB.',
    });
  }

  if (
    err.type === 'entity.too.large'
  ) {
    return res.status(413).json({
      message:
        'Request payload is too large.',
    });
  }

  if (
    err.name === 'MulterError'
  ) {
    return res.status(400).json({
      message:
        err.message ||
        'File upload failed.',
    });
  }

  return res.status(
    err.status || 500
  ).json({
    message:
      err.message ||
      'Internal server error.',
  });
});

// ─────────────────────────────────────────────────────────────
// MongoDB and server startup
// ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    const connection =
      await mongoose.connect(
        process.env.MONGO_URI,
        {
          family: 4,
        }
      );

    console.log(
      `MongoDB Connected: ${connection.connection.host}`
    );

    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} (0.0.0.0)`));

  } catch (error) {
    console.error(
      'MongoDB Connection Error:',
      error.message
    );

    process.exit(1);
  }
};

startServer();