const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const upload = require('../config/localUpload');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const getAuthenticatedUserId = (req) =>
    req.user?.id || req.user?._id || req.userId || null;

// Create post
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) return res.status(401).json({ message: 'Authenticated user ID is missing.' });

        const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
        const mediaUrl = req.file ? `/uploads/posts/${req.file.filename}` : (req.body.mediaUrl || null);

        if (!content && !mediaUrl) {
            return res.status(400).json({ message: 'Add text or upload an image.' });
        }

        const createdPost = await Post.create({ author: userId, content, mediaUrl, likes: [], comments: [] });
        const populatedPost = await Post.findById(createdPost._id).populate('author', 'fullName username profilePicture email');

        return res.status(201).json({ message: 'Post published successfully', post: populatedPost });
    } catch (error) {
        console.error('CREATE POST ERROR:', error);
        return res.status(500).json({ message: 'Failed to publish post.', error: error.message });
    }
});

const AGENT_POSTS = [
    {
        _id: 're-post-4',
        author: {
            _id: 'agent-4',
            fullName: 'Akshat Commercials',
            username: 'the_akshtr_estate',
            profilePicture: null,
        },
        content: 'Grade-A Tech Park Space available on OMR Chennai. LEED Platinum Certified, 24/7 power backup, and metro connectivity. 🏢💼',
        mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
        likes: ['u1', 'u4'],
        comments: [{ text: 'Available immediately for tech enterprise lease.' }],
        verified: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        _id: 're-post-1',
        author: {
            _id: 'agent-1',
            fullName: 'Prasanth Properties',
            username: 'prasanth_properties',
            profilePicture: null,
        },
        content: 'Just listed! 🌟 Stunning modern beachfront villa with private infinity pool and direct access to crystal waters. Turnkey luxury investment ready for immediate handover! DM for private tours. 🏖️🔑',
        mediaUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
        likes: ['u1', 'u2', 'u3', 'u4', 'u5'],
        comments: [
            { text: 'Is this available for lease or only purchase?' },
            { text: 'Incredible architecture!' },
        ],
        verified: true,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
        _id: 're-post-2',
        author: {
            _id: 'agent-2',
            fullName: 'Aswin Real Estate',
            username: 'aswin.realty',
            profilePicture: null,
        },
        content: 'Market update: Commercial cap rates in urban metros have compressed by 45bps this quarter. Investors are rotating aggressively into high-yield multi-family assets. 📈🏙️',
        mediaUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
        likes: ['u1', 'u3'],
        comments: [{ text: 'Spot on analysis! We are seeing similar cap rate shifts.' }],
        verified: true,
        createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
        _id: 're-post-3',
        author: {
            _id: 'agent-3',
            fullName: 'Vicky Luxury Living',
            username: 'ig_vicky16',
            profilePicture: null,
        },
        content: 'New architectural masterpiece in Beverly Hills. 8 Bedrooms, 11 Baths, custom Italian marble, and zero-edge cascading pool. 🏆✨ Price: $12.5M.',
        mediaUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
        likes: ['u2', 'u4', 'u5'],
        comments: [],
        verified: true,
        createdAt: new Date(Date.now() - 28800000).toISOString(),
    },
];

// Get all posts
router.get('/', authMiddleware, async (req, res) => {
    try {
        const rawPosts = await Post.find({})
            .populate('author', 'fullName username profilePicture email')
            .sort({ createdAt: -1 });

        // Deduplicate user posts (keep unique content only to prevent repeating test posts)
        const seen = new Set();
        const userPosts = rawPosts.filter((p) => {
            const contentKey = (p.content || '').trim().toLowerCase();
            if (contentKey && seen.has(contentKey)) return false;
            if (contentKey) seen.add(contentKey);
            return true;
        });

        // Combine unique user posts with agent property listings
        const allPosts = [...userPosts, ...AGENT_POSTS];

        return res.status(200).json({ posts: allPosts });
    } catch (error) {
        console.error('FETCH POSTS ERROR:', error);
        return res.status(500).json({ message: 'Failed to fetch posts.', error: error.message });
    }
});

// Get posts by a single user (for profile screen)
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user id.' });
        }
        const posts = await Post.find({ author: userId })
            .populate('author', 'fullName username profilePicture email')
            .sort({ createdAt: -1 });
        return res.status(200).json({ posts });
    } catch (error) {
        console.error('FETCH USER POSTS ERROR:', error);
        return res.status(500).json({ message: 'Failed to fetch user posts.', error: error.message });
    }
});

// Track in-memory comments and likes for demo posts
const demoPostComments = new Map();
const demoPostLikes = new Map();

// Like / unlike toggle
router.put('/:id/like', authMiddleware, async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            // Handle demo post
            const currentLikes = demoPostLikes.get(id) || ['u1', 'u2'];
            const alreadyLiked = currentLikes.includes(userId);
            const nextLikes = alreadyLiked
                ? currentLikes.filter((u) => u !== userId)
                : [...currentLikes, userId];
            demoPostLikes.set(id, nextLikes);
            return res.status(200).json({ likes: nextLikes });
        }

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found.' });

        const alreadyLiked = post.likes.some((u) => u.toString() === userId);
        if (alreadyLiked) {
            post.likes = post.likes.filter((u) => u.toString() !== userId);
        } else {
            post.likes.push(userId);
        }
        await post.save();

        return res.status(200).json({ likes: post.likes });
    } catch (error) {
        console.error('LIKE POST ERROR:', error);
        return res.status(500).json({ message: 'Failed to like post.', error: error.message });
    }
});

// Add comment
router.post('/:id/comment', authMiddleware, async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const user = req.user || {};
        const { id } = req.params;
        const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
        if (!text) return res.status(400).json({ message: 'Comment text is required.' });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            // Handle demo post
            const currentComments = demoPostComments.get(id) || [];
            const newComment = {
                author: {
                    _id: userId,
                    fullName: user.fullName || 'Sai',
                    username: user.username || 'saivimenthanvl',
                    profilePicture: user.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                },
                text,
                time: 'Just now',
                createdAt: new Date().toISOString(),
            };
            const updated = [newComment, ...currentComments];
            demoPostComments.set(id, updated);
            return res.status(200).json({ comments: updated });
        }

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found.' });

        post.comments.push({ user: userId, text });
        await post.save();

        const populated = await Post.findById(id).populate('comments.user', 'fullName username profilePicture');
        const formattedComments = (populated.comments || []).map((c) => ({
            _id: c._id,
            author: c.user || { fullName: user.fullName || 'Sai', username: user.username || 'saivimenthanvl' },
            text: c.text,
            time: 'Just now',
        }));

        return res.status(200).json({ comments: formattedComments });
    } catch (error) {
        console.error('COMMENT POST ERROR:', error);
        return res.status(500).json({ message: 'Failed to add comment.', error: error.message });
    }
});

// Edit post (owner only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid post id.' });

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found.' });
        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: 'You can only edit your own posts.' });
        }

        if (typeof req.body.content === 'string') post.content = req.body.content.trim();
        await post.save();

        const populated = await Post.findById(id).populate('author', 'fullName username profilePicture email');
        return res.status(200).json({ message: 'Post updated.', post: populated });
    } catch (error) {
        console.error('EDIT POST ERROR:', error);
        return res.status(500).json({ message: 'Failed to edit post.', error: error.message });
    }
});

// Delete post (owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid post id.' });

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found.' });
        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: 'You can only delete your own posts.' });
        }
        await Post.findByIdAndDelete(id);
        return res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (error) {
        console.error('DELETE POST ERROR:', error);
        return res.status(500).json({ message: 'Failed to delete post.', error: error.message });
    }
});

// Real Estate & Commercial Buildings For Sale News
const REAL_ESTATE_NEWS = [
    {
        id: 'news-1',
        title: 'Commercial Office Towers Surge in London & NYC',
        time: '9h ago',
        readers: '22,392 readers',
        category: 'Commercial Real Estate',
        snippet: 'Institutional buyers are acquiring prime CBD office towers at record transaction velocity.',
    },
    {
        id: 'news-2',
        title: 'Top 10 Prime Commercial Buildings For Sale in 2026',
        time: '9h ago',
        readers: '14,976 readers',
        category: 'Property Listings',
        snippet: 'High-cap-rate tech parks and multi-family assets headline this quarter’s institutional offerings.',
    },
    {
        id: 'news-3',
        title: 'Boolok AI Property Valuation Index Hits Record High',
        time: '57m ago',
        readers: '8,709 readers',
        category: 'AI Market Intelligence',
        snippet: 'Predictive algorithm signals 14.8% YoY valuation upside across select waterfront clusters.',
    },
    {
        id: 'news-4',
        title: 'Waterfront Luxury Estates See Record Institutional Influx',
        time: '6h ago',
        readers: '6,387 readers',
        category: 'Luxury Real Estate',
        snippet: 'Private equity family offices allocate over $4.2B into trophy coastal residences.',
    },
    {
        id: 'news-5',
        title: 'Retail-to-Residential Conversions Accelerating in Metros',
        time: '6h ago',
        readers: '3,158 readers',
        category: 'Urban Redevelopment',
        snippet: 'Zoning reforms unlock high-density residential towers from aging shopping complexes.',
    },
    {
        id: 'news-6',
        title: 'Singapore Grade-A Tech Parks Attract $1.2B Capital Inflow',
        time: '12h ago',
        readers: '5,420 readers',
        category: 'Global Assets',
        snippet: 'Cross-border real estate investment trusts expand regional footprint in high-yield hubs.',
    },
];

router.get('/news', (_req, res) => {
    return res.status(200).json({ news: REAL_ESTATE_NEWS });
});

module.exports = router;