const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth'); // assuming an auth middleware exists

// GET all posts for the feed
router.get('/', async (req, res) => {
  try {
    // We populate author to get fullName and profilePicture
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

// POST a new feed post
router.post('/', auth, async (req, res) => {
  try {
    const { content, mediaUrl } = req.body;
    const newPost = new Post({
      author: req.user.id,
      content,
      mediaUrl,
    });
    const savedPost = await newPost.save();
    // Populate before returning
    await savedPost.populate('author', 'fullName profilePicture');
    res.status(201).json(savedPost);
  } catch (error) {
    console.error(error);
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
