const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Reel = require('../models/Reel');
const auth = require('../middleware/auth');

// ── Multer storage: save uploaded video files to /uploads/reels/ ────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'reels');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed'));
  },
});

// ── Cosmetic placeholder "AI" scoring ────────────────────────────────────────
// IMPORTANT: there is no real video/content analysis wired up here. This just
// generates a plausible-looking score + line of text so new reels don't show
// a broken "0% AI MATCH", matching the tone of the existing demo cards. If real
// analysis is ever added (e.g. calling a vision/LLM API on the video), replace
// this function — don't mistake its output for genuine insight.
const PLACEHOLDER_INSIGHTS = [
  'High buyer interest predicted based on comparable listings in this area.',
  'Property features align well with current market demand trends.',
  'Location shows strong long-term appreciation potential.',
  'Listing quality and presentation are above average for this segment.',
  'Strong engagement expected based on similar recent listings.',
];

function generatePlaceholderAnalysis() {
  const aiMatch = Math.floor(Math.random() * (99 - 80 + 1)) + 80; // 80–99
  const insight = PLACEHOLDER_INSIGHTS[Math.floor(Math.random() * PLACEHOLDER_INSIGHTS.length)];
  return { aiMatch, insight };
}

// GET all reels
router.get('/', auth, async (req, res) => {
  try {
    const reels = await Reel.find()
      .populate('author', 'fullName profilePicture')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(reels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching reels' });
  }
});

// POST a new reel — supports EITHER:
//   (a) multipart/form-data with a "video" file field (Insights screen's file picker), or
//   (b) application/json with a "videoUrl" string (Social Feed's paste-a-link form)
router.post('/', auth, upload.single('video'), async (req, res) => {
  try {
    let videoUrl;

    if (req.file) {
      videoUrl = `/uploads/reels/${req.file.filename}`;
    } else if (typeof req.body.videoUrl === 'string' && req.body.videoUrl.trim()) {
      videoUrl = req.body.videoUrl.trim();
    } else {
      return res.status(400).json({ message: 'A video file or video URL is required.' });
    }

    const { caption, title, location } = req.body;

    // Only fall back to placeholder values if the client didn't send real ones
    const aiMatch =
      req.body.aiMatch !== undefined && req.body.aiMatch !== ''
        ? Number(req.body.aiMatch)
        : undefined;
    const insight = typeof req.body.insight === 'string' && req.body.insight.trim()
      ? req.body.insight.trim()
      : undefined;

    const placeholder = (aiMatch === undefined || insight === undefined)
      ? generatePlaceholderAnalysis()
      : null;

    const newReel = new Reel({
      author: req.user.id,
      videoUrl,
      caption,
      title,
      location,
      aiMatch: aiMatch ?? placeholder.aiMatch,
      insight: insight ?? placeholder.insight,
    });

    const savedReel = await newReel.save();
    await savedReel.populate('author', 'fullName profilePicture');
    res.status(201).json(savedReel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating reel' });
  }
});

// PUT like/unlike a reel
router.put('/:id/like', auth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    const index = reel.likes.indexOf(req.user.id);
    if (index === -1) reel.likes.push(req.user.id);
    else reel.likes.splice(index, 1);

    await reel.save();
    res.json(reel.likes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating reel like' });
  }
});

// DELETE a reel
router.delete('/:id', auth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    if (reel.videoUrl && reel.videoUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', reel.videoUrl);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.warn('Could not delete video file:', err.message);
        }
      });
    }

    await reel.deleteOne();
    res.json({ message: 'Reel deleted' });
  } catch (error) {
    console.error('[DELETE] Error:', error);
    res.status(500).json({ message: 'Server error deleting reel' });
  }
});

module.exports = router;