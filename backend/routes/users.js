const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const getAuthenticatedUserId = (req) => req.user?.id || req.user?._id || req.userId || null;

const DEMO_AGENTS = {
    'agent-1': {
        id: 'agent-1',
        fullName: 'Prasanth Properties',
        username: 'prasanth_properties',
        bio: 'Luxury Waterfront Specialist · Miami & Coastal Estates 🏖️🔑',
        profilePicture: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        followerCount: 12400,
        followingCount: 380,
        posts: [
            {
                _id: 'p-101',
                content: 'Stunning modern beachfront villa with private infinity pool and direct access to crystal waters. Turnkey luxury investment ready for immediate handover! 🏖️🔑',
                mediaUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
                likes: ['u1', 'u2', 'u3', 'u4', 'u5'],
                comments: [{ text: 'Incredible architecture!' }],
            },
            {
                _id: 'p-102',
                content: 'Private Island Sanctuary in the Florida Keys. 4.2 Acres of secluded luxury with private helicopter pad. 🚁🌴',
                mediaUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
                likes: ['u1', 'u2'],
                comments: [],
            },
            {
                _id: 'p-103',
                content: 'Ultra-modern 3-Bedroom Oceanfront Condo in South Beach. Floor to ceiling glass with automated blinds and Sub-Zero appliances. 🌊',
                mediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
                likes: ['u3', 'u4'],
                comments: [{ text: 'Price please?' }],
            },
        ],
    },
    'agent-2': {
        id: 'agent-2',
        fullName: 'Aswin Real Estate',
        username: 'aswin.realty',
        bio: 'Manhattan Commercial Advisor · Institutional Multi-Family & Mixed Use 🏙️📈',
        profilePicture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        followerCount: 8950,
        followingCount: 420,
        posts: [
            {
                _id: 'p-201',
                content: 'Market update: Commercial cap rates in urban metros have compressed by 45bps this quarter. Investors rotating aggressively into high-yield multi-family assets. 📈🏙️',
                mediaUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
                likes: ['u1', 'u3'],
                comments: [{ text: 'Spot on analysis!' }],
            },
            {
                _id: 'p-202',
                content: 'Tribeca Luxury Loft with 14-foot ceilings and private key-locked elevator. 🗽✨ Offered at $5,400,000.',
                mediaUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200',
                likes: ['u1', 'u2', 'u5'],
                comments: [],
            },
        ],
    },
    'agent-3': {
        id: 'agent-3',
        fullName: 'Vicky Luxury Living',
        username: 'ig_vicky16',
        bio: 'Beverly Hills Top Producer · Celebrity Homes & Architectural Mansions 🏆✨',
        profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        followerCount: 24100,
        followingCount: 610,
        posts: [
            {
                _id: 'p-301',
                content: 'New architectural masterpiece in Beverly Hills. 8 Bedrooms, 11 Baths, custom Italian marble, and zero-edge cascading pool. 🏆✨ Price: $12.5M.',
                mediaUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
                likes: ['u2', 'u4', 'u5', 'u6'],
                comments: [{ text: 'Absolute dream home!' }],
            },
            {
                _id: 'p-302',
                content: 'Bel Air Modern Hilltop Villa with 270-degree canyon to ocean vistas. 🌅 Ready for high-profile client walkthroughs.',
                mediaUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
                likes: ['u1', 'u2'],
                comments: [],
            },
        ],
    },
    'amish': {
        id: 'amish',
        fullName: 'Amish',
        username: 'amish',
        bio: 'Lifestyle & Architecture Enthusiast 📸✨ · Followed by madhuverseoffi...',
        profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        followerCount: 340,
        followingCount: 210,
        posts: [
            {
                _id: 'p-amish-1',
                content: 'Charming coastal retreat with open-concept living and sunlit patio. 🌿🏡',
                mediaUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
                likes: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10'],
                comments: [{ text: 'Love the aesthetic!' }],
            },
        ],
    },
    'cinemahub.live': {
        id: 'cinemahub.live',
        fullName: 'cinemahub.live',
        username: 'cinemahub.live',
        bio: 'Media Production & Prime Film Studio Locations 🎬🍿 · Suggested for you',
        profilePicture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        followerCount: 1250,
        followingCount: 89,
        posts: [
            {
                _id: 'p-cinema-1',
                content: 'Acoustically treated studio space with high ceilings and green room facilities. 🎥',
                mediaUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
                likes: ['u1', 'u2', 'u3'],
                comments: [],
            },
        ],
    },
    'bavadharini_rs': {
        id: 'bavadharini_rs',
        fullName: 'Bavadharini RS',
        username: 'bavadharini_rs',
        bio: 'Interior Designer & Modern Living Specialist 🎨🛋️ · Followed by thiru.yashhh',
        profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        followerCount: 480,
        followingCount: 195,
        posts: [
            {
                _id: 'p-bava-1',
                content: 'Bespoke custom kitchen & dining makeover completed for our luxury penthouse client. ✨🍽️',
                mediaUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
                likes: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10'],
                comments: [{ text: 'Stunning cabinetry!' }],
            },
        ],
    },
    'shreekutti': {
        id: 'shreekutti',
        fullName: 'shreekutti',
        username: 'shreekutti',
        bio: 'Urban Living & Scenic Properties 🌿🏡 · Followed by lyra_orphe...',
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        followerCount: 310,
        followingCount: 140,
        posts: [
            {
                _id: 'p-shree-1',
                content: 'Peaceful garden villa surrounded by lush greenery and private terrace. 🍃🌸',
                mediaUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
                likes: ['u1', 'u2', 'u3', 'u4'],
                comments: [],
            },
        ],
    },
    'logeshwarana': {
        id: 'logeshwarana',
        fullName: 'Logeshwaran A',
        username: 'logeshwarana',
        bio: 'Architectural Consultant & Real Estate Portfolio Lead 🏛️💼',
        profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        followerCount: 1820,
        followingCount: 310,
        posts: [
            {
                _id: 'p-logesh-1',
                content: 'New commercial development blueprint ready for review. State-of-the-art energy rating. 🏢✨',
                mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
                likes: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10'],
                comments: [{ text: 'Top tier planning!' }],
            },
        ],
        reels: [
            {
                _id: 'r-logesh-1',
                title: 'Kyoto Forest Retreat',
                location: 'Kyoto, Japan',
                aiMatch: 95,
                insight: 'Thermal zoning optimized. High potential for eco-luxury cabins or a private wellness estate.',
                likes: 920,
                thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
            },
            {
                _id: 'r-logesh-2',
                title: 'Uluwatu Cliffside',
                location: 'Bali, Indonesia',
                aiMatch: 92,
                insight: 'Tourism growth in this sector is up 14% YoY. Zoning allows for luxury boutique resort development.',
                likes: 1800,
                thumbnail: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            },
            {
                _id: 'r-logesh-3',
                title: 'Margaret River Vineyard',
                location: 'Western Australia',
                aiMatch: 98,
                insight: 'Soil analysis indicates 92% suitability for premium Cabernet Sauvignon. Water rights pre-verified for 50 years.',
                likes: 2400,
                thumbnail: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            },
        ],
    },
};

// Also map by username
DEMO_AGENTS['prasanth_properties'] = DEMO_AGENTS['agent-1'];
DEMO_AGENTS['aswin.realty'] = DEMO_AGENTS['agent-2'];
DEMO_AGENTS['ig_vicky16'] = DEMO_AGENTS['agent-3'];
DEMO_AGENTS['the_akshtr_estate'] = DEMO_AGENTS['agent-4'];
DEMO_AGENTS['Bavadharini RS'] = DEMO_AGENTS['bavadharini_rs'];
DEMO_AGENTS['Amish'] = DEMO_AGENTS['amish'];
DEMO_AGENTS['Logeshwaran A'] = DEMO_AGENTS['logeshwarana'];

// Track in-memory follow status for demo agents
const demoFollows = new Set();

// Get a user's public profile + stats + their posts
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const viewerId = getAuthenticatedUserId(req);

        // Check if requesting a demo agent
        if (DEMO_AGENTS[id]) {
            const agent = DEMO_AGENTS[id];
            const isFollowing = demoFollows.has(`${viewerId}_${agent.id}`);
            return res.status(200).json({
                user: {
                    id: agent.id,
                    fullName: agent.fullName,
                    username: agent.username,
                    bio: agent.bio,
                    profilePicture: agent.profilePicture,
                },
                postCount: agent.posts.length,
                reelCount: (agent.reels || []).length,
                followerCount: agent.followerCount + (isFollowing ? 1 : 0),
                followingCount: agent.followingCount,
                isFollowing,
                isSelf: false,
                posts: agent.posts,
                reels: agent.reels || [],
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid user id.' });
        }

        const profileUser = await User.findById(id).select('fullName username profilePicture bio followers following');
        if (!profileUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const [postCount, posts] = await Promise.all([
            Post.countDocuments({ author: id }),
            Post.find({ author: id }).populate('author', 'fullName username profilePicture').sort({ createdAt: -1 }),
        ]);

        const isFollowing = (profileUser.followers || []).some((f) => f.toString() === viewerId);

        return res.status(200).json({
            user: {
                id: profileUser._id,
                fullName: profileUser.fullName,
                username: profileUser.username,
                bio: profileUser.bio || '',
                profilePicture: profileUser.profilePicture,
            },
            postCount,
            followerCount: (profileUser.followers || []).length,
            followingCount: (profileUser.following || []).length,
            isFollowing,
            isSelf: viewerId === id,
            posts,
        });
    } catch (error) {
        console.error('GET USER PROFILE ERROR:', error);
        return res.status(500).json({ message: 'Failed to load profile.', error: error.message });
    }
});

// Follow / unfollow toggle
router.post('/:id/follow', authMiddleware, async (req, res) => {
    try {
        const viewerId = getAuthenticatedUserId(req);
        const { id } = req.params;

        if (DEMO_AGENTS[id]) {
            const agent = DEMO_AGENTS[id];
            const key = `${viewerId}_${agent.id}`;
            const isFollowing = demoFollows.has(key);
            if (isFollowing) {
                demoFollows.delete(key);
            } else {
                demoFollows.add(key);
            }
            return res.status(200).json({
                isFollowing: !isFollowing,
                followerCount: agent.followerCount + (!isFollowing ? 1 : 0),
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid user id.' });
        if (viewerId === id) return res.status(400).json({ message: "You can't follow yourself." });

        const [target, viewer] = await Promise.all([User.findById(id), User.findById(viewerId)]);
        if (!target || !viewer) return res.status(404).json({ message: 'User not found.' });

        target.followers = target.followers || [];
        viewer.following = viewer.following || [];

        const alreadyFollowing = target.followers.some((f) => f.toString() === viewerId);
        if (alreadyFollowing) {
            target.followers = target.followers.filter((f) => f.toString() !== viewerId);
            viewer.following = viewer.following.filter((f) => f.toString() !== id);
        } else {
            target.followers.push(viewerId);
            viewer.following.push(id);
        }

        await Promise.all([target.save(), viewer.save()]);

        return res.status(200).json({ isFollowing: !alreadyFollowing, followerCount: target.followers.length });
    } catch (error) {
        console.error('FOLLOW TOGGLE ERROR:', error);
        return res.status(500).json({ message: 'Failed to update follow status.', error: error.message });
    }
});

module.exports = router;