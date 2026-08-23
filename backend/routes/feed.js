const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// ── Multer storage: save uploaded post images to /uploads/feed/ ────────────
// FIX: this route previously had no multipart handling at all. The frontend
// (profile.tsx submitPost) sends a multipart/form-data request with a text
// field "content" and a file field "image" — without multer here, the file
// was silently dropped and req.body.content was unreliable on a multipart
// request (Express's built-in parsers don't parse multipart bodies).
const uploadDir = path.join(__dirname, '..', 'uploads', 'feed');
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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// GET all posts for the feed
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'fullName profilePicture')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching feed' });
  }
});

// POST a new feed post — accepts multipart/form-data with optional "image"
// file field (matches profile.tsx's submitPost), and a "content" text field.
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    const mediaUrl = req.file
      ? `/uploads/feed/${req.file.filename}`
      : (typeof req.body.mediaUrl === 'string' ? req.body.mediaUrl.trim() : undefined);

    if (!content && !mediaUrl) {
      return res.status(400).json({ message: 'Post content or an image is required.' });
    }

    const newPost = new Post({
      author: req.user.id,
      content,
      mediaUrl,
    });

    const savedPost = await newPost.save();
    await savedPost.populate('author', 'fullName profilePicture');

    // profile.tsx expects response.data.post (or .data, or a bare _id) —
    // returning the post directly under `post` matches its primary check.
    res.status(201).json({ post: savedPost, message: 'Post published successfully.' });
  } catch (error) {
    console.error('Feed post creation error:', error);
    res.status(500).json({ message: 'Server error creating post' });
  }
});

// PUT like/unlike a post
router.put('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const index = post.likes.indexOf(req.user.id);
    if (index === -1) {
      post.likes.push(req.user.id);
    } else {
      post.likes.splice(index, 1);
    }
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating like' });
  }
});

module.exports = router;