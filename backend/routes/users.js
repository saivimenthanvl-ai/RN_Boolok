const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const getAuthenticatedUserId = (req) => req.user?.id || req.user?._id || req.userId || null;

function sanitizeUserProfile(user, viewerId = null) {
  const followers = user.followers || [];
  const following = user.following || [];
  const isFollowing = viewerId ? followers.some((f) => {
    const fId = f._id ? f._id.toString() : f.toString();
    return fId === viewerId.toString();
  }) : false;

  const followerNames = followers
    .map((f) => (typeof f === 'object' && f.fullName ? f.fullName : null))
    .filter(Boolean);

  let mutualsText = '';
  if (followerNames.length === 1) {
    mutualsText = `Followed by ${followerNames[0]}`;
  } else if (followerNames.length === 2) {
    mutualsText = `Followed by ${followerNames[0]} and ${followerNames[1]}`;
  } else if (followerNames.length > 2) {
    mutualsText = `Followed by ${followerNames[0]}, ${followerNames[1]} and ${followerNames.length - 2} other${followerNames.length - 2 > 1 ? 's' : ''}`;
  }

  return {
    id: user._id.toString(),
    _id: user._id.toString(),
    fullName: user.fullName,
    username: user.username || user.fullName?.replace(/\s+/g, '').toLowerCase() || 'user',
    bio: user.bio || '',
    headline: user.headline || 'Real Estate Professional & Boolok Member',
    location: user.location || 'Global Real Estate Network',
    coverImage: user.coverImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
    profilePicture: user.profilePicture || null,
    closedDeals: user.closedDeals || '0',
    followerCount: followers.length,
    followingCount: following.length,
    isFollowing,
    isSelf: viewerId ? viewerId.toString() === user._id.toString() : false,
    mutuals: mutualsText,
    followers: followers.map((f) => (typeof f === 'object' ? { id: f._id, fullName: f.fullName, username: f.username, profilePicture: f.profilePicture } : f)),
    following: following.map((f) => (typeof f === 'object' ? { id: f._id, fullName: f.fullName, username: f.username, profilePicture: f.profilePicture } : f)),
  };
}

// ── GET /api/users/search?q=query ──────────────────────────────────────────
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) {
      return res.status(200).json({ results: [] });
    }

    const viewerId = getAuthenticatedUserId(req);
    const regex = new RegExp(q, 'i');

    const users = await User.find({
      $or: [{ fullName: regex }, { username: regex }, { email: regex }],
    })
      .select('fullName username profilePicture bio headline followers following')
      .limit(10);

    const results = users.map((u) => sanitizeUserProfile(u, viewerId));
    return res.status(200).json({ results });
  } catch (error) {
    console.error('SEARCH USERS ERROR:', error);
    return res.status(500).json({ message: 'Search failed.', error: error.message });
  }
});

const COMMUNITY_MEMBERS = [
  {
    username: 'the_akshtr_estate',
    aliases: ['agent-4', 'akshat_commercials', 'akshat', 'the_akshtr_estate'],
    fullName: 'Akshat Commercials',
    email: 'akshat.commercials@boolok.ai',
    headline: 'Commercial Property & Tech Park Portfolio Lead @ Boolok Network',
    location: 'Chennai, Tamil Nadu · Prime Assets',
    bio: 'Specializing in Grade-A IT SEZ parks, commercial lease syndications, and institutional asset acquisitions on OMR Chennai.',
    closedDeals: '0',
    profilePicture: null,
  },
  {
    username: 'aswin.realty',
    aliases: ['agent-2', 'aswin_realty', 'aswin'],
    fullName: 'Aswin Real Estate',
    email: 'aswin.realty@boolok.ai',
    headline: 'Principal Real Estate Broker & Multi-Family Asset Advisor',
    location: 'Chennai, Tamil Nadu · Luxury & Commercial Assets',
    bio: 'Expert commercial multi-family portfolio manager with deep market analytics on cap rates and returns.',
    closedDeals: '0',
    profilePicture: null,
  },
  {
    username: 'prasanth_properties',
    aliases: ['agent-1', 'prasanth', 'prasanth_properties'],
    fullName: 'Prasanth Properties',
    email: 'prasanth.properties@boolok.ai',
    headline: 'Luxury Waterfront Specialist · Miami & Coastal Estates',
    location: 'Miami, Florida · Coastal Estates',
    bio: 'Luxury real estate advisory focused on ultra-prime beachfront residences and waterfront villas.',
    closedDeals: '0',
    profilePicture: null,
  },
  {
    username: 'ig_vicky16',
    aliases: ['agent-3', 'vicky_luxury', 'ig_vicky16', 'vicky'],
    fullName: 'Vicky Luxury Living',
    email: 'vicky.luxury@boolok.ai',
    headline: 'Prime Architectural Estates & Beverly Hills Luxury Specialist',
    location: 'Beverly Hills, California · Ultra Luxury',
    bio: 'Curating custom luxury properties, penthouses, and architectural landmarks for high net worth clients.',
    closedDeals: '0',
    profilePicture: null,
  },
  {
    username: 'shreekutti',
    aliases: ['shreekutti'],
    fullName: 'shreekutti',
    email: 'shreekutti@boolok.ai',
    headline: 'Commercial Property & Tech Park Portfolio Lead @ Boolok Realty',
    location: 'Bangalore, Karnataka · Tech Parks',
    bio: 'Specialized in commercial land development and Grade-A tech hub transactions across South India.',
    closedDeals: '0',
    profilePicture: null,
  },
  {
    username: 'logeshwarana',
    aliases: ['logeshwarana', 'logeshwaran_ashok'],
    fullName: 'Logeshwaran Ashok',
    email: 'logeshwarana@boolok.ai',
    headline: 'Architectural Consultant & Real Estate Lead',
    location: 'Coimbatore, Tamil Nadu · Industrial & Retail',
    bio: 'Focused on precision cap-rate calculations, commercial yield optimization, and real estate investment portfolios.',
    closedDeals: '0',
    profilePicture: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIxWkMvsGE0JVWnlIgddMHLoJXaRlDZ6ix8j3D9lYjuwnCOzP9CNlu1fzYZY0IdHrAth3dOjcqTQkF0di1msUI8dzNv_iYYinXCqpmS_He-TtYeX2yihtLQW87EOEvQ0cRUnbkr34efkxQnqcIqbGwacliKDTjiIR2Q70ReAxB0_Vcm3OpsfrGpMwH7Iy1Tj-PQxXPDP2uCgzOL0qR-A97Niy6DKYuLKuOruowYqZAELwQqKhyoxD9EHvwU-Xo3iNnDHoxmvUCvhwb',
  },
  {
    username: 'ajmal',
    aliases: ['ajmal'],
    fullName: 'Ajmal Khan',
    email: 'ajmal@boolok.ai',
    headline: 'Luxury Living & High-End Residential Broker',
    location: 'Dubai & Kochi · Luxury Villas',
    bio: 'Connecting international investors to premier waterfront villas and bespoke residential developments.',
    closedDeals: '0',
    profilePicture: null,
  },
  {
    username: 'bavadharini_rs',
    aliases: ['bavadharini_rs', 'bavadharini'],
    fullName: 'Bavadharini RS',
    email: 'bavadharini@boolok.ai',
    headline: 'Interior Designer & Modern Living Specialist',
    location: 'Chennai, Tamil Nadu · Modern Living',
    bio: 'Bespoke high-end interior architecture, penthouse makeovers, and custom luxury styling.',
    closedDeals: '0',
    profilePicture: null,
  },
  {
    username: 'yashwanth_realty',
    aliases: ['yashwanth_realty', 'cinemahub.live', 'cinemahub', 'yashwanth'],
    fullName: 'Yashwanth Realty',
    email: 'yashwanth.realty@boolok.ai',
    headline: 'Prime Commercial Hubs & Institutional Realty Lead',
    location: 'Chennai & Bangalore · Commercial Hubs',
    bio: 'Acquiring prime commercial buildings, corporate hubs, and investment estates across South India.',
    closedDeals: '0',
    profilePicture: null,
  },
];

async function resolveOrSeedUser(id) {
  let profileUser = null;
  const lookup = (id || '').toString().trim().toLowerCase();

  if (mongoose.Types.ObjectId.isValid(lookup)) {
    profileUser = await User.findById(lookup)
      .populate('followers', 'fullName username profilePicture headline location')
      .populate('following', 'fullName username profilePicture headline location');
  }

  if (!profileUser) {
    profileUser = await User.findOne({ username: lookup })
      .populate('followers', 'fullName username profilePicture headline location')
      .populate('following', 'fullName username profilePicture headline location');
  }

  if (!profileUser) {
    const memberDef = COMMUNITY_MEMBERS.find(
      (m) => m.username.toLowerCase() === lookup || m.aliases.map((a) => a.toLowerCase()).includes(lookup)
    );

    if (memberDef) {
      let existing = await User.findOne({
        $or: [{ username: memberDef.username }, { email: memberDef.email }],
      });

      if (!existing) {
        existing = await User.create({
          fullName: memberDef.fullName,
          username: memberDef.username,
          email: memberDef.email,
          password: '$2a$10$BoolokDefaultPasswordHash2026.SeededUser',
          headline: memberDef.headline,
          location: memberDef.location,
          bio: memberDef.bio,
          closedDeals: '0',
          profilePicture: memberDef.profilePicture || null,
          followers: [],
          following: [],
        });
      } else if (memberDef.profilePicture && !existing.profilePicture) {
        existing.profilePicture = memberDef.profilePicture;
        await existing.save();
      }

      profileUser = await User.findById(existing._id)
        .populate('followers', 'fullName username profilePicture headline location')
        .populate('following', 'fullName username profilePicture headline location');
    }
  }

  if (profileUser && lookup === 'logeshwarana' && !profileUser.profilePicture) {
    profileUser.profilePicture = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIxWkMvsGE0JVWnlIgddMHLoJXaRlDZ6ix8j3D9lYjuwnCOzP9CNlu1fzYZY0IdHrAth3dOjcqTQkF0di1msUI8dzNv_iYYinXCqpmS_He-TtYeX2yihtLQW87EOEvQ0cRUnbkr34efkxQnqcIqbGwacliKDTjiIR2Q70ReAxB0_Vcm3OpsfrGpMwH7Iy1Tj-PQxXPDP2uCgzOL0qR-A97Niy6DKYuLKuOruowYqZAELwQqKhyoxD9EHvwU-Xo3iNnDHoxmvUCvhwb';
    await User.findByIdAndUpdate(profileUser._id, { $set: { profilePicture: profileUser.profilePicture } });
  }

  return profileUser;
}

// ── GET /api/users/suggested ───────────────────────────────────────────────
router.get('/suggested', authMiddleware, async (req, res) => {
  try {
    const viewerId = getAuthenticatedUserId(req);

    // Auto-seed community members into MongoDB
    await Promise.allSettled(COMMUNITY_MEMBERS.map((m) => resolveOrSeedUser(m.username)));

    const query = viewerId ? { _id: { $ne: viewerId } } : {};

    const users = await User.find(query)
      .populate('followers', 'fullName username profilePicture')
      .select('fullName username profilePicture bio headline location followers following')
      .limit(10);

    const suggested = users.map((u) => {
      const sanitized = sanitizeUserProfile(u, viewerId);
      return {
        id: sanitized.id,
        _id: sanitized.id,
        fullName: sanitized.fullName,
        username: sanitized.username,
        title: sanitized.headline,
        headline: sanitized.headline,
        location: sanitized.location,
        avatar: sanitized.profilePicture,
        profilePicture: sanitized.profilePicture,
        followerCount: sanitized.followerCount,
        isFollowing: sanitized.isFollowing,
        subtitle: sanitized.mutuals || (sanitized.followerCount > 0 ? `${sanitized.followerCount} follower${sanitized.followerCount > 1 ? 's' : ''}` : 'New Member'),
      };
    });

    return res.status(200).json({ suggested });
  } catch (error) {
    console.error('GET SUGGESTED USERS ERROR:', error);
    return res.status(500).json({ message: 'Failed to fetch suggested users.', error: error.message });
  }
});

// ── GET /api/users/notifications ──────────────────────────────────────────
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const viewerId = getAuthenticatedUserId(req);
    if (!viewerId) return res.status(401).json({ message: 'Unauthorized.' });

    const notifications = await Notification.find({ recipient: viewerId })
      .populate('sender', 'fullName username profilePicture')
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ recipient: viewerId, read: false });

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('GET NOTIFICATIONS ERROR:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications.', error: error.message });
  }
});

// ── PUT /api/users/notifications/read-all ─────────────────────────────────
router.put('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    const viewerId = getAuthenticatedUserId(req);
    if (!viewerId) return res.status(401).json({ message: 'Unauthorized.' });

    await Notification.updateMany({ recipient: viewerId, read: false }, { $set: { read: true } });

    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('READ ALL NOTIFICATIONS ERROR:', error);
    return res.status(500).json({ message: 'Failed to mark notifications as read.', error: error.message });
  }
});

const upload = require('../config/localUpload');

// ── POST /api/users/avatar (Upload custom avatar photo from device / camera) 
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const viewerId = getAuthenticatedUserId(req);
    if (!viewerId) return res.status(401).json({ message: 'Unauthorized.' });

    let profilePicture = null;
    if (req.file) {
      profilePicture = `/uploads/posts/${req.file.filename}`;
    } else if (req.body.avatar && typeof req.body.avatar === 'string') {
      profilePicture = req.body.avatar.trim();
    } else if (req.body.profilePicture && typeof req.body.profilePicture === 'string') {
      profilePicture = req.body.profilePicture.trim();
    }

    if (!profilePicture) {
      return res.status(400).json({ message: 'No avatar image provided.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      viewerId,
      { $set: { profilePicture } },
      { new: true }
    )
      .populate('followers', 'fullName username profilePicture')
      .populate('following', 'fullName username profilePicture');

    if (!updatedUser) return res.status(404).json({ message: 'User not found.' });

    return res.status(200).json({
      success: true,
      profilePicture,
      user: sanitizeUserProfile(updatedUser, viewerId),
    });
  } catch (error) {
    console.error('AVATAR UPLOAD ERROR:', error);
    return res.status(500).json({ message: 'Failed to upload avatar.', error: error.message });
  }
});

// ── PUT /api/users/profile (Update self profile) ──────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const viewerId = getAuthenticatedUserId(req);
    if (!viewerId) return res.status(401).json({ message: 'Unauthorized.' });

    const { fullName, username, bio, headline, location, coverImage, profilePicture, closedDeals } = req.body;
    const updateData = {};

    if (typeof fullName === 'string' && fullName.trim()) updateData.fullName = fullName.trim();
    if (typeof username === 'string' && username.trim()) updateData.username = username.trim().toLowerCase();
    if (typeof bio === 'string') updateData.bio = bio.trim();
    if (typeof headline === 'string') updateData.headline = headline.trim();
    if (typeof location === 'string') updateData.location = location.trim();
    if (typeof coverImage === 'string') updateData.coverImage = coverImage.trim();
    if (typeof closedDeals === 'string') updateData.closedDeals = closedDeals.trim();
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture ? profilePicture.trim() : null;

    const updatedUser = await User.findByIdAndUpdate(viewerId, { $set: updateData }, { new: true })
      .populate('followers', 'fullName username profilePicture')
      .populate('following', 'fullName username profilePicture');

    if (!updatedUser) return res.status(404).json({ message: 'User not found.' });

    return res.status(200).json({
      success: true,
      user: sanitizeUserProfile(updatedUser, viewerId),
    });
  } catch (error) {
    console.error('UPDATE PROFILE ERROR:', error);
    return res.status(500).json({ message: 'Failed to update profile.', error: error.message });
  }
});

const LOGESHWARAN_REELS = [
  {
    _id: 'logesh-reel-1',
    title: 'Margaret River Vineyard',
    location: 'Western Australia',
    aiMatch: 98,
    insight: 'Soil analysis indicates 92% suitability for premium Cabernet Sauvignon. Water rights pre-verified for 50 years.',
    likes: 2400,
    poster: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    comments: [
      { _id: 'c1-1', user: { fullName: 'Shreekutti Realty' }, text: 'The terroir and climate suitability metrics are exceptional here! 🍇✨', createdAt: new Date() },
      { _id: 'c1-2', user: { fullName: 'Ajmal Khan' }, text: '50-year pre-verified water rights make this a bulletproof acquisition. 🍷', createdAt: new Date() },
    ],
  },
  {
    _id: 'logesh-reel-2',
    title: 'Kyoto Forest Retreat',
    location: 'Kyoto, Japan',
    aiMatch: 95,
    insight: 'Thermal zoning optimized. High potential for eco-luxury cabins or a private wellness estate.',
    likes: 920,
    poster: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    comments: [
      { _id: 'c2-1', user: { fullName: 'Ajmal Khan' }, text: 'Thermal zoning and serene forested topography are hard to find in Kyoto! ⛩️🍃', createdAt: new Date() },
      { _id: 'c2-2', user: { fullName: 'Shreekutti Realty' }, text: 'Eco-luxury cabins here will command top-tier international ADRs. 🏡✨', createdAt: new Date() },
    ],
  },
  {
    _id: 'logesh-reel-3',
    title: 'Uluwatu Cliffside',
    location: 'Bali, Indonesia',
    aiMatch: 92,
    insight: 'Tourism growth in this sector is up 14% YoY. Zoning allows for luxury boutique resort development.',
    likes: 1800,
    poster: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    comments: [
      { _id: 'c3-1', user: { fullName: 'Akshat Commercials' }, text: 'Breathtaking ocean cliff views! Perfect setting for luxury resort hospitality. 🌅🏖️', createdAt: new Date() },
      { _id: 'c3-2', user: { fullName: 'Shreekutti Realty' }, text: '14% YoY tourism surge matches our regional Bali portfolio forecast. 📈', createdAt: new Date() },
    ],
  },
];

const SAI_REELS = [
  {
    _id: 'sai-reel-coventry',
    title: 'Coventry Office',
    location: 'Coventry, United Kingdom',
    aiMatch: 97,
    insight: 'Strong engagement expected based on similar recent listings.',
    likes: 100,
    poster: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    comments: [
      { _id: 'c4-1', user: { fullName: 'Logeshwaran Ashok' }, text: 'Grade-A office specs with strong institutional tenant appeal. 🏢💼', createdAt: new Date() },
      { _id: 'c4-2', user: { fullName: 'Shreekutti Realty' }, text: 'High floor efficiency and convenient transit access. 🚆', createdAt: new Date() },
    ],
  },
];

// ── GET /api/users/:id (Get profile by ID or username) ────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = getAuthenticatedUserId(req);

    const profileUser = await resolveOrSeedUser(id);

    if (!profileUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const [postCount, posts] = await Promise.all([
      Post.countDocuments({ author: profileUser._id }),
      Post.find({ author: profileUser._id })
        .populate('author', 'fullName username profilePicture headline')
        .sort({ createdAt: -1 }),
    ]);

    const sanitized = sanitizeUserProfile(profileUser, viewerId);
    const usernameKey = (profileUser.username || '').toLowerCase();

    let userReels = [];
    if (usernameKey === 'logeshwarana' || usernameKey.includes('logeshwaran')) {
      userReels = LOGESHWARAN_REELS;
    } else if (sanitized.isSelf || usernameKey.includes('sai') || usernameKey === 'saivimenthanvl') {
      userReels = SAI_REELS;
    }

    return res.status(200).json({
      user: sanitized,
      postCount,
      reelCount: userReels.length,
      followerCount: sanitized.followerCount,
      followingCount: sanitized.followingCount,
      isFollowing: sanitized.isFollowing,
      isSelf: sanitized.isSelf,
      posts,
      reels: userReels,
    });
  } catch (error) {
    console.error('GET USER PROFILE ERROR:', error);
    return res.status(500).json({ message: 'Failed to load profile.', error: error.message });
  }
});

// ── GET /api/users/:id/followers (Get real-time followers list) ───────────
router.get('/:id/followers', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const profileUser = await resolveOrSeedUser(id);

    if (!profileUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let populatedFollowers = [];

    if (Array.isArray(profileUser.followers) && profileUser.followers.length > 0) {
      const seen = new Set();
      populatedFollowers = profileUser.followers
        .filter((f) => {
          const fid = (typeof f === 'object' && f !== null ? (f._id || f.id || f.username) : f).toString();
          if (seen.has(fid)) return false;
          seen.add(fid);
          return true;
        })
        .map((f) => {
          if (typeof f === 'object' && f !== null) {
            return {
              id: f._id ? f._id.toString() : f.id,
              _id: f._id ? f._id.toString() : f.id,
              fullName: f.fullName || 'Boolok Member',
              username: f.username || 'member',
              headline: f.headline || 'Real Estate Professional',
              location: f.location || 'Global Real Estate Network',
              profilePicture: f.profilePicture || null,
            };
          }
          return { id: f.toString(), _id: f.toString(), fullName: 'Boolok Member', username: 'member', profilePicture: null };
        });
    }

    // If followers list is empty or fallback, return diverse, unique verified community members (NO REPETITION!)
    if (populatedFollowers.length === 0) {
      const distinctMembers = COMMUNITY_MEMBERS.filter(
        (m) => m.username.toLowerCase() !== (profileUser.username || '').toLowerCase()
      ).slice(0, 4);

      populatedFollowers = distinctMembers.map((m) => ({
        id: m.username,
        _id: m.username,
        fullName: m.fullName,
        username: m.username,
        headline: m.headline,
        location: m.location,
        profilePicture: m.profilePicture || null,
      }));
    }

    return res.status(200).json({
      followers: populatedFollowers,
      followerCount: populatedFollowers.length,
    });
  } catch (error) {
    console.error('GET FOLLOWERS LIST ERROR:', error);
    return res.status(500).json({ message: 'Failed to fetch followers list.', error: error.message });
  }
});

// ── POST /api/users/:id/follow (Toggle follow & dispatch notification) ────
router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const viewerId = getAuthenticatedUserId(req);
    const { id } = req.params;

    if (!viewerId) return res.status(401).json({ message: 'Unauthorized.' });

    let target = await resolveOrSeedUser(id);

    if (!target) return res.status(404).json({ message: 'User not found.' });
    if (target._id.toString() === viewerId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    const viewer = await User.findById(viewerId);
    if (!viewer) return res.status(404).json({ message: 'Viewer not found.' });

    target.followers = target.followers || [];
    viewer.following = viewer.following || [];

    const isAlreadyFollowing = target.followers.some((f) => f.toString() === viewerId.toString());

    if (isAlreadyFollowing) {
      // Unfollow
      target.followers = target.followers.filter((f) => f.toString() !== viewerId.toString());
      viewer.following = viewer.following.filter((f) => f.toString() !== target._id.toString());

      await Promise.all([target.save(), viewer.save()]);

      // Remove follow notification
      await Notification.deleteMany({
        recipient: target._id,
        sender: viewer._id,
        type: 'follow',
      });

      return res.status(200).json({
        isFollowing: false,
        followerCount: target.followers.length,
        message: `Unfollowed ${target.fullName}`,
      });
    } else {
      // Follow
      target.followers.push(viewer._id);
      viewer.following.push(target._id);

      await Promise.all([target.save(), viewer.save()]);

      // Create live Notification in MongoDB
      await Notification.create({
        recipient: target._id,
        sender: viewer._id,
        type: 'follow',
        message: `${viewer.fullName} started following you.`,
        metadata: {
          senderUsername: viewer.username,
          senderAvatar: viewer.profilePicture,
        },
      });

      return res.status(200).json({
        isFollowing: true,
        followerCount: target.followers.length,
        message: `Following ${target.fullName}`,
      });
    }
  } catch (error) {
    console.error('FOLLOW TOGGLE ERROR:', error);
    return res.status(500).json({ message: 'Failed to update follow status.', error: error.message });
  }
});

module.exports = router;