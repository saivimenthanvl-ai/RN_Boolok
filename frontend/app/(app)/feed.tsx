import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
  useWindowDimensions,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import LoadingScreen from '../../components/LoadingScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import BoolokLogo from '../../components/BoolokLogo';
import { API_BASE_URL } from '../../lib/api';

// ── Shared follow tracker ───────────────────────────────────────────────────
const GLOBAL_FOLLOWED_USERS = new Set<string>();

// ── Real Estate & Buildings For Sale News ───────────────────────────────────
const DEFAULT_REAL_ESTATE_NEWS = [
  {
    id: 'news-1',
    title: 'Commercial Office Towers Surge in London & NYC',
    time: '9h ago',
    readers: '22,392 readers',
    category: 'Commercial Real Estate',
  },
  {
    id: 'news-2',
    title: 'Top 10 Prime Commercial Buildings For Sale in 2026',
    time: '9h ago',
    readers: '14,976 readers',
    category: 'Property Listings',
  },
  {
    id: 'news-3',
    title: 'Boolok AI Property Valuation Index Hits Record High',
    time: '57m ago',
    readers: '8,709 readers',
    category: 'AI Market Intelligence',
  },
  {
    id: 'news-4',
    title: 'Waterfront Luxury Estates See Record Institutional Influx',
    time: '6h ago',
    readers: '6,387 readers',
    category: 'Luxury Real Estate',
  },
  {
    id: 'news-5',
    title: 'Retail-to-Residential Conversions Accelerating in Metros',
    time: '6h ago',
    readers: '3,158 readers',
    category: 'Urban Redevelopment',
  },
  {
    id: 'news-6',
    title: 'Singapore Grade-A Tech Parks Attract $1.2B Capital Inflow',
    time: '12h ago',
    readers: '5,420 readers',
    category: 'Global Assets',
  },
];


// ── Dynamic Avatar Component (Real-Time Person Profile or Initials) ─────────
const UserAvatar = ({
  user,
  size = 42,
  style,
}: {
  user: any;
  size?: number;
  style?: any;
}) => {
  const profilePicture = user?.profilePicture;
  const name = user?.fullName || user?.username || 'User';
  const initial = (name[0] || 'U').toUpperCase();

  const colors = [
    '#ea580c', // deep orange
    '#2563eb', // royal blue
    '#059669', // emerald
    '#7c3aed', // violet
    '#db2777', // pink
    '#ca8a04', // gold
    '#0891b2', // cyan
  ];
  const charCode = (name.charCodeAt(0) || 0) + (name.charCodeAt(name.length - 1) || 0);
  const bgColor = colors[charCode % colors.length];

  if (profilePicture && typeof profilePicture === 'string' && profilePicture.startsWith('http')) {
    return (
      <Image
        source={{ uri: profilePicture }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: size * 0.44 }}>
        {initial}
      </Text>
    </View>
  );
};

// ── Default Professional Real Estate Posts ──────────────────────────────────
const DUMMY_REAL_ESTATE_POSTS = [
  {
    _id: 'post-shreekutti-1',
    author: {
      _id: 'shreekutti',
      fullName: 'shreekutti',
      username: 'shreekutti',
      title: 'Commercial Property & Tech Park Portfolio Lead @ Boolok Realty',
      degree: '1st',
      profilePicture: null,
    },
    time: '1w · 🌐',
    content: 'And just like that, our summer commercial campus acquisition is a wrap!\n\nI’m incredibly grateful for the opportunity to have closed this Grade-A Tech Park & Commercial Office development. Fully leased 92,000 sq ft, 8.4% cap rate with pre-verified energy efficiency ratings. Available for institutional portfolios and private office syndication.',
    mediaUrls: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
    ],
    likes: ['u1', 'u2'],
    likesSummary: 'Liked by 2 real estate brokers',
    likesCount: 2,
    commentsCount: 2,
    comments: [
      {
        _id: 'c1',
        author: { fullName: 'logeshwarana', username: 'logeshwarana', profilePicture: null },
        text: 'Clean zoning and strong cap rate numbers. Congratulations on the closing!',
        time: '3d ago',
      },
      {
        _id: 'c2',
        author: { fullName: 'ajmal', username: 'ajmal', profilePicture: null },
        text: 'Outstanding acquisition! The architectural footprint is world-class.',
        time: '5d ago',
      },
    ],
  },
  {
    _id: 're-post-1',
    author: {
      _id: 'agent-1',
      fullName: 'Prasanth Properties',
      username: 'prasanth_properties',
      title: 'Luxury Waterfront Specialist · Miami & Coastal Estates',
      degree: '1st',
      profilePicture: null,
    },
    time: '2h · 🌐',
    content: 'Just listed! 🌟 Stunning modern beachfront villa with private infinity pool and direct access to crystal waters. Turnkey luxury investment ready for immediate handover! DM for private walkthroughs. 🏖️🔑',
    mediaUrls: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200'],
    likes: ['u1', 'u2', 'u3', 'u4', 'u5'],
    likesSummary: 'Liked by 5 real estate brokers',
    likesCount: 5,
    commentsCount: 2,
    comments: [
      {
        _id: 'c3',
        author: { fullName: 'shreekutti', username: 'shreekutti', profilePicture: null },
        text: 'The natural lighting on this waterfront build is stunning!',
        time: '1h ago',
      },
      {
        _id: 'c4',
        author: { fullName: 'yashwanth_realty', username: 'yashwanth_realty', profilePicture: null },
        text: 'Spectacular location and panoramic backdrop.',
        time: '45m ago',
      },
    ],
  },
  {
    _id: 're-post-2',
    author: {
      _id: 'bavadharini_rs',
      fullName: 'Bavadharini RS',
      username: 'bavadharini_rs',
      title: 'Interior Designer & Modern Living Specialist',
      degree: '1st',
      profilePicture: null,
    },
    time: '1d · 🌐',
    content: 'Bespoke custom kitchen & dining makeover completed for our luxury penthouse client. Custom Italian marble countertops, hidden smart refrigeration, and brass accents. ✨🍽️',
    mediaUrls: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200'],
    likes: ['u1', 'u2', 'u3'],
    likesSummary: 'Liked by 3 real estate brokers',
    likesCount: 3,
    commentsCount: 1,
    comments: [
      {
        _id: 'c5',
        author: { fullName: 'logeshwarana', username: 'logeshwarana', profilePicture: null },
        text: 'Stunning cabinetry and seamless marble alignment!',
        time: '6h ago',
      },
    ],
  },
];

const DEFAULT_COMMUNITY_ADVISORS = [
  {
    id: 'shreekutti',
    _id: 'shreekutti',
    fullName: 'shreekutti',
    username: 'shreekutti',
    headline: 'Tech Park Campus Acquisitions Lead @ Boolok Realty',
    followerCount: 0,
    profilePicture: null,
  },
  {
    id: 'logeshwarana',
    _id: 'logeshwarana',
    fullName: 'logeshwarana',
    username: 'logeshwarana',
    headline: 'Architectural Consultant & Real Estate Lead',
    followerCount: 0,
    profilePicture: null,
  },
  {
    id: 'ajmal',
    _id: 'ajmal',
    fullName: 'ajmal',
    username: 'ajmal',
    headline: 'Luxury Living & High-End Residential Broker',
    followerCount: 0,
    profilePicture: null,
  },
  {
    id: 'bavadharini_rs',
    _id: 'bavadharini_rs',
    fullName: 'Bavadharini RS',
    username: 'bavadharini_rs',
    headline: 'Interior Designer & Modern Living Specialist',
    followerCount: 0,
    profilePicture: null,
  },
  {
    id: 'the_akshtr_estate',
    _id: 'the_akshtr_estate',
    fullName: 'Akshat Commercials',
    username: 'the_akshtr_estate',
    headline: 'Commercial Property & Tech Park Portfolio Lead',
    followerCount: 0,
    profilePicture: null,
  },
  {
    id: 'prasanth_properties',
    _id: 'prasanth_properties',
    fullName: 'Prasanth Properties',
    username: 'prasanth_properties',
    headline: 'Luxury Waterfront Specialist · Miami & Coastal Estates',
    followerCount: 0,
    profilePicture: null,
  },
];

export default function ProfessionalSocialFeedScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsList, setNewsList] = useState(DEFAULT_REAL_ESTATE_NEWS);
  const [showAllNews, setShowAllNews] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>(DEFAULT_COMMUNITY_ADVISORS);

  // Follow State
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Create Post Modal / Expand
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Active Comment Post ID for inline comments
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  useEffect(() => {
    fetchPostsAndNews();
    const interval = setInterval(() => {
      fetchPostsAndNews();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getToken = async () =>
    Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');

  const fetchPostsAndNews = async () => {
    try {
      const token = await getToken();
      const [feedRes, newsRes, suggestedRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/feed`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        axios.get(`${API_BASE_URL}/api/feed/news`),
        axios.get(`${API_BASE_URL}/api/users/suggested`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      if (feedRes.status === 'fulfilled' && Array.isArray(feedRes.value.data?.posts)) {
        const fetched = feedRes.value.data.posts;
        // Merge user posts with default real estate listings
        const merged = [
          ...fetched,
          ...DUMMY_REAL_ESTATE_POSTS.filter((dp) => !fetched.some((fp: any) => fp._id === dp._id)),
        ];
        setPosts(merged);
      } else {
        setPosts(DUMMY_REAL_ESTATE_POSTS);
      }

      if (newsRes.status === 'fulfilled' && Array.isArray(newsRes.value.data?.news)) {
        setNewsList(newsRes.value.data.news);
      }

      if (suggestedRes.status === 'fulfilled' && Array.isArray(suggestedRes.value.data?.suggested)) {
        setSuggestedUsers(suggestedRes.value.data.suggested);
        const map: Record<string, boolean> = {};
        suggestedRes.value.data.suggested.forEach((u: any) => {
          if (u.isFollowing) map[u.id || u._id] = true;
        });
        setFollowingMap((prev) => ({ ...prev, ...map }));
      }
    } catch (error) {
      console.error('Feed fetch error:', error);
      setPosts(DUMMY_REAL_ESTATE_POSTS);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollowAdvisor = async (targetId: string) => {
    const isCurrentlyFollowing = Boolean(followingMap[targetId]);
    const nextState = !isCurrentlyFollowing;
    setFollowingMap((prev) => ({ ...prev, [targetId]: nextState }));

    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/users/${targetId}/follow`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
    } catch (error) {
      console.warn('Failed to update follow in database');
    }
  };

  const handleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id === postId) {
          const isLiked = p.likes?.includes(user?.id || 'sai');
          const nextLikes = isLiked
            ? (p.likes || []).filter((id: string) => id !== (user?.id || 'sai'))
            : [...(p.likes || []), user?.id || 'sai'];
          return {
            ...p,
            likes: nextLikes,
            likesCount: (p.likesCount || nextLikes.length) + (isLiked ? -1 : 1),
          };
        }
        return p;
      })
    );

    try {
      const token = await getToken();
      await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/feed/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.log('Like updated in live state.');
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    const newComment = {
      _id: `c-${Date.now()}`,
      author: {
        _id: user?.id || 'sai',
        fullName: user?.fullName || 'Sai Vimenthan',
        username: user?.username || 'saivimenthanvl',
        profilePicture: user?.profilePicture || null,
      },
      text,
      time: 'Just now',
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p._id === postId) {
          const currentList = Array.isArray(p.comments) ? p.comments : [];
          return {
            ...p,
            comments: [newComment, ...currentList],
            commentsCount: (p.commentsCount || currentList.length) + 1,
          };
        }
        return p;
      })
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));

    try {
      const token = await getToken();
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/feed/${postId}/comment`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.log('Comment retained in feed UI.');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() && !newPostImage) {
      alertMsg('Please write some details or attach a property image.');
      return;
    }
    setIsPublishing(true);

    const newPostObj = {
      _id: `post-${Date.now()}`,
      author: {
        _id: user?.id || 'self',
        fullName: user?.fullName || 'Sai Vimenthan',
        username: user?.username || 'saivimenthanvl',
        title: 'Elite Real Estate Broker & Portfolio Advisor',
        degree: 'You',
        profilePicture: user?.profilePicture || null,
      },
      time: 'Just now · 🌐',
      content: newPostText.trim(),
      mediaUrls: newPostImage ? [newPostImage] : [],
      likes: [],
      likesCount: 1,
      commentsCount: 0,
      comments: [],
    };

    setPosts((prev) => [newPostObj, ...prev]);

    try {
      const token = await getToken();
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/feed`,
        { content: newPostText, mediaUrl: newPostImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.log('Post published in live state.');
    }

    setNewPostText('');
    setNewPostImage(null);
    setIsPublishing(false);
    setIsCreateModalOpen(false);
    alertMsg('Property post published successfully to Boolok Real Estate Network!');
  };

  const alertMsg = (msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Boolok Real Estate', msg);
    }
  };

  if (loading) return <LoadingScreen />;

  const displayedNews = showAllNews ? newsList : newsList.slice(0, 5);

  const bgDark = '#060b13';
  const cardBg = '#0c1626';
  const borderColor = '#1a273c';
  const goldPrimary = '#e6b800';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: bgDark }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mainLayoutContainer}>
        {/* ═══════════════════════════════════════════════════════════════════════
            LEFT COLUMN: User Real Estate Profile Card & Quick Links
        ════════════════════════════════════════════════════════════════════════ */}
        {isDesktop && (
          <View style={styles.leftColumn}>
            {/* User Mini Profile Card */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {/* Cover Banner */}
              <LinearGradient
                colors={['#0f223d', '#1a365d', '#0c1626']}
                style={styles.profileCoverBanner}
              >
                <View style={styles.bannerBadge}>
                  <BoolokLogo size={18} color="#ffffff" />
                  <Text style={styles.bannerBadgeText}>BOOLOK ELITE</Text>
                </View>
              </LinearGradient>

              {/* Avatar */}
              <Pressable
                onPress={() => router.push('/(app)/profile')}
                style={styles.profileAvatarWrapper}
              >
                <UserAvatar user={user} size={64} style={styles.profileAvatar} />
                <View style={styles.avatarPlusBadge}>
                  <MaterialIcons name="verified" size={14} color="#000000" />
                </View>
              </Pressable>

              {/* Identity & Professional Title */}
              <View style={styles.profileInfoBox}>
                <Text
                  style={styles.profileNameText}
                  onPress={() => router.push('/(app)/profile')}
                >
                  {user?.fullName || 'Sai Vimenthan'}
                </Text>
                <Text style={styles.profileRoleText}>
                  Elite Real Estate Broker & Commercial Portfolio Lead
                </Text>
                <Text style={styles.profileLocationText}>
                  Chennai, Tamil Nadu · Prime Assets
                </Text>

                {/* Company Tag */}
                <View style={styles.companyTag}>
                  <BoolokLogo size={14} color="#ffffff" />
                  <Text style={styles.companyTagText}>BOOLOK GPT REAL ESTATE</Text>
                </View>
              </View>

              {/* Stats Block */}
              <View style={[styles.statsDivider, { borderTopColor: borderColor }]}>
                <View style={styles.statRowItem}>
                  <Text style={styles.statRowLabel}>Profile viewers</Text>
                  <Text style={styles.statRowValue}>248</Text>
                </View>
                <View style={styles.statRowItem}>
                  <Text style={styles.statRowLabel}>Properties Listed</Text>
                  <Text style={styles.statRowValue}>12</Text>
                </View>
                <View style={styles.statRowItem}>
                  <Text style={styles.statRowLabel}>Post Impressions</Text>
                  <Text style={styles.statRowValue}>1.8k</Text>
                </View>
              </View>

              {/* Saved Items */}
              <Pressable
                onPress={() => router.push('/(app)/insights')}
                style={[styles.savedItemsBtn, { borderTopColor: borderColor }]}
              >
                <MaterialCommunityIcons name="bookmark-outline" size={18} color="#8b9bb4" />
                <Text style={styles.savedItemsText}>Saved Properties</Text>
              </Pressable>
            </View>

            {/* Quick Access Menu Card */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 12 }]}>
              <Text style={styles.quickMenuHeading}>Manage Network</Text>
              <Pressable style={styles.quickMenuItem} onPress={() => router.push('/(app)/feed')}>
                <MaterialIcons name="people-outline" size={18} color="#8b9bb4" />
                <Text style={styles.quickMenuText}>Broker Network</Text>
              </Pressable>
              <Pressable style={styles.quickMenuItem} onPress={() => router.push('/(app)/insights')}>
                <MaterialIcons name="article" size={18} color="#8b9bb4" />
                <Text style={styles.quickMenuText}>Market Newsletters</Text>
              </Pressable>
              <Pressable style={styles.quickMenuItem} onPress={() => router.push('/(app)/dashboard')}>
                <MaterialIcons name="event" size={18} color="#8b9bb4" />
                <Text style={styles.quickMenuText}>Property Auctions & Events</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            CENTER COLUMN: "Start a post" Box & Real Estate Feed Stream
        ════════════════════════════════════════════════════════════════════════ */}
        <View style={styles.centerColumn}>
          {/* "Start a post" Composer Card (Matches Screenshot 2) */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.startPostHeader}>
              <UserAvatar user={user} size={42} style={styles.startPostAvatar} />
              <Pressable
                onPress={() => setIsCreateModalOpen(true)}
                style={styles.startPostInputTrigger}
              >
                <Text style={styles.startPostPlaceholder}>
                  Start a post / Share a real estate listing...
                </Text>
              </Pressable>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.startPostActionsRow}>
              <Pressable
                onPress={() => router.push('/(app)/profile')}
                style={styles.composerActionBtn}
              >
                <MaterialIcons name="videocam" size={22} color="#60a5fa" />
                <Text style={styles.composerActionText}>Video Reel</Text>
              </Pressable>

              <Pressable
                onPress={() => setIsCreateModalOpen(true)}
                style={styles.composerActionBtn}
              >
                <MaterialIcons name="photo" size={20} color="#38bdf8" />
                <Text style={styles.composerActionText}>Photo</Text>
              </Pressable>

              <Pressable
                onPress={() => setIsCreateModalOpen(true)}
                style={styles.composerActionBtn}
              >
                <MaterialIcons name="apartment" size={20} color="#e6b800" />
                <Text style={styles.composerActionText}>Building For Sale</Text>
              </Pressable>
            </View>
          </View>

          {/* Sort Header */}
          <View style={styles.sortHeaderRow}>
            <View style={styles.sortDividerLine} />
            <Text style={styles.sortLabel}>
              Sort by:{' '}
              <Text style={{ color: '#ffffff', fontWeight: '700' }}>
                Top Real Estate Deals ▾
              </Text>
            </Text>
          </View>

          {/* ── Feed Posts Stream ────────────────────────────────────────────── */}
          {posts.map((post) => {
            const author = post.author || {};
            const authorName = author.fullName || author.username || 'Real Estate Lead';
            const authorTitle =
              author.title ||
              'Commercial Property & Real Estate Advisor @ Boolok Network';
            const authorAvatar =
              author.profilePicture ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
            const isSelfPost = author._id === user?.id || author._id === 'self';
            const isLiked = post.likes?.includes(user?.id || 'sai');
            const totalLikes = post.likesCount || post.likes?.length || 10;
            const commentsList = Array.isArray(post.comments) ? post.comments : [];
            const isCommentOpen = activeCommentPostId === post._id;

            // Resolve Media image URLs
            const mediaList = Array.isArray(post.mediaUrls)
              ? post.mediaUrls
              : post.mediaUrl
              ? [
                  post.mediaUrl.startsWith('http') || post.mediaUrl.startsWith('data:')
                    ? post.mediaUrl
                    : `${process.env.EXPO_PUBLIC_API_URL}${post.mediaUrl}`,
                ]
              : [];

            return (
              <View
                key={post._id}
                style={[styles.card, styles.postCard, { backgroundColor: cardBg, borderColor }]}
              >
                {/* Post Author Header */}
                <View style={styles.postHeaderRow}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/profile',
                        params: { id: author._id || author.username },
                      })
                    }
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  >
                    <UserAvatar user={author} size={42} style={styles.postAuthorAvatar} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.postAuthorName}>{authorName}</Text>
                        {author.degree && (
                          <Text style={styles.postAuthorDegree}> · {author.degree}</Text>
                        )}
                        <MaterialIcons
                          name="verified"
                          size={14}
                          color="#0095f6"
                          style={{ marginLeft: 4 }}
                        />
                      </View>
                      <Text style={styles.postAuthorTitle} numberOfLines={1}>
                        {authorTitle}
                      </Text>
                      <Text style={styles.postTimeText}>{post.time || '1d · 🌐'}</Text>
                    </View>
                  </Pressable>

                  {!isSelfPost && (
                    <Pressable
                      onPress={() => toggleFollowAdvisor(author._id || author.username)}
                      style={[
                        styles.feedFollowBtn,
                        followingMap[author._id || author.username] && {
                          backgroundColor: '#1a273c',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.feedFollowBtnText,
                          {
                            color: followingMap[author._id || author.username]
                              ? '#ffffff'
                              : goldPrimary,
                          },
                        ]}
                      >
                        {followingMap[author._id || author.username] ? '✓ Following' : '+ Follow'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Post Text Description */}
                <Text style={styles.postBodyContent}>{post.content}</Text>

                {/* Multi-Image / Media Grid */}
                {mediaList.length > 0 && (
                  <View style={styles.postMediaContainer}>
                    {mediaList.length === 1 ? (
                      <Image
                        source={{ uri: mediaList[0] }}
                        style={styles.singlePostImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.multiImageRow}>
                        {mediaList.slice(0, 2).map((imgUrl: string, idx: number) => (
                          <Image
                            key={idx}
                            source={{ uri: imgUrl }}
                            style={styles.multiPostImage}
                            resizeMode="cover"
                          />
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Social Counter Stats Bar (Only Like and Love icons) */}
                <View style={[styles.socialStatsBar, { borderBottomColor: borderColor }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.reactionIconsGroup}>
                      <View style={[styles.reactionDot, { backgroundColor: '#3b82f6' }]}>
                        <MaterialIcons name="thumb-up" size={10} color="#ffffff" />
                      </View>
                      <View style={[styles.reactionDot, { backgroundColor: '#ef4444', marginLeft: -4 }]}>
                        <MaterialIcons name="favorite" size={10} color="#ffffff" />
                      </View>
                    </View>
                    <Text style={styles.socialReactionText}>
                      {post.likesSummary ||
                        (isSelfPost
                          ? 'Liked by your real estate network'
                          : `${authorName} and ${totalLikes} others`)}
                    </Text>
                  </View>

                  <Text
                    style={styles.socialCommentsCountText}
                    onPress={() =>
                      setActiveCommentPostId(isCommentOpen ? null : post._id)
                    }
                  >
                    {post.commentsCount || commentsList.length} comments
                  </Text>
                </View>

                {/* Interactive Action Buttons (Like / Love, Comment, Repost, Send) */}
                <View style={styles.postActionsBar}>
                  <Pressable
                    onPress={() => handleLike(post._id)}
                    style={styles.postActionItem}
                  >
                    <MaterialCommunityIcons
                      name={isLiked ? 'heart' : 'thumb-up-outline'}
                      size={18}
                      color={isLiked ? '#ef4444' : '#8b9bb4'}
                    />
                    <Text
                      style={[
                        styles.postActionItemText,
                        isLiked && { color: '#ef4444', fontWeight: '700' },
                      ]}
                    >
                      {isLiked ? 'Loved' : 'Like'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setActiveCommentPostId(isCommentOpen ? null : post._id)
                    }
                    style={styles.postActionItem}
                  >
                    <MaterialCommunityIcons
                      name="comment-text-outline"
                      size={18}
                      color="#8b9bb4"
                    />
                    <Text style={styles.postActionItemText}>Comment</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => alertMsg('Property post reposted to your network!')}
                    style={styles.postActionItem}
                  >
                    <MaterialCommunityIcons name="repeat" size={18} color="#8b9bb4" />
                    <Text style={styles.postActionItemText}>Repost</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => alertMsg('Property details link copied to clipboard!')}
                    style={styles.postActionItem}
                  >
                    <MaterialCommunityIcons name="send-outline" size={18} color="#8b9bb4" />
                    <Text style={styles.postActionItemText}>Send</Text>
                  </Pressable>
                </View>

                {/* Inline Comment Box & Named Comments List */}
                {isCommentOpen && (
                  <View style={[styles.commentSectionDrawer, { borderTopColor: borderColor }]}>
                    {/* Add comment input */}
                    <View style={styles.commentInputRow}>
                      <UserAvatar user={user} size={32} style={styles.commentUserAvatar} />
                      <TextInput
                        placeholder="Add a real estate comment..."
                        placeholderTextColor="#66768f"
                        style={styles.inlineCommentInput}
                        value={commentInputs[post._id] || ''}
                        onChangeText={(t) =>
                          setCommentInputs((prev) => ({ ...prev, [post._id]: t }))
                        }
                        onSubmitEditing={() => handleAddComment(post._id)}
                      />
                      <Pressable
                        onPress={() => handleAddComment(post._id)}
                        style={[styles.commentSubmitBtn, { backgroundColor: goldPrimary }]}
                      >
                        <Text style={styles.commentSubmitBtnText}>Post</Text>
                      </Pressable>
                    </View>

                    {/* Existing Comments with Named Profiles */}
                    {commentsList.map((c: any, cIdx: number) => {
                      const fallbackNames = ['shreekutti', 'logeshwarana', 'ajmal', 'yashwanth_realty'];
                      const fallbackName = fallbackNames[cIdx % fallbackNames.length];
                      const cAuthor = c.author || {};
                      const rawName = cAuthor.fullName || cAuthor.username || (typeof c.author === 'string' ? c.author : '');
                      const cName = (!rawName || rawName === 'Advisor' || rawName === 'Agent') ? fallbackName : rawName;
                      const commentBody = c.text || 'Clean zoning and strong cap rate numbers.';

                      return (
                        <View key={c._id || cIdx} style={styles.commentItemBlock}>
                          <UserAvatar user={cAuthor?.profilePicture ? cAuthor : { fullName: cName }} size={32} style={styles.commentItemAvatar} />
                          <View style={styles.commentItemBubble}>
                            <Text style={styles.commentItemAuthorName}>{cName}</Text>
                            <Text style={styles.commentItemText}>{commentBody}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ═══════════════════════════════════════════════════════════════════════
            RIGHT COLUMN: Boolok GPT News & Suggested Elite Real Estate Advisors
        ════════════════════════════════════════════════════════════════════════ */}
        {(isDesktop || isTablet) && (
          <View style={styles.rightColumn}>
            {/* ── CARD 1: Boolok GPT News (Replaces LinkedIn News) ─────────── */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {/* Header with Boolok GPT Mark */}
              <View style={styles.newsHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <BoolokLogo size={20} color="#ffffff" />
                  <Text style={styles.newsHeaderTitle}>Boolok GPT News</Text>
                </View>
                <MaterialIcons name="info-outline" size={16} color="#8b9bb4" />
              </View>

              <Text style={styles.newsSubheader}>Top Real Estate Stories</Text>

              {/* News Items List */}
              <View style={styles.newsListContainer}>
                {displayedNews.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.newsItemRow}
                    onPress={() => router.push('/(app)/insights')}
                  >
                    <View style={styles.newsDotIndicator} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.newsItemTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.newsItemMeta}>
                        {item.time} · {item.readers}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* Show more toggle */}
              <Pressable
                onPress={() => setShowAllNews(!showAllNews)}
                style={styles.showMoreNewsBtn}
              >
                <Text style={styles.showMoreNewsText}>
                  {showAllNews ? 'Show less news ▴' : 'Show more news ▾'}
                </Text>
              </Pressable>
            </View>

            {/* ── CARD 2: Suggested Real Estate Advisors ──────────────────── */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 12 }]}>
              <Text style={styles.advisorsHeading}>Suggested for you</Text>

              {suggestedUsers.length > 0 ? (
                suggestedUsers.map((adv) => {
                  const advId = adv.id || adv._id;
                  const isF = Boolean(followingMap[advId]);
                  const initial = (adv.fullName || adv.username || 'U')[0]?.toUpperCase();
                  return (
                    <View key={advId} style={styles.advisorRow}>
                      <Pressable
                        onPress={() =>
                          router.push({ pathname: '/(app)/profile', params: { id: advId } })
                        }
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                      >
                        <UserAvatar user={adv} size={40} style={styles.advisorAvatar} />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={styles.advisorName} numberOfLines={1}>
                            {adv.fullName}
                          </Text>
                          <Text style={styles.advisorSubtitle} numberOfLines={1}>
                            @{adv.username} · {adv.followerCount || 0} followers
                          </Text>
                        </View>
                      </Pressable>

                      <Pressable
                        onPress={() => toggleFollowAdvisor(advId)}
                        style={[
                          styles.advisorFollowBtn,
                          isF && { backgroundColor: '#1a273c' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.advisorFollowBtnText,
                            { color: isF ? '#ffffff' : goldPrimary },
                          ]}
                        >
                          {isF ? '✓ Following' : '+ Follow'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              ) : (
                <View style={{ paddingVertical: 12 }}>
                  <Text style={{ color: '#8b9bb4', fontSize: 12 }}>Invite real estate colleagues to grow your network.</Text>
                </View>
              )}
            </View>

            {/* Footer legal & branding */}
            <View style={styles.footerLegal}>
              <Text style={styles.footerLegalLinks}>
                About · Help · Press · API · Jobs · Privacy · Terms · Real Estate Insights
              </Text>
              <Text style={styles.footerCopyright}>
                © 2026 BOOLOK GPT REAL ESTATE NETWORK
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Create Post Full Modal ────────────────────────────────────────── */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <UserAvatar user={user} size={40} style={styles.modalHeaderAvatar} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.modalAuthorName}>
                    {user?.fullName || 'Sai Vimenthan'}
                  </Text>
                  <Text style={styles.modalAuthorPrivacy}>🌐 Post to Anyone</Text>
                </View>
              </View>
              <Pressable onPress={() => setIsCreateModalOpen(false)}>
                <MaterialIcons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>

            <TextInput
              placeholder="What commercial property or market insight do you want to share?"
              placeholderTextColor="#66768f"
              multiline
              numberOfLines={5}
              style={styles.modalTextInput}
              value={newPostText}
              onChangeText={setNewPostText}
            />

            <TextInput
              placeholder="Or paste property image URL (e.g. https://...)..."
              placeholderTextColor="#66768f"
              style={[styles.modalUrlInput, { borderColor }]}
              value={newPostImage || ''}
              onChangeText={setNewPostImage}
            />

            <View style={styles.modalFooterActions}>
              <Pressable
                onPress={() => router.push('/(app)/profile')}
                style={styles.modalAttachVideoBtn}
              >
                <MaterialIcons name="videocam" size={20} color="#60a5fa" />
                <Text style={styles.modalAttachVideoText}>Upload Video Reel</Text>
              </Pressable>

              <Pressable
                onPress={handleCreatePost}
                disabled={isPublishing}
                style={[styles.modalPublishBtn, { backgroundColor: goldPrimary }]}
              >
                {isPublishing ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.modalPublishBtnText}>Post</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  mainLayoutContainer: {
    width: '100%',
    maxWidth: 1180,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },

  // Left Column
  leftColumn: {
    width: 240,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileCoverBanner: {
    height: 64,
    width: '100%',
    padding: 8,
    alignItems: 'flex-end',
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannerBadgeText: {
    color: '#e6b800',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileAvatarWrapper: {
    marginTop: -32,
    alignSelf: 'center',
    position: 'relative',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#0c1626',
  },
  avatarPlusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#e6b800',
    borderRadius: 10,
    padding: 2,
  },
  profileInfoBox: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    alignItems: 'center',
  },
  profileNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  profileRoleText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  profileLocationText: {
    fontSize: 11,
    color: '#8b9bb4',
    marginTop: 4,
    textAlign: 'center',
  },
  companyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#162235',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  companyTagText: {
    color: '#e6b800',
    fontSize: 10,
    fontWeight: '700',
  },
  statsDivider: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  statRowLabel: {
    color: '#8b9bb4',
    fontSize: 12,
  },
  statRowValue: {
    color: '#e6b800',
    fontSize: 12,
    fontWeight: '700',
  },
  savedItemsBtn: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  savedItemsText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  quickMenuHeading: {
    color: '#8b9bb4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  quickMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickMenuText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },

  // Center Column
  centerColumn: {
    flex: 1,
    maxWidth: 580,
  },
  startPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  startPostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  startPostInputTrigger: {
    flex: 1,
    backgroundColor: '#070e1a',
    borderWidth: 1,
    borderColor: '#1a273c',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  startPostPlaceholder: {
    color: '#8b9bb4',
    fontSize: 13,
    fontWeight: '500',
  },
  startPostActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a273c',
  },
  composerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  composerActionText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },

  // Sort
  sortHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  sortDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1a273c',
  },
  sortLabel: {
    color: '#8b9bb4',
    fontSize: 11,
    marginLeft: 12,
  },

  // Post Card
  postCard: {
    marginBottom: 16,
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
  },
  postAuthorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  postAuthorName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  postAuthorDegree: {
    color: '#8b9bb4',
    fontSize: 12,
  },
  postAuthorTitle: {
    color: '#8b9bb4',
    fontSize: 11,
    marginTop: 1,
  },
  postTimeText: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  feedFollowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#162235',
  },
  feedFollowBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  postBodyContent: {
    color: '#e2e8f0',
    fontSize: 13.5,
    lineHeight: 19,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  postMediaContainer: {
    width: '100%',
  },
  singlePostImage: {
    width: '100%',
    height: 340,
  },
  multiImageRow: {
    flexDirection: 'row',
    gap: 2,
  },
  multiPostImage: {
    flex: 1,
    height: 240,
  },
  socialStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  reactionIconsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  reactionDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialReactionText: {
    color: '#8b9bb4',
    fontSize: 11,
  },
  socialCommentsCountText: {
    color: '#8b9bb4',
    fontSize: 11,
  },
  postActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  postActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  postActionItemText: {
    color: '#8b9bb4',
    fontSize: 12,
    fontWeight: '600',
  },

  // Comments Drawer
  commentSectionDrawer: {
    borderTopWidth: 1,
    padding: 14,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  commentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  inlineCommentInput: {
    flex: 1,
    backgroundColor: '#070e1a',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12.5,
    borderWidth: 1,
    borderColor: '#1a273c',
  },
  commentSubmitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  commentSubmitBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  commentItemBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
  },
  commentItemAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentItemBubble: {
    flex: 1,
    backgroundColor: '#162235',
    borderRadius: 8,
    padding: 10,
  },
  commentItemAuthorName: {
    color: '#e6b800',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  commentItemText: {
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 16,
  },

  // Right Column
  rightColumn: {
    width: 290,
  },
  newsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  newsHeaderTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  newsSubheader: {
    color: '#8b9bb4',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 14,
    marginTop: 6,
    marginBottom: 10,
  },
  newsListContainer: {
    paddingHorizontal: 14,
  },
  newsItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  newsDotIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#e6b800',
    marginTop: 6,
  },
  newsItemTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  newsItemMeta: {
    color: '#8b9bb4',
    fontSize: 10,
    marginTop: 2,
  },
  showMoreNewsBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1a273c',
    marginTop: 8,
  },
  showMoreNewsText: {
    color: '#e6b800',
    fontSize: 11,
    fontWeight: '700',
  },

  // Suggested Advisors
  advisorsHeading: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  advisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  advisorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  advisorName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  advisorSubtitle: {
    color: '#8b9bb4',
    fontSize: 10,
    marginTop: 1,
  },
  advisorFollowBtn: {
    borderWidth: 1,
    borderColor: '#e6b800',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  advisorFollowBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  footerLegal: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  footerLegalLinks: {
    color: '#64748b',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },
  footerCopyright: {
    color: '#475569',
    fontSize: 9,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Create Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 540,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  modalAuthorName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalAuthorPrivacy: {
    color: '#8b9bb4',
    fontSize: 11,
    marginTop: 2,
  },
  modalTextInput: {
    backgroundColor: '#070e1a',
    borderRadius: 8,
    padding: 14,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  modalUrlInput: {
    backgroundColor: '#070e1a',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    marginBottom: 16,
  },
  modalFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalAttachVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalAttachVideoText: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '600',
  },
  modalPublishBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalPublishBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});