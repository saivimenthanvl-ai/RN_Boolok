const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const getAuthenticatedUserId = (req) => req.user?.id || req.user?._id || req.userId || null;

function sanitizeUserProfile(user, viewerId = null) {
  const rawFollowers = user.followers || [];
  const rawFollowing = user.following || [];

  // Deduplicate followers by id
  const seenFids = new Set();
  const followers = [];
  for (const f of rawFollowers) {
    const fId = f && f._id ? f._id.toString() : String(f || '');
    if (!fId || seenFids.has(fId)) continue;
    seenFids.add(fId);
    followers.push(f);
  }

  const isFollowing = viewerId
    ? followers.some((f) => {
        const fId = f._id ? f._id.toString() : f.toString();
        return fId === viewerId.toString();
      })
    : false;

  // Deduplicate follower display names strictly
  const seenNames = new Set();
  const followerNames = [];
  for (const f of followers) {
    if (typeof f === 'object' && f && f.fullName) {
      const name = f.fullName.trim();
      if (!seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        followerNames.push(name);
      }
    }
  }

  let mutualsText = '';
  if (followerNames.length === 1) {
    mutualsText = `Followed by ${followerNames[0]}`;
  } else if (followerNames.length === 2) {
    mutualsText = `Followed by ${followerNames[0]} and ${followerNames[1]}`;
  } else if (followerNames.length === 3) {
    mutualsText = `Followed by ${followerNames[0]}, ${followerNames[1]} and 1 other`;
  } else if (followerNames.length > 3) {
    mutualsText = `Followed by ${followerNames[0]}, ${followerNames[1]} and ${followerNames.length - 2} others`;
  }

  const followerCount = followers.length > 0 ? followers.length : 4;
  const followingCount = rawFollowing.length > 0 ? rawFollowing.length : 4;

  return {
    id: user._id.toString(),
    _id: user._id.toString(),
    fullName: user.fullName,
    username: user.username || user.fullName?.replace(/\s+/g, '').toLowerCase() || 'user',
    bio: user.bio || '',
    headline: user.headline || 'Real Estate Professional & Boolok Member',
    location: user.location || 'Chennai, Tamil Nadu · Prime Assets',
    coverImage: user.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    profilePicture: user.profilePicture || ((user.username || '').includes('sai') ? 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c' : null),
    closedDeals: user.closedDeals || '12',
    followerCount,
    followingCount,
    isFollowing,
    isSelf: viewerId ? viewerId.toString() === user._id.toString() : false,
    mutuals: mutualsText || `${followerCount} followers in Boolok Real Estate Network`,
    followers: followers.map((f) => (typeof f === 'object' ? { id: f._id, fullName: f.fullName, username: f.username, profilePicture: f.profilePicture } : f)),
    following: rawFollowing.map((f) => (typeof f === 'object' ? { id: f._id, fullName: f.fullName, username: f.username, profilePicture: f.profilePicture } : f)),
  };
}

// ── GET /api/users/search?q=query ──────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) {
      return res.status(200).json({ results: [] });
    }

    let viewerId = null;
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'boolok_secret_key_2026');
        viewerId = decoded.id || decoded._id;
      }
    } catch (_) {}

    const regex = new RegExp(q, 'i');

    const users = await User.find({
      $or: [
        { fullName: regex },
        { username: regex },
        { email: regex },
        { headline: regex },
        { location: regex },
      ],
    })
      .select('fullName username profilePicture bio headline location closedDeals followers following')
      .limit(10);

    const results = users.map((u) => sanitizeUserProfile(u, viewerId));

    const memberMatches = COMMUNITY_MEMBERS.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q.toLowerCase()) ||
        m.username.toLowerCase().includes(q.toLowerCase()) ||
        m.headline.toLowerCase().includes(q.toLowerCase()) ||
        (m.location && m.location.toLowerCase().includes(q.toLowerCase()))
    );

    const seenUsernames = new Set(results.map((r) => (r.username || '').toLowerCase()));
    for (const m of memberMatches) {
      if (!seenUsernames.has(m.username.toLowerCase())) {
        seenUsernames.add(m.username.toLowerCase());
        results.push({
          id: m.username,
          _id: m.username,
          fullName: m.fullName,
          username: m.username,
          headline: m.headline,
          location: m.location,
          profilePicture: m.profilePicture || null,
          followerCount: 4,
          isFollowing: false,
          isSelf: false,
        });
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error('SEARCH USERS ERROR:', error);
    return res.status(500).json({ message: 'Search failed.', error: error.message });
  }
});

const COMMUNITY_MEMBERS = [
  {
    username: 'shreekutti',
    aliases: ['shreekutti'],
    fullName: 'Shreekutti',
    email: 'shreekutti@boolok.ai',
    headline: 'Commercial Property & Tech Park Portfolio Lead @ Boolok Realty',
    location: 'Bangalore, Karnataka · Tech Parks',
    bio: 'Specialized in commercial land development and Grade-A tech hub transactions across South India.',
    closedDeals: '18',
    profilePicture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
  },
  {
    username: 'logeshwarana',
    aliases: ['logeshwarana', 'logeshwaran_ashok', 'logeshwaran'],
    fullName: 'Logeshwaran A',
    email: 'waranlogesh0406@gmail.com',
    headline: 'Architectural Consultant & Real Estate Lead',
    location: 'Western Australia',
    bio: 'Focused on precision cap-rate calculations, commercial yield optimization, and real estate investment portfolios.',
    closedDeals: '22',
    profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r=s96-c',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
  },
  {
    username: 'ajmal',
    aliases: ['ajmal', 'mohammed_ajmal'],
    fullName: 'Mohammed Ajmal',
    email: 'ajmal@boolok.ai',
    headline: 'Luxury Living & High-End Residential Broker',
    location: 'Dubai & Kochi · Luxury Villas',
    bio: 'Connecting international investors to premier waterfront villas and bespoke residential developments.',
    closedDeals: '14',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
  },
  {
    username: 'bavadharini_rs',
    aliases: ['bavadharini_rs', 'bavadharini'],
    fullName: 'Bavadharini RS',
    email: 'bavadharini@boolok.ai',
    headline: 'Interior Designer & Modern Living Specialist',
    location: 'Chennai, Tamil Nadu · Modern Living',
    bio: 'Bespoke high-end interior architecture, penthouse makeovers, and custom luxury styling.',
    closedDeals: '16',
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    coverImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200',
  },
  {
    username: 'the_akshtr_estate',
    aliases: ['agent-4', 'akshat_commercials', 'akshat', 'the_akshtr_estate'],
    fullName: 'Akshat Commercials',
    email: 'akshat.commercials@boolok.ai',
    headline: 'Commercial Property & Tech Park Portfolio Lead @ Boolok Network',
    location: 'Chennai, Tamil Nadu · Prime Assets',
    bio: 'Specializing in Grade-A IT SEZ parks, commercial lease syndications, and institutional asset acquisitions on OMR Chennai.',
    closedDeals: '29',
    profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
    coverImage: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
  },
  {
    username: 'prasanth_properties',
    aliases: ['agent-1', 'prasanth', 'prasanth_properties'],
    fullName: 'Prasanth Properties',
    email: 'prasanth.properties@boolok.ai',
    headline: 'Luxury Waterfront Specialist · Miami & Coastal Estates',
    location: 'Miami, Florida · Coastal Estates',
    bio: 'Luxury real estate advisory focused on ultra-prime beachfront residences and waterfront villas.',
    closedDeals: '11',
    profilePicture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
    coverImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200',
  },
  {
    username: 'aswin.realty',
    aliases: ['agent-2', 'aswin_realty', 'aswin'],
    fullName: 'Aswin Real Estate',
    email: 'aswin.realty@boolok.ai',
    headline: 'Principal Real Estate Broker & Multi-Family Asset Advisor',
    location: 'Chennai, Tamil Nadu · Luxury & Commercial Assets',
    bio: 'Expert commercial multi-family portfolio manager with deep market analytics on cap rates and returns.',
    closedDeals: '15',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
  },
  {
    username: 'ig_vicky16',
    aliases: ['agent-3', 'vicky_luxury', 'ig_vicky16', 'vicky'],
    fullName: 'Vicky Luxury Living',
    email: 'vicky.luxury@boolok.ai',
    headline: 'Prime Architectural Estates & Beverly Hills Luxury Specialist',
    location: 'Beverly Hills, California · Ultra Luxury',
    bio: 'Curating custom luxury properties, penthouses, and architectural landmarks for high net worth clients.',
    closedDeals: '11',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
  },
  {
    username: 'yashwanth_realty',
    aliases: ['yashwanth_realty', 'cinemahub.live', 'cinemahub', 'yashwanth'],
    fullName: 'Yashwanth Realty',
    email: 'yashwanth.realty@boolok.ai',
    headline: 'Prime Commercial Hubs & Institutional Realty Lead',
    location: 'Chennai & Bangalore · Commercial Hubs',
    bio: 'Acquiring prime commercial buildings, corporate hubs, and investment estates across South India.',
    closedDeals: '16',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
  },
  {
    username: 'saivimenthanvl',
    aliases: ['sai', 'saivimenthanvl', 'saivimenthan'],
    fullName: 'Sai',
    email: 'saivimenthanvl@gmail.com',
    headline: 'Principal Real Estate Broker & Portfolio Advisor',
    location: 'Chennai, Tamil Nadu · Prime Assets',
    bio: 'Principal Broker overseeing premium residential estates, commercial office syndication, and institutional real estate acquisitions.',
    closedDeals: '12',
    profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
  },
];

async function resolveOrSeedUser(id) {
  let profileUser = null;
  const lookup = (id || '').toString().trim().toLowerCase();
  if (!lookup || lookup === 'self') return null;

  if (mongoose.Types.ObjectId.isValid(lookup)) {
    profileUser = await User.findById(lookup)
      .populate('followers', 'fullName username profilePicture headline location')
      .populate('following', 'fullName username profilePicture headline location');
  }

  if (!profileUser) {
    profileUser = await User.findOne({
      $or: [
        { username: lookup },
        { email: lookup },
      ]
    })
      .populate('followers', 'fullName username profilePicture headline location')
      .populate('following', 'fullName username profilePicture headline location');
  }

  if (!profileUser) {
    const memberDef = COMMUNITY_MEMBERS.find(
      (m) => m.username.toLowerCase() === lookup || (m.aliases && m.aliases.map((a) => a.toLowerCase()).includes(lookup))
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
          closedDeals: memberDef.closedDeals || '0',
          profilePicture: memberDef.profilePicture || null,
          coverImage: memberDef.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
          followers: [],
          following: [],
        });
      } else {
        let needsSave = false;
        if (memberDef.fullName && existing.fullName !== memberDef.fullName) {
          existing.fullName = memberDef.fullName;
          needsSave = true;
        }
        if (memberDef.headline && (!existing.headline || existing.headline.includes('Boolok Member'))) {
          existing.headline = memberDef.headline;
          needsSave = true;
        }
        if (memberDef.location && (!existing.location || existing.location.includes('Global'))) {
          existing.location = memberDef.location;
          needsSave = true;
        }
        if (memberDef.bio && !existing.bio) {
          existing.bio = memberDef.bio;
          needsSave = true;
        }
        if (memberDef.coverImage && !existing.coverImage) {
          existing.coverImage = memberDef.coverImage;
          needsSave = true;
        }
        if (needsSave) await existing.save();
      }

      profileUser = await User.findById(existing._id)
        .populate('followers', 'fullName username profilePicture headline location')
        .populate('following', 'fullName username profilePicture headline location');
    }
  }

  if (!profileUser && lookup && !mongoose.Types.ObjectId.isValid(lookup)) {
    let existing = await User.findOne({ username: lookup });
    if (!existing) {
      const generatedName = lookup.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      try {
        existing = await User.create({
          fullName: generatedName,
          username: lookup,
          email: `${lookup}@boolok.ai`,
          password: '$2a$10$BoolokDefaultPasswordHash2026.SeededUser',
          headline: 'Real Estate Professional & Boolok Member',
          location: 'Global Real Estate Network',
          bio: 'Real estate professional and advisor on the Boolok AI network.',
          closedDeals: '0',
          profilePicture: null,
          followers: [],
          following: [],
        });
      } catch (err) {
        existing = await User.findOne({ $or: [{ username: lookup }, { email: `${lookup}@boolok.ai` }] });
      }
    }
    if (existing) {
      profileUser = await User.findById(existing._id)
        .populate('followers', 'fullName username profilePicture headline location')
        .populate('following', 'fullName username profilePicture headline location');
    }
  }

  return profileUser;
}

async function ensureCommunityConnections() {
  try {
    // 1. Ensure all community members are in MongoDB with their full details
    for (const m of COMMUNITY_MEMBERS) {
      let user = await User.findOne({
        $or: [{ username: m.username }, { email: m.email }],
      });
      if (!user) {
        await User.create({
          fullName: m.fullName,
          username: m.username,
          email: m.email,
          password: '$2a$10$BoolokDefaultPasswordHash2026.SeededUser',
          headline: m.headline,
          location: m.location,
          bio: m.bio,
          closedDeals: m.closedDeals || '12',
          profilePicture: m.profilePicture || null,
          coverImage: m.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
          followers: [],
          following: [],
        });
      }
    }

    // 2. Fetch all seeded community members
    const seeded = await User.find({
      username: { $in: COMMUNITY_MEMBERS.map((m) => m.username) },
    });

    if (seeded.length < 2) return;

    // 3. Connect mutual followers for all community members
    for (const member of seeded) {
      if (member.username === 'logeshwarana') {
        const saiUser = await User.findOne({ username: 'saivimenthanvl' });
        if (saiUser) {
          member.followers = [saiUser._id];
          member.following = [saiUser._id];
          await member.save();
        }
        continue;
      }

      if (!member.followers || member.followers.length === 0) {
        const others = seeded.filter((o) => o._id.toString() !== member._id.toString() && o.username !== 'logeshwarana').slice(0, 4);
        member.followers = others.map((o) => o._id);
        await member.save();

        for (const other of others) {
          if (!other.following) other.following = [];
          if (!other.following.some((f) => f.toString() === member._id.toString())) {
            other.following.push(member._id);
            await other.save();
          }
        }
      }
    }
  } catch (err) {
    console.error('ensureCommunityConnections error:', err);
  }
}

// ── GET /api/users/suggested ───────────────────────────────────────────────
router.get('/suggested', authMiddleware, async (req, res) => {
  try {
    const viewerId = getAuthenticatedUserId(req);

    // Auto-seed community members into MongoDB with full relationships
    await ensureCommunityConnections();

    const query = {
      email: { $ne: 'logeshwarana@boolok.ai' },
      ...(viewerId ? { _id: { $ne: viewerId } } : {}),
    };

    const users = await User.find(query)
      .populate('followers', 'fullName username profilePicture')
      .select('fullName username email profilePicture bio headline location followers following')
      .limit(15);

    const seen = new Set();
    const suggested = [];

    for (const u of users) {
      const sanitized = sanitizeUserProfile(u, viewerId);
      const uname = (sanitized.username || sanitized.id || '').toLowerCase();
      const fname = (sanitized.fullName || '').toLowerCase();
      if (uname.includes('6a8dc') || fname.includes('6a8dc') || /^[0-9a-fA-F]{24}$/.test(uname)) continue;
      if (seen.has(uname)) continue;
      seen.add(uname);

      suggested.push({
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
      });
    }

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

// ── GET /api/users/:id/followers (Get real-time followers list) ───────────
router.get('/:id/followers', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    let profileUser = await resolveOrSeedUser(id);

    if (!profileUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!profileUser.followers || profileUser.followers.length === 0) {
      await ensureCommunityConnections();
      profileUser = await resolveOrSeedUser(id);
    }

    let populatedFollowers = [];

    if (Array.isArray(profileUser.followers) && profileUser.followers.length > 0) {
      const seen = new Set();
      populatedFollowers = profileUser.followers
        .filter((f) => {
          const fid = (typeof f === 'object' && f !== null ? (f._id || f.id || f.username) : f).toString();
          const uname = (typeof f === 'object' && f !== null ? (f.username || '') : '').toLowerCase();
          const fname = (typeof f === 'object' && f !== null ? (f.fullName || '') : '').toLowerCase();
          if (uname.includes('6a8dc') || fname.includes('6a8dc') || /^[0-9a-fA-F]{24}$/.test(uname)) return false;
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
              profilePicture: f.profilePicture || (((f.username || '').includes('sai')) ? 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c' : null),
            };
          }
          return { id: f.toString(), _id: f.toString(), fullName: 'Boolok Member', username: 'member', profilePicture: null };
        });
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

const COMMUNITY_DEALS = {
  shreekutti: [
    {
      id: 'd-shree-1',
      title: 'Grade-A Tech Park SEZ Tower A',
      location: 'Outer Ring Road, Bangalore',
      price: '$42,000,000',
      capRate: '8.4% Cap Rate',
      type: 'Institutional IT Campus',
      date: 'Aug 2026',
      status: 'Verified Institutional Settlement',
      sqft: '92,000 sq ft',
      icon: 'business',
    },
    {
      id: 'd-shree-2',
      title: 'Manyata Tech Park Commercial Wing',
      location: 'Hebbal, Bangalore',
      price: '$28,500,000',
      capRate: '8.1% Cap Rate',
      type: 'Grade-A Corporate Office',
      date: 'Jun 2026',
      status: 'Verified Institutional Settlement',
      sqft: '65,000 sq ft',
      icon: 'apartment',
    },
    {
      id: 'd-shree-3',
      title: 'Whitefield Corporate Center',
      location: 'Whitefield, Bangalore',
      price: '$19,200,000',
      capRate: '8.7% Cap Rate',
      type: '100% Leased Tech Hub',
      date: 'Apr 2026',
      status: 'Verified Institutional Settlement',
      sqft: '48,000 sq ft',
      icon: 'domain',
    },
    {
      id: 'd-shree-4',
      title: 'Electronic City Tech Hub Block B',
      location: 'Electronic City, Bangalore',
      price: '$14,800,000',
      capRate: '9.0% Cap Rate',
      type: 'Commercial Office Tower',
      date: 'Jan 2026',
      status: 'Verified Institutional Settlement',
      sqft: '36,000 sq ft',
      icon: 'location-city',
    },
  ],
  logeshwarana: [
    {
      id: 'd-logesh-1',
      title: 'Margaret River Commercial Vineyard',
      location: 'Western Australia',
      price: '$18,500,000',
      capRate: '7.8% Cap Rate',
      type: '140-Acre Agricultural Estate & Winery',
      date: 'Jul 2026',
      status: 'Verified Institutional Settlement',
      sqft: '140 Acres',
      icon: 'landscape',
    },
    {
      id: 'd-logesh-2',
      title: 'Kyoto Forest Eco-Luxury Retreat',
      location: 'Kyoto, Japan',
      price: '$12,400,000',
      capRate: '8.5% Cap Rate',
      type: 'Boutique Hospitality Estate',
      date: 'May 2026',
      status: 'Verified Institutional Settlement',
      sqft: '28,000 sq ft',
      icon: 'spa',
    },
    {
      id: 'd-logesh-3',
      title: 'Uluwatu Oceanfront Resort',
      location: 'Bali, Indonesia',
      price: '$24,000,000',
      capRate: '9.2% Cap Rate',
      type: 'Luxury Hospitality Parcel',
      date: 'Feb 2026',
      status: 'Verified Institutional Settlement',
      sqft: '85,000 sq ft',
      icon: 'beach-access',
    },
  ],
  ajmal: [
    {
      id: 'd-ajmal-1',
      title: 'Palm Jumeirah Signature Villa',
      location: 'Palm Jumeirah, Dubai, UAE',
      price: '$24,000,000',
      capRate: '6.5% Yield',
      type: 'Ultra-Luxury Beachfront Mansion',
      date: 'Aug 2026',
      status: 'Verified Institutional Settlement',
      sqft: '14,500 sq ft',
      icon: 'villa',
    },
    {
      id: 'd-ajmal-2',
      title: 'Emirates Hills Golf Course Estate',
      location: 'Dubai, UAE',
      price: '$18,200,000',
      capRate: '7.1% Yield',
      type: 'Private Gated Golf Villa',
      date: 'Jun 2026',
      status: 'Verified Institutional Settlement',
      sqft: '12,000 sq ft',
      icon: 'golf-course',
    },
    {
      id: 'd-ajmal-3',
      title: 'Marine Drive Waterfront Penthouse',
      location: 'Kochi, Kerala',
      price: '$6,500,000',
      capRate: '7.6% Yield',
      type: 'Luxury Panoramic Penthouse',
      date: 'Mar 2026',
      status: 'Verified Institutional Settlement',
      sqft: '6,800 sq ft',
      icon: 'house',
    },
  ],
  bavadharini_rs: [
    {
      id: 'd-bava-1',
      title: 'Poes Garden Ultra Luxury Penthouse',
      location: 'Poes Garden, Chennai, TN',
      price: '$6,200,000',
      capRate: '7.2% Yield',
      type: 'Bespoke Architectural Penthouse',
      date: 'Jul 2026',
      status: 'Verified Institutional Settlement',
      sqft: '5,800 sq ft',
      icon: 'home',
    },
    {
      id: 'd-bava-2',
      title: 'Boat Club Road Contemporary Estate',
      location: 'RA Puram, Chennai, TN',
      price: '$8,400,000',
      capRate: '6.8% Yield',
      type: 'Modern Custom Villa',
      date: 'May 2026',
      status: 'Verified Institutional Settlement',
      sqft: '7,200 sq ft',
      icon: 'deck',
    },
  ],
  the_akshtr_estate: [
    {
      id: 'd-akshat-1',
      title: 'OMR Cyber Park Tower B',
      location: 'OMR IT Corridor, Chennai, TN',
      price: '$35,000,000',
      capRate: '8.8% Cap Rate',
      type: 'Fortune 500 Leased IT Tower',
      date: 'Aug 2026',
      status: 'Verified Institutional Settlement',
      sqft: '110,000 sq ft',
      icon: 'business-center',
    },
    {
      id: 'd-akshat-2',
      title: 'Tidel Park Commercial Hub',
      location: 'Taramani, Chennai, TN',
      price: '$21,500,000',
      capRate: '8.4% Cap Rate',
      type: 'Grade-A Commercial Space',
      date: 'Jun 2026',
      status: 'Verified Institutional Settlement',
      sqft: '75,000 sq ft',
      icon: 'apartment',
    },
  ],
  prasanth_properties: [
    {
      id: 'd-prasanth-1',
      title: 'Star Island Waterfront Estate',
      location: 'Miami Beach, Florida',
      price: '$19,800,000',
      capRate: '6.2% Yield',
      type: 'Mega-Yacht Deepwater Villa',
      date: 'Jul 2026',
      status: 'Verified Institutional Settlement',
      sqft: '11,500 sq ft',
      icon: 'sailing',
    },
    {
      id: 'd-prasanth-2',
      title: 'Fisher Island Luxury Penthouse',
      location: 'Fisher Island, Miami, FL',
      price: '$14,500,000',
      capRate: '6.9% Yield',
      type: 'Private Island Luxury Condo',
      date: 'May 2026',
      status: 'Verified Institutional Settlement',
      sqft: '8,200 sq ft',
      icon: 'apartment',
    },
  ],
  sai: [
    {
      id: 'd-sai-1',
      title: 'Coventry Corporate Headquarters',
      location: 'Coventry, United Kingdom',
      price: '$16,500,000',
      capRate: '8.2% Cap Rate',
      type: 'Institutional Grade-A Office Hub',
      date: 'Aug 2026',
      status: 'Verified Institutional Settlement',
      sqft: '52,000 sq ft',
      icon: 'business',
    },
    {
      id: 'd-sai-2',
      title: 'Anna Nagar Prime Retail Flagship',
      location: 'Chennai, Tamil Nadu',
      price: '$9,200,000',
      capRate: '8.9% Cap Rate',
      type: 'High-Street Multi-Brand Retail',
      date: 'Jun 2026',
      status: 'Verified Institutional Settlement',
      sqft: '34,000 sq ft',
      icon: 'store',
    },
    {
      id: 'd-sai-3',
      title: 'OMR Expressway IT Campus Block A',
      location: 'Chennai, Tamil Nadu',
      price: '$26,000,000',
      capRate: '8.6% Cap Rate',
      type: 'Commercial Tech Park Syndication',
      date: 'Apr 2026',
      status: 'Verified Institutional Settlement',
      sqft: '88,000 sq ft',
      icon: 'domain',
    },
  ],
};

// ── GET /api/users/:id/deals (Get completed transaction history) ───────────
router.get('/:id/deals', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const profileUser = await resolveOrSeedUser(id);

    if (!profileUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const key = (profileUser.username || '').toLowerCase();
    let deals = [];
    if (COMMUNITY_DEALS[key]) {
      deals = COMMUNITY_DEALS[key];
    } else if (key.includes('sai') || profileUser._id.toString() === getAuthenticatedUserId(req)?.toString()) {
      deals = COMMUNITY_DEALS.sai;
    } else {
      deals = [
        {
          id: `d-${key}-1`,
          title: `${profileUser.fullName || 'Member'} Prime Commercial Acquisition`,
          location: profileUser.location || 'Global Real Estate Network',
          price: '$12,500,000',
          capRate: '8.4% Cap Rate',
          type: 'Institutional Commercial Asset',
          date: '2026',
          status: 'Verified Institutional Settlement',
          sqft: '45,000 sq ft',
          icon: 'business',
        },
      ];
    }

    return res.status(200).json({
      deals,
      totalDeals: profileUser.closedDeals || deals.length.toString(),
      fullName: profileUser.fullName,
    });
  } catch (error) {
    console.error('GET CLOSED DEALS ERROR:', error);
    return res.status(500).json({ message: 'Failed to fetch deals.', error: error.message });
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
      { _id: 'c4-1', user: { fullName: 'Logeshwaran A' }, text: 'Grade-A office specs with strong institutional tenant appeal. 🏢💼', createdAt: new Date() },
      { _id: 'c4-2', user: { fullName: 'Shreekutti Realty' }, text: 'High floor efficiency and convenient transit access. 🚆', createdAt: new Date() },
    ],
  },
];

const COMMUNITY_POSTS_MAP = {
  shreekutti: [
    {
      _id: 'shree-p-1',
      title: 'Grade-A Commercial IT Campus',
      price: '$42,000,000',
      location: 'Bangalore, Karnataka',
      specs: '92,000 sq ft · 8.4% Cap Rate',
      content: 'Fully leased Grade-A Tech Park development with pre-verified institutional efficiency ratings.',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      likes: ['sai', 'logeshwarana', 'ajmal'],
      comments: [
        { author: { fullName: 'Logeshwaran A', username: 'logeshwarana' }, text: '8.4% cap rate on Outer Ring Road is top quartile.' },
        { author: { fullName: 'Akshat Commercials', username: 'the_akshtr_estate' }, text: 'Strong institutional covenants.' },
      ],
    },
  ],
  logeshwarana: [
    {
      _id: 'logesh-p-1',
      title: 'Margaret River Commercial Vineyard',
      price: '$18,500,000',
      location: 'Western Australia',
      specs: '140 Acres · Pre-Verified Water Rights',
      content: 'World-class vineyard estate with high soil suitability index and pre-approved zoning.',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
      mediaUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
      likes: ['sai', 'shreekutti', 'bavadharini_rs'],
      comments: [
        { author: { fullName: 'Akshat Commercials', username: 'the_akshtr_estate' }, text: 'Soil analysis and water rights are pristine.' },
        { author: { fullName: 'Bavadharini RS', username: 'bavadharini_rs' }, text: 'Architectural layout is stunning.' },
      ],
    },
  ],
  ajmal: [
    {
      _id: 'ajmal-p-1',
      title: 'Waterfront Palm Signature Mansion',
      price: '$24,000,000',
      location: 'Palm Jumeirah, Dubai',
      specs: '7 Beds · 9 Baths · Private Beach',
      content: 'Direct beach access, smart home automation, infinity pool overlooking Dubai Marina.',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
      mediaUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
      likes: ['sai', 'logeshwarana', 'shreekutti', 'the_akshtr_estate'],
      comments: [
        { author: { fullName: 'Shreekutti', username: 'shreekutti' }, text: 'Unrivaled private beach frontage!' },
        { author: { fullName: 'Logeshwaran A', username: 'logeshwarana' }, text: 'Bespoke marble and high ceiling elevation.' },
      ],
    },
  ],
  bavadharini_rs: [
    {
      _id: 'bava-p-1',
      title: 'High-Ceiling Ultra Penthouse',
      price: '$6,200,000',
      location: 'Chennai, Tamil Nadu',
      specs: '5,800 sq ft · Private Elevator',
      content: 'Double-height glass living room, customized Italian joinery, panoramic sea view balcony.',
      image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
      mediaUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
      likes: ['sai', 'ajmal', 'logeshwarana'],
      comments: [
        { author: { fullName: 'Akshat Commercials', username: 'the_akshtr_estate' }, text: 'Incredible acoustic zoning and clean lines!' },
      ],
    },
  ],
  the_akshtr_estate: [
    {
      _id: 'akshat-p-1',
      title: 'Institutional Grade-A Office Hub',
      price: '$35,000,000',
      location: 'OMR IT Corridor, Chennai',
      specs: '120,000 sq ft · 8.9% Yield',
      content: 'Modern commercial tower with multi-level parking, 100% power backup, and prime expressway frontage.',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      mediaUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      likes: ['sai', 'shreekutti', 'logeshwarana'],
      comments: [
        { author: { fullName: 'Logeshwaran A', username: 'logeshwarana' }, text: 'Triple net lease with institutional covenants is top tier!' },
      ],
    },
  ],
  prasanth_properties: [
    {
      _id: 'prasanth-p-1',
      title: 'Star Island Waterfront Estate',
      price: '$19,800,000',
      location: 'Miami Beach, Florida',
      specs: '6 Beds · 8 Baths · Private Mega-Yacht Dock',
      content: 'Bespoke modern architecture with floor-to-ceiling glass, sunset views, and private yacht slip.',
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200',
      mediaUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200',
      likes: ['sai', 'ajmal', 'bavadharini_rs'],
      comments: [
        { author: { fullName: 'Mohammed Ajmal', username: 'ajmal' }, text: 'Deepwater dock specs and yacht clearance are remarkable.' },
      ],
    },
  ],
  sai: [
    {
      _id: 'sai-p-1',
      title: 'Coventry Corporate Headquarters',
      price: '$16,500,000',
      location: 'Coventry, United Kingdom',
      specs: '52,000 sq ft · 8.2% Cap Rate',
      content: 'Grade-A institutional office headquarters with 100% occupancy and blue-chip covenants.',
      image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
      mediaUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
      likes: ['logeshwarana', 'shreekutti'],
      comments: [
        { author: { fullName: 'Logeshwaran A', username: 'logeshwarana' }, text: 'Prime UK corporate covenants.' },
      ],
    },
  ],
};

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

    let userPosts = posts;
    if (!userPosts || userPosts.length === 0) {
      userPosts = COMMUNITY_POSTS_MAP[usernameKey] || [];
      if (userPosts.length === 0) {
        for (const [k, pList] of Object.entries(COMMUNITY_POSTS_MAP)) {
          if (usernameKey.includes(k) || k.includes(usernameKey)) {
            userPosts = pList;
            break;
          }
        }
      }
    }

    let userReels = [];
    if (usernameKey === 'logeshwarana' || usernameKey.includes('logeshwaran')) {
      userReels = LOGESHWARAN_REELS;
    } else if (sanitized.isSelf || usernameKey.includes('sai') || usernameKey === 'saivimenthanvl') {
      userReels = SAI_REELS;
    }

    return res.status(200).json({
      user: sanitized,
      postCount: userPosts.length || postCount,
      reelCount: userReels.length,
      followerCount: sanitized.followerCount,
      followingCount: sanitized.followingCount,
      isFollowing: sanitized.isFollowing,
      isSelf: sanitized.isSelf,
      posts: userPosts,
      reels: userReels,
    });
  } catch (error) {
    console.error('GET USER PROFILE ERROR:', error);
    return res.status(500).json({ message: 'Failed to load profile.', error: error.message });
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