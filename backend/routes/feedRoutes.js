const express = require('express');
const Post = require('../models/Post');
const upload = require('../config/localUpload');
const authMiddleware = require('../middleware/auth'); // consolidated middleware (was authMiddleware.js — deleted)

const router = express.Router();

const getAuthenticatedUserId = (req) => {
    return (
        req.user?.id ||
        req.user?._id ||
        req.userId ||
        null
    );
};

// Create post
router.post(
    '/',
    authMiddleware,
    upload.single('image'),
    async (req, res) => {
        try {
            const userId = getAuthenticatedUserId(req);

            if (!userId) {
                return res.status(401).json({
                    message: 'Authenticated user ID is missing.',
                });
            }

            const content =
                typeof req.body.content === 'string'
                    ? req.body.content.trim()
                    : '';

            const mediaUrl = req.file
                ? `/uploads/posts/${req.file.filename}`
                : null;

            if (!content && !mediaUrl) {
                return res.status(400).json({
                    message: 'Add text or upload an image.',
                });
            }

            const createdPost = await Post.create({
                author: userId,
                content,
                mediaUrl,
                likes: [],
                comments: [],
            });

            const populatedPost = await Post.findById(
                createdPost._id
            ).populate(
                'author',
                'fullName profilePicture email'
            );

            console.log('POST SAVED:', populatedPost);

            return res.status(201).json({
                message: 'Post published successfully',
                post: populatedPost,
            });
        } catch (error) {
            console.error('CREATE POST ERROR:', error);

            return res.status(500).json({
                message: 'Failed to publish post.',
                error: error.message,
            });
        }
    }
);

// Get posts
router.get(
    '/',
    authMiddleware,
    async (req, res) => {
        try {
            const posts = await Post.find({})
                .populate(
                    'author',
                    'fullName profilePicture email'
                )
                .sort({
                    createdAt: -1,
                });

            console.log('POSTS RETURNED:', posts.length);

            return res.status(200).json({
                posts,
            });
        } catch (error) {
            console.error('FETCH POSTS ERROR:', error);

            return res.status(500).json({
                message: 'Failed to fetch posts.',
                error: error.message,
            });
        }
    }
);

module.exports = router;