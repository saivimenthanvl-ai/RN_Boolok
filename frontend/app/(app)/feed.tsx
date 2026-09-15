import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  RefreshControl,
  Linking,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import LoadingScreen from '../../components/LoadingScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import BoolokLogo from '../../components/BoolokLogo';
import { API_BASE_URL } from '../../lib/api';

// ── Real Estate & Buildings For Sale News ───────────────────────────────────
const DEFAULT_REAL_ESTATE_NEWS = [
  {
    id: 'news-1',
    title: 'Commercial Office Towers Surge in London & NYC',
    time: '9h ago',
    readers: '22,392 readers',
    category: 'Commercial Real Estate',
    summary:
      'Institutional investors and private equity funds have deployed more than $14.6B into trophy Grade-A commercial office towers across London’s City core and New York’s Midtown corridor this quarter.',
    content:
      'The global commercial office landscape is undergoing a decisive renaissance driven by institutional capital pivot toward high-efficiency, amenity-rich properties. In Central London and Manhattan, prime yields have stabilized around 5.2% to 5.75%, encouraging institutional REITs to close multi-hundred-million-dollar transactions.',
    sourceName: 'Financial Times Property & Bloomberg Real Estate',
    sourceUrl: 'https://www.bloomberg.com/real-estate',
  },
  {
    id: 'news-2',
    title: 'Top 10 Prime Commercial Buildings For Sale in 2026',
    time: '9h ago',
    readers: '14,976 readers',
    category: 'Property Listings',
    summary:
      'Exclusive institutional showcase reveals high-cap-rate tech parks, corporate headquarters, and mixed-use towers currently listed for acquisition across global financial hubs.',
    content:
      'A curated catalog of premier commercial developments has arrived on the market this quarter, headlined by Outer Ring Road Tech Campus, Margaret River Estate, and Bishopsgate Corporate Tower.',
    sourceName: 'Boolok Institutional Asset Index & RERA Commercial',
    sourceUrl: 'https://www.cbre.com/insights',
  },
  {
    id: 'news-3',
    title: 'Boolok AI Property Valuation Index Hits Record High',
    time: '57m ago',
    readers: '8,709 readers',
    category: 'AI Market Intelligence',
    summary:
      'Boolok’s proprietary neural real estate appraisal algorithm recorded an all-time high valuation confidence score across 45,000 multi-family and commercial properties.',
    content:
      'By synthesizing spatial computer vision, municipal tax records, and live footfall telemetry, the Boolok AI Valuation Index delivers 4x faster institutional underwriting with 99% accuracy on cap rate trends.',
    sourceName: 'Boolok AI Research & MIT Center for Real Estate',
    sourceUrl: 'https://cre.mit.edu',
  },
  {
    id: 'news-4',
    title: 'Waterfront Luxury Estates See Record Institutional Influx',
    time: '6h ago',
    readers: '6,387 readers',
    category: 'Luxury Real Estate',
    summary:
      'Private family offices and sovereign wealth vehicles allocated $4.2B into trophy beachfront residences and private island compounds.',
    content:
      'Ultra-high-net-worth liquidity continues to migrate into resilient coastal real estate assets with deeded deepwater yacht docks and private helipads across Miami Beach, Palm Jumeirah, and coastal Australia.',
    sourceName: 'Knight Frank Global Wealth & Luxury Estates Review',
    sourceUrl: 'https://www.knightfrank.com/research',
  },
  {
    id: 'news-5',
    title: 'Retail-to-Residential Conversions Accelerating in Metros',
    time: '6h ago',
    readers: '3,158 readers',
    category: 'Urban Redevelopment',
    summary:
      'Municipal zoning modernizations across Tier-1 cities are expediting the adaptive reuse of suburban shopping centres into dynamic master-planned residential communities.',
    content:
      'Developers are seizing opportunities to convert underperforming retail and commercial malls into high-density urban residential hubs with expedited RERA permits and tax-increment financing.',
    sourceName: 'Urban Land Institute (ULI) Emerging Trends',
    sourceUrl: 'https://americas.uli.org',
  },
  {
    id: 'news-6',
    title: 'Singapore Grade-A Tech Parks Attract $1.2B Capital Inflow',
    time: '12h ago',
    readers: '5,420 readers',
    category: 'Global Assets',
    summary:
      'Cross-border real estate investment trusts (REITs) acquired three major business park clusters in Singapore’s One-North science district.',
    content:
      'Buoyed by robust biomedical and generative AI enterprise expansions, Singapore’s institutional tech park occupancy sits at 96.2%, solidifying Southeast Asia’s premier position for commercial capital security.',
    sourceName: 'JLL Global Real Estate Intelligence',
    sourceUrl: 'https://www.jll.com/trends-and-insights',
  },
];

// ── Dynamic Avatar Component ────────────────────────────────────────────────
const UserAvatar = ({
  user,
  size = 42,
  style,
}: {
  user: any;
  size?: number;
  style?: any;
}) => {
  let profilePicture = user?.profilePicture || user?.avatar;
  const name = user?.fullName || user?.username || 'User';
  const initial = (name[0] || 'U').toUpperCase();

  const colors = [
    '#ea580c', '#2563eb', '#059669', '#7c3aed', '#db2777', '#ca8a04', '#0891b2',
  ];
  const charCode = (name.charCodeAt(0) || 0) + (name.charCodeAt(name.length - 1) || 0);
  const bgColor = colors[charCode % colors.length];

  if (profilePicture && typeof profilePicture === 'string' && (profilePicture.startsWith('http') || profilePicture.startsWith('data:') || profilePicture.startsWith('/'))) {
    const fullUri = profilePicture.startsWith('/') ? `${API_BASE_URL}${profilePicture}` : profilePicture;
    return (
      <Image
        source={{ uri: fullUri }}
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

const DEFAULT_COMMUNITY_ADVISORS = [
  {
    id: 'shreekutti',
    _id: 'shreekutti',
    fullName: 'Shreekutti',
    username: 'shreekutti',
    headline: 'Tech Park Campus Acquisitions Lead @ Boolok',
    distance: '0.8 km away',
    location: 'Outer Ring Road, Bangalore',
    deals: '18 deals closed',
    followerCount: 4,
    profilePicture: null,
  },
  {
    id: 'logeshwarana',
    _id: 'logeshwarana',
    fullName: 'Logeshwaran A',
    username: 'logeshwarana',
    headline: 'Architectural Consultant & Real Estate Lead',
    distance: '1.4 km away',
    location: 'Whitefield & Commercial Hubs',
    deals: '22 deals closed',
    followerCount: 4,
    profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r=s96-c',
  },
  {
    id: 'ajmal',
    _id: 'ajmal',
    fullName: 'Mohammed Ajmal',
    username: 'ajmal',
    headline: 'Luxury Living & High-End Residential Broker',
    distance: '2.1 km away',
    location: 'Indiranagar & Prime Districts',
    deals: '14 deals closed',
    followerCount: 4,
    profilePicture: null,
  },
  {
    id: 'the_akshtr_estate',
    _id: 'the_akshtr_estate',
    fullName: 'Akshat Commercials',
    username: 'the_akshtr_estate',
    headline: 'Commercial Property & Tech Park Lead @ Boolok',
    distance: '3.2 km away',
    location: 'OMR IT Corridor, Chennai',
    deals: '12 deals closed',
    followerCount: 3,
    profilePicture: null,
  },
];

// ── Default Fallback Community Posts ─────────────────────────────────────────
const DEFAULT_FEED_POSTS = [
  {
    _id: 'shree-p-1',
    content: 'Fully leased Grade-A Tech Park development with pre-verified institutional efficiency ratings. 8.4% Cap Rate · 92,000 sq ft · Outer Ring Road, Bangalore.',
    mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    author: {
      _id: 'shreekutti',
      fullName: 'Shreekutti',
      username: 'shreekutti',
      profilePicture: null,
      headline: 'Tech Park Campus Acquisitions Lead @ Boolok',
      location: 'Bangalore, Karnataka',
    },
    likes: ['logeshwarana', 'ajmal', 'sai'],
    likesCount: 3,
    isLiked: false,
    likesSummary: 'Liked by 3 members',
    comments: [
      { _id: 'sc-1', author: { fullName: 'Logeshwaran A', username: 'logeshwarana', profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r=s96-c' }, text: '8.4% cap rate on Outer Ring Road is top quartile! 🏢🚀', time: '04:15 pm' },
      { _id: 'sc-2', author: { fullName: 'Akshat Commercials', username: 'the_akshtr_estate' }, text: 'Strong institutional covenants on this campus.', time: '05:30 pm' },
    ],
    commentsCount: 2,
    time: '2h ago · 🌐',
  },
  {
    _id: 'ajmal-p-1',
    content: 'Direct beach access, smart home automation, infinity pool overlooking Dubai Marina. Palm Jumeirah Signature Mansion — 7 Beds · Private Beach · $24,000,000.',
    mediaUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    author: {
      _id: 'ajmal',
      fullName: 'Mohammed Ajmal',
      username: 'ajmal',
      profilePicture: null,
      headline: 'Luxury Living & High-End Residential Broker',
      location: 'Palm Jumeirah, Dubai',
    },
    likes: ['sai', 'logeshwarana', 'shreekutti'],
    likesCount: 3,
    isLiked: false,
    likesSummary: 'Liked by 3 members',
    comments: [
      { _id: 'ac-1', author: { fullName: 'Shreekutti', username: 'shreekutti' }, text: 'Unrivaled private beach frontage!', time: '10:00 am' },
      { _id: 'ac-2', author: { fullName: 'Logeshwaran A', username: 'logeshwarana', profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r=s96-c' }, text: 'Bespoke marble and high ceiling elevation.', time: '11:15 am' },
    ],
    commentsCount: 2,
    time: '4h ago · 🌐',
  },
  {
    _id: 'logesh-p-1',
    content: 'World-class vineyard estate with high soil suitability index and pre-approved zoning. Margaret River Commercial Vineyard — 140 Acres · Pre-Verified Water Rights · $18,500,000.',
    mediaUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200',
    author: {
      _id: 'logeshwarana',
      fullName: 'Logeshwaran A',
      username: 'logeshwarana',
      profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r=s96-c',
      headline: 'Architectural Consultant & Real Estate Lead',
      location: 'Western Australia',
    },
    likes: ['sai', 'shreekutti', 'bavadharini_rs'],
    likesCount: 3,
    isLiked: false,
    likesSummary: 'Liked by 3 members',
    comments: [
      { _id: 'lc-1', author: { fullName: 'Akshat Commercials', username: 'the_akshtr_estate' }, text: 'Soil analysis and water rights are pristine.', time: '02:00 pm' },
      { _id: 'lc-2', author: { fullName: 'Bavadharini RS', username: 'bavadharini_rs' }, text: 'Architectural layout is stunning.', time: '03:10 pm' },
    ],
    commentsCount: 2,
    time: '6h ago · 🌐',
  },
  {
    _id: 'akshat-p-1',
    content: 'Modern commercial tower with multi-level parking, 100% power backup, and prime expressway frontage. Institutional Grade-A Office Hub — 120,000 sq ft · 8.9% Yield · OMR IT Corridor.',
    mediaUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
    author: {
      _id: 'the_akshtr_estate',
      fullName: 'Akshat Commercials',
      username: 'the_akshtr_estate',
      profilePicture: null,
      headline: 'Commercial Property & Tech Park Portfolio Lead @ Boolok Network',
      location: 'OMR IT Corridor, Chennai',
    },
    likes: ['sai', 'shreekutti', 'logeshwarana'],
    likesCount: 3,
    isLiked: false,
    likesSummary: 'Liked by 3 members',
    comments: [
      { _id: 'akc-1', author: { fullName: 'Logeshwaran A', username: 'logeshwarana', profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r=s96-c' }, text: 'Triple net lease with institutional covenants is top tier!', time: '06:00 pm' },
    ],
    commentsCount: 1,
    time: '8h ago · 🌐',
  },
  {
    _id: 'sai-p-1',
    content: 'Grade-A institutional office headquarters with 100% occupancy and blue-chip covenants. Coventry Corporate Headquarters — 52,000 sq ft · 8.2% Cap Rate · $16,500,000.',
    mediaUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
    author: {
      _id: 'saivimenthanvl',
      fullName: 'Sai Vimenthan',
      username: 'saivimenthanvl',
      profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c',
      headline: 'Elite Real Estate Broker & Commercial Portfolio Lead',
      location: 'Chennai, Tamil Nadu',
    },
    likes: ['logeshwarana', 'shreekutti'],
    likesCount: 2,
    isLiked: false,
    likesSummary: 'Liked by 2 members',
    comments: [
      { _id: 'spc-1', author: { fullName: 'Logeshwaran A', username: 'logeshwarana', profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r=s96-c' }, text: 'Prime UK corporate covenants. Solid institutional deal!', time: '04:00 pm' },
    ],
    commentsCount: 1,
    time: '1d ago · 🌐',
  },
];

const REACTION_TYPES = [
  { key: 'like', label: 'Like', icon: 'thumb-up', color: '#3b82f6', bg: '#0a66c2' },
  { key: 'celebrate', label: 'Celebrate', icon: 'sign-language', color: '#10b981', bg: '#059669' },
];

export default function ProfessionalSocialFeedScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const isSmallMobile = width < 450;

  const styles = useMemo(() => getStyles(isDark, width), [isDark, width]);

  const [posts, setPosts] = useState<any[]>(DEFAULT_FEED_POSTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newsList, setNewsList] = useState(DEFAULT_REAL_ESTATE_NEWS);
  const [showAllNews, setShowAllNews] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>(DEFAULT_COMMUNITY_ADVISORS);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [likesModalPost, setLikesModalPost] = useState<any>(null);
  const [likesModalUsers, setLikesModalUsers] = useState<any[]>([]);
  const [allReactionUsers, setAllReactionUsers] = useState<any[]>([]);
  const [reactionTab, setReactionTab] = useState<string>('all');
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({ all: 0, like: 0 });
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [activeReactionPickerPostId, setActiveReactionPickerPostId] = useState<string | null>(null);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>(DEFAULT_COMMUNITY_ADVISORS);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [savedReelsList, setSavedReelsList] = useState<any[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isBrokerNetworkModalOpen, setIsBrokerNetworkModalOpen] = useState(false);
  const [isNewslettersModalOpen, setIsNewslettersModalOpen] = useState(false);
  const [isAuctionsModalOpen, setIsAuctionsModalOpen] = useState(false);
  const [selectedNewsStory, setSelectedNewsStory] = useState<any>(null);

  const getToken = async () =>
    Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');

  const loadSavedItems = async () => {
    try {
      if (Platform.OS === 'web') {
        const raw = localStorage.getItem('boolok_saved_reels');
        if (raw) {
          const parsed = JSON.parse(raw);
          setSavedReelsList(Array.isArray(parsed) ? parsed : []);
          return;
        }
      } else {
        const raw = await SecureStore.getItemAsync('boolok_saved_reels');
        if (raw) {
          const parsed = JSON.parse(raw);
          setSavedReelsList(Array.isArray(parsed) ? parsed : []);
          return;
        }
      }
    } catch (e) { }
    setSavedReelsList([]);
  };

  const handleOpenSavedModal = () => {
    loadSavedItems();
    setIsSavedModalOpen(true);
  };

  const handleRemoveSavedReel = async (reelId: string) => {
    const updated = savedReelsList.filter((r) => r._id !== reelId && r.id !== reelId);
    setSavedReelsList(updated);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('boolok_saved_reels', JSON.stringify(updated));
      } catch (e) { }
    } else {
      try {
        await SecureStore.setItemAsync('boolok_saved_reels', JSON.stringify(updated));
      } catch (e) { }
    }
  };

  const handleOpenFollowersModal = async () => {
    setIsFollowersModalOpen(true);
    setIsLoadingFollowers(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/users/self/followers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data && Array.isArray(res.data.followers)) {
        setFollowersList(res.data.followers);
      } else {
        setFollowersList([]);
      }
    } catch (e) {
      setFollowersList([]);
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const handleOpenLikesModal = async (post: any) => {
    const currentPost = posts.find((p) => p._id === post._id) || post;
    setLikesModalPost(currentPost);
    setReactionTab('all');
    setIsLikesModalOpen(true);
    setIsLoadingLikes(true);

    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/feed/${post._id}/reactions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const list = Array.isArray(res.data?.all) ? res.data.all : [];
      setAllReactionUsers(list);
      setLikesModalUsers(list);
      setReactionCounts({ all: list.length, like: list.length });
    } catch (error) {
      setAllReactionUsers([]);
      setLikesModalUsers([]);
      setReactionCounts({ all: 0, like: 0 });
    } finally {
      setIsLoadingLikes(false);
    }
  };

  const fetchPostsAndNews = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [feedRes, newsRes, suggestedRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/feed`, { headers }),
        axios.get(`${API_BASE_URL}/api/feed/news`),
        axios.get(`${API_BASE_URL}/api/users/suggested`, { headers }),
      ]);

      if (feedRes.status === 'fulfilled') {
        const raw = feedRes.value.data;
        const postsList = Array.isArray(raw) ? raw : (Array.isArray(raw?.posts) ? raw.posts : []);
        setPosts(postsList.length > 0 ? postsList : DEFAULT_FEED_POSTS);
      } else {
        setPosts(DEFAULT_FEED_POSTS);
      }

      if (newsRes.status === 'fulfilled' && Array.isArray(newsRes.value.data?.news)) {
        setNewsList(newsRes.value.data.news);
      }

      if (suggestedRes.status === 'fulfilled' && Array.isArray(suggestedRes.value.data?.suggested)) {
        const list = suggestedRes.value.data.suggested;
        setSuggestedUsers(list);
        const map: Record<string, boolean> = {};
        list.forEach((u: any) => {
          if (u.isFollowing) map[u.id || u._id] = true;
        });
        setFollowingMap((prev) => ({ ...prev, ...map }));
      }
    } catch (error) {
      console.error('Feed fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPostsAndNews();
  }, [fetchPostsAndNews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPostsAndNews();
  };

  const toggleFollowAdvisor = async (targetId: string) => {
    const isCurrentlyFollowing = Boolean(followingMap[targetId]);
    const nextState = !isCurrentlyFollowing;
    setFollowingMap((prev) => ({ ...prev, [targetId]: nextState }));

    // Optimistically update followerCount in the suggested users list
    setSuggestedUsers((prev) =>
      prev.map((u) => {
        if ((u.id || u._id) === targetId) {
          const currentCount = typeof u.followerCount === 'number' ? u.followerCount : 0;
          return {
            ...u,
            followerCount: nextState ? currentCount + 1 : Math.max(0, currentCount - 1),
          };
        }
        return u;
      })
    );

    try {
      const token = await getToken();
      const res = await axios.post(
        `${API_BASE_URL}/api/users/${targetId}/follow`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data) {
        if (typeof res.data.isFollowing === 'boolean') {
          setFollowingMap((prev) => ({ ...prev, [targetId]: res.data.isFollowing }));
        }
        // Update the accurate followerCount from server
        if (typeof res.data.followerCount === 'number') {
          setSuggestedUsers((prev) =>
            prev.map((u) =>
              (u.id || u._id) === targetId
                ? { ...u, followerCount: res.data.followerCount }
                : u
            )
          );
        }
      }
    } catch (error) {
      console.warn('Failed to update follow in database');
      // Revert optimistic update on failure
      setFollowingMap((prev) => ({ ...prev, [targetId]: isCurrentlyFollowing }));
      setSuggestedUsers((prev) =>
        prev.map((u) => {
          if ((u.id || u._id) === targetId) {
            const currentCount = typeof u.followerCount === 'number' ? u.followerCount : 0;
            return {
              ...u,
              followerCount: isCurrentlyFollowing ? currentCount + 1 : Math.max(0, currentCount - 1),
            };
          }
          return u;
        })
      );
    }
  };

  const handleReaction = async (postId: string, reactionType: string = 'like') => {
    setActiveReactionPickerPostId(null);
    const viewerId = user?.id || user?._id;

    setPosts((prev) =>
      prev.map((p) => {
        if (p._id === postId) {
          const currentlyLiked = Boolean(p.isLiked || (Array.isArray(p.likes) && p.likes.includes(viewerId)));
          const nextLiked = !currentlyLiked;
          const nextLikes = nextLiked
            ? (Array.isArray(p.likes) ? [...p.likes, viewerId] : [viewerId])
            : (Array.isArray(p.likes) ? p.likes.filter((id: string) => id !== viewerId) : []);
          const count = nextLikes.length;
          return {
            ...p,
            isLiked: nextLiked,
            currentUserReaction: nextLiked ? 'like' : null,
            likes: nextLikes,
            likesCount: count,
            likesSummary: count > 0 ? (nextLiked ? (count === 1 ? 'Liked by you' : `Liked by you and ${count - 1} other${count > 2 ? 's' : ''}`) : `Liked by ${count} member${count > 1 ? 's' : ''}`) : '0 likes',
          };
        }
        return p;
      })
    );

    try {
      const token = await getToken();
      const res = await axios.put(
        `${API_BASE_URL}/api/feed/${postId}/like`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data && res.data.post) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? res.data.post : p))
        );
      }
    } catch (error) {
      console.warn('Reaction update failed on server:', error);
    }
  };

  const handleLike = (postId: string) => {
    handleReaction(postId, 'like');
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));

    try {
      const token = await getToken();
      const res = await axios.post(
        `${API_BASE_URL}/api/feed/${postId}/comment`,
        { text },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data && res.data.post) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? res.data.post : p))
        );
      } else if (res.data && Array.isArray(res.data.comments)) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                comments: res.data.comments,
                commentsCount: res.data.commentsCount || res.data.comments.length,
              };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const handlePickImageFromDevice = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setNewPostImage(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setNewPostImage(asset.uri);
        }
        setIsCreateModalOpen(true);
      }
    } catch (error) {
      console.error('Device image pick error:', error);
      alertMsg('Could not open file picker on your device.');
    }
  };

  const handleTakePhotoFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setNewPostImage(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setNewPostImage(asset.uri);
        }
        setIsCreateModalOpen(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      alertMsg('Could not open camera on your device.');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() && !newPostImage) {
      alertMsg('Please write some details or attach a property image.');
      return;
    }
    setIsPublishing(true);

    try {
      const token = await getToken();
      const res = await axios.post(
        `${API_BASE_URL}/api/feed`,
        { content: newPostText.trim(), mediaUrl: newPostImage || null },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data && res.data.post) {
        setPosts((prev) => [res.data.post, ...prev]);
      } else {
        await fetchPostsAndNews();
      }

      setNewPostText('');
      setNewPostImage(null);
      setIsCreateModalOpen(false);
      alertMsg('Property post published successfully to Boolok Real Estate Network!');
    } catch (error: any) {
      console.error('Create post error:', error);
      alertMsg(error?.response?.data?.message || 'Failed to publish post.');
    } finally {
      setIsPublishing(false);
    }
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

  const bgDark = isDark ? '#060b13' : '#ffffff';
  const cardBg = isDark ? '#0c1626' : '#ffffff';
  const borderColor = isDark ? '#1a273c' : '#e2e8f0';
  const goldPrimary = '#e6b800';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: bgDark }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#e6b800"
          colors={['#e6b800']}
        />
      }
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
                  {user?.fullName || user?.username || 'Boolok Member'}
                </Text>
                <Text style={styles.profileRoleText}>
                  {user?.headline || 'Elite Real Estate Broker & Commercial Portfolio Lead'}
                </Text>
                <Text style={styles.profileLocationText}>
                  {user?.location || 'Prime Commercial Assets'}
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
                  <Text style={styles.statRowValue}>38</Text>
                </View>
                <View style={styles.statRowItem}>
                  <Text style={styles.statRowLabel}>Properties Listed</Text>
                  <Text style={styles.statRowValue}>12</Text>
                </View>
                <View style={styles.statRowItem}>
                  <Text style={styles.statRowLabel}>Post Impressions</Text>
                  <Text style={styles.statRowValue}>148</Text>
                </View>
              </View>

              {/* Saved Items */}
              <Pressable
                onPress={handleOpenSavedModal}
                style={[styles.savedItemsBtn, { borderTopColor: borderColor }]}
              >
                <MaterialCommunityIcons name="bookmark-outline" size={18} color="#e6b800" />
                <Text style={[styles.savedItemsText, { color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700' }]}>
                  Saved Properties
                </Text>
              </Pressable>
            </View>

            {/* Quick Access Menu Card */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 12 }]}>
              <Text style={styles.quickMenuHeading}>Manage Network</Text>
              <Pressable style={styles.quickMenuItem} onPress={() => setIsBrokerNetworkModalOpen(true)}>
                <MaterialIcons name="people-outline" size={18} color="#e6b800" />
                <Text style={styles.quickMenuText}>Broker Network</Text>
              </Pressable>
              <Pressable style={styles.quickMenuItem} onPress={() => setIsNewslettersModalOpen(true)}>
                <MaterialIcons name="article" size={18} color="#38bdf8" />
                <Text style={styles.quickMenuText}>Market Newsletters</Text>
              </Pressable>
              <Pressable style={styles.quickMenuItem} onPress={() => setIsAuctionsModalOpen(true)}>
                <MaterialIcons name="event" size={18} color="#ec4899" />
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
                <MaterialIcons name="videocam" size={isSmallMobile ? 18 : 22} color="#60a5fa" />
                <Text style={styles.composerActionText}>{isSmallMobile ? 'Reel' : 'Video Reel'}</Text>
              </Pressable>

              <Pressable
                onPress={handlePickImageFromDevice}
                style={styles.composerActionBtn}
              >
                <MaterialIcons name="photo" size={isSmallMobile ? 18 : 20} color="#38bdf8" />
                <Text style={styles.composerActionText}>Photo</Text>
              </Pressable>

              <Pressable
                onPress={() => setIsCreateModalOpen(true)}
                style={styles.composerActionBtn}
              >
                <MaterialIcons name="apartment" size={isSmallMobile ? 18 : 20} color="#e6b800" />
                <Text style={styles.composerActionText}>{isSmallMobile ? 'Listing' : 'Building For Sale'}</Text>
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
          {posts.length === 0 ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: cardBg,
                  borderColor,
                  padding: 36,
                  alignItems: 'center',
                  marginBottom: 20,
                },
              ]}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: isDark ? '#1a273c' : '#f1f5f9',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <MaterialCommunityIcons
                  name="newspaper-variant-outline"
                  size={32}
                  color="#e6b800"
                />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '800',
                  color: isDark ? '#ffffff' : '#0f172a',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                Your Feed is Clean & Ready
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: '#8b9bb4',
                  textAlign: 'center',
                  lineHeight: 20,
                  maxWidth: 420,
                  marginBottom: 20,
                }}
              >
                No posts published yet. Share your first property listing, commercial requirement, or market analysis with the network!
              </Text>
              <Pressable
                onPress={() => setIsCreateModalOpen(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: goldPrimary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
              >
                <MaterialIcons name="add" size={18} color="#000000" />
                <Text style={{ color: '#000000', fontWeight: '800', fontSize: 14 }}>
                  Create First Post
                </Text>
              </Pressable>
            </View>
          ) : (
            posts.map((post) => {
              const author = post.author || {};
              const authorName = author.fullName || author.username || 'Boolok Member';
              const authorUsername = author.username || author._id || author.id || '';
              const authorTitle =
                author.headline ||
                author.title ||
                'Commercial Property & Real Estate Advisor @ Boolok Network';
              const isSelfPost = Boolean(
                user &&
                  (author._id === user.id ||
                    author._id === user._id ||
                    author.username === user.username)
              );
              const isLiked = Boolean(
                post.isLiked ||
                  (Array.isArray(post.likes) &&
                    user &&
                    post.likes.includes(user.id || user._id))
              );
              const totalLikes =
                typeof post.likesCount === 'number'
                  ? post.likesCount
                  : Array.isArray(post.likes)
                  ? post.likes.length
                  : 0;
              const commentsList = Array.isArray(post.comments) ? post.comments : [];
              const isCommentOpen = activeCommentPostId === post._id;

              // Resolve Media image URLs
              const mediaList = Array.isArray(post.mediaUrls)
                ? post.mediaUrls
                : post.mediaUrl
                ? [
                    post.mediaUrl.startsWith('http') || post.mediaUrl.startsWith('data:')
                      ? post.mediaUrl
                      : `${API_BASE_URL}${post.mediaUrl}`,
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
                        <Text style={styles.postTimeText}>{post.time || 'Recently · 🌐'}</Text>
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
                  {post.content ? (
                    <Text style={styles.postBodyContent}>{post.content}</Text>
                  ) : null}

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

                  {/* Social Counter Stats Bar */}
                  <View style={[styles.socialStatsBar, { borderBottomColor: borderColor }]}>
                    <Pressable
                      onPress={() => handleOpenLikesModal(post)}
                      style={({ pressed, hovered }: any) => [
                        { flexDirection: 'row', alignItems: 'center', cursor: 'pointer' },
                        (pressed || hovered) && { opacity: 0.8 },
                      ]}
                    >
                      <View style={styles.reactionIconsGroup}>
                        <View style={[styles.reactionDot, { backgroundColor: '#0a66c2' }]}>
                          <MaterialIcons name="thumb-up" size={10} color="#ffffff" />
                        </View>
                      </View>
                      <Text style={[styles.socialReactionText, { textDecorationLine: 'underline', marginLeft: 6 }]}>
                        {post.likesSummary ||
                          (totalLikes > 0
                            ? isLiked
                              ? (totalLikes === 1 ? 'Liked by you' : `Liked by you and ${totalLikes - 1} other${totalLikes > 2 ? 's' : ''}`)
                              : `Liked by ${totalLikes} member${totalLikes > 1 ? 's' : ''}`
                            : '0 likes')}
                      </Text>
                    </Pressable>

                    <Text
                      style={styles.socialCommentsCountText}
                      onPress={() =>
                        setActiveCommentPostId(isCommentOpen ? null : post._id)
                      }
                    >
                      {post.commentsCount || commentsList.length} comments
                    </Text>
                  </View>

                  {/* Interactive Action Buttons */}
                  <View style={[styles.postActionsBar, { position: 'relative' }]}>
                    <Pressable
                      onPress={() => handleReaction(post._id, 'like')}
                      style={styles.postActionItem}
                    >
                      <MaterialIcons
                        name="thumb-up"
                        size={18}
                        color={isLiked ? '#3b82f6' : '#8b9bb4'}
                      />
                      <Text
                        style={[
                          styles.postActionItemText,
                          isLiked && { color: '#3b82f6', fontWeight: '800' },
                        ]}
                      >
                        {isLiked ? 'Liked' : 'Like'}
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

                  {/* Inline Comment Box & Comments List */}
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

                      {/* Comments List */}
                      {commentsList.length > 0 ? (
                        commentsList.map((c: any, cIdx: number) => {
                          const cAuthor = c.author || c.user || {};
                          const cName = cAuthor.fullName || cAuthor.username || 'Boolok Member';
                          const commentBody = c.text || '';
                          const commentTime =
                            c.time ||
                            (c.createdAt
                              ? new Date(c.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recently');
                          const authorId = cAuthor._id || cAuthor.id || cAuthor.username;

                          return (
                            <View
                              key={c._id || cIdx}
                              style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}
                            >
                              <Pressable
                                onPress={() => {
                                  if (authorId) {
                                    router.push({
                                      pathname: '/(app)/profile',
                                      params: { id: authorId },
                                    });
                                  }
                                }}
                                style={({ pressed, hovered }: any) => [
                                  (pressed || hovered) && { opacity: 0.8 },
                                ]}
                              >
                                <UserAvatar user={cAuthor} size={34} />
                              </Pressable>
                              <View
                                style={{
                                  flex: 1,
                                  backgroundColor: isDark ? '#131e30' : '#f8fafc',
                                  padding: 10,
                                  borderRadius: 10,
                                  borderWidth: 1,
                                  borderColor: isDark ? '#1b2a40' : '#e2e8f0',
                                }}
                              >
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 2,
                                  }}
                                >
                                  <Pressable
                                    onPress={() => {
                                      if (authorId) {
                                        router.push({
                                          pathname: '/(app)/profile',
                                          params: { id: authorId },
                                        });
                                      }
                                    }}
                                    style={({ pressed, hovered }: any) => [
                                      (pressed || hovered) && { opacity: 0.7 },
                                    ]}
                                  >
                                    <Text
                                      style={{
                                        color: goldPrimary,
                                        fontWeight: '800',
                                        fontSize: 13,
                                        textDecorationLine: 'underline',
                                      }}
                                    >
                                      {cName}
                                    </Text>
                                  </Pressable>
                                  <Text style={{ color: '#64748b', fontSize: 10 }}>
                                    {commentTime}
                                  </Text>
                                </View>
                                <Text
                                  style={{
                                    color: isDark ? '#e2e8f0' : '#1e293b',
                                    fontSize: 12.5,
                                    lineHeight: 17,
                                  }}
                                >
                                  {commentBody}
                                </Text>
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                          <Text style={{ color: '#8b9bb4', fontSize: 12 }}>
                            No comments yet. Start the conversation!
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
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
                    onPress={() => setSelectedNewsStory(item)}
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
                  let advFullName = adv.fullName;
                  let advUsername = adv.username;

                  if (advUsername === 'ig_vicky16' || advUsername === 'ig_vicky.16' || advUsername === 'vicky' || advUsername === 'vignesh' || (advFullName && advFullName.includes('Vicky'))) {
                    advFullName = 'Vigneshwaran';
                    advUsername = 'vignesh';
                  }
                  if (advUsername === 'aswin.realty' || advUsername === 'aswin_realty' || advUsername === 'aswin' || (advFullName && advFullName.includes('Aswin'))) {
                    advFullName = 'Aswin Real Estate';
                    advUsername = 'aswin';
                  }
                  if (advUsername === 'yashwanth_realty' || advUsername === 'cinemahub.live' || advUsername === 'cinemahub' || (advFullName && (advFullName.includes('Yashwanth Realty') || advFullName.includes('cinemahub')))) {
                    advFullName = 'Yashwanth';
                    advUsername = 'yashwanth';
                  }

                  const initial = (advFullName || advUsername || 'U')[0]?.toUpperCase();
                  return (
                    <View key={advId} style={styles.advisorRow}>
                      <Pressable
                        onPress={() =>
                          router.push({ pathname: '/(app)/profile', params: { id: advUsername || advId } })
                        }
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                      >
                        <UserAvatar user={{ ...adv, fullName: advFullName, username: advUsername }} size={40} style={styles.advisorAvatar} />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={styles.advisorName} numberOfLines={1}>
                            {advFullName}
                          </Text>
                          <Text style={styles.advisorSubtitle} numberOfLines={1}>
                            @{advUsername} · {adv.followerCount || 0} followers
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
                    {user?.fullName || user?.username || 'Boolok Member'}
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

            {/* Image Preview if selected from Device/URL */}
            {newPostImage ? (
              <View style={styles.imagePreviewBox}>
                <Image
                  source={{ uri: newPostImage }}
                  style={styles.imagePreviewImg}
                  resizeMode="cover"
                />
                <View style={styles.imagePreviewInfoBar}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#4ade80" />
                    <Text style={styles.imagePreviewLabel} numberOfLines={1}>
                      Photo attached from device
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setNewPostImage(null)}
                    style={styles.imagePreviewRemoveBtn}
                  >
                    <MaterialIcons name="close" size={14} color="#ffffff" />
                    <Text style={styles.imagePreviewRemoveText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={{ marginBottom: 14 }}>
                <View style={styles.modalUploadOptionsRow}>
                  <Pressable
                    onPress={handlePickImageFromDevice}
                    style={styles.modalUploadDeviceBtn}
                  >
                    <MaterialIcons name="add-photo-alternate" size={20} color="#38bdf8" />
                    <Text style={styles.modalUploadDeviceText}>Choose Photo from Device</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleTakePhotoFromCamera}
                    style={styles.modalUploadCameraBtn}
                  >
                    <MaterialIcons name="photo-camera" size={18} color="#e6b800" />
                    <Text style={styles.modalUploadCameraText}>Camera</Text>
                  </Pressable>
                </View>

                <TextInput
                  placeholder="Or paste property image URL (e.g. https://...)..."
                  placeholderTextColor="#66768f"
                  style={[styles.modalUrlInput, { borderColor, marginBottom: 0 }]}
                  value={newPostImage || ''}
                  onChangeText={setNewPostImage}
                />
              </View>
            )}

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

      {/* ── POST LIKES / REACTIONS MODAL WITH REAL-TIME CATEGORIES (ALL, LIKES, LOVE) ── */}
      <Modal
        visible={isLikesModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLikesModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor, maxWidth: 500, maxHeight: 540 }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.reactionDot, { backgroundColor: '#0a66c2', width: 22, height: 22, borderRadius: 11 }]}>
                  <MaterialIcons name="thumb-up" size={12} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a', marginLeft: 4 }}>
                  Likes ({allReactionUsers.length})
                </Text>
              </View>
              <Pressable onPress={() => setIsLikesModalOpen(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color={isDark ? '#8b9bb4' : '#64748b'} />
              </Pressable>
            </View>

            {/* Categorization Tabs (All, 👍 Thumbs Up) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 10 }}>
              <Pressable
                onPress={() => setReactionTab('all')}
                style={[
                  { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: reactionTab === 'all' ? (isDark ? '#1e293b' : '#f1f5f9') : 'transparent', borderWidth: 1, borderColor: reactionTab === 'all' ? (isDark ? '#334155' : '#cbd5e1') : 'transparent' },
                ]}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: reactionTab === 'all' ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#8b9bb4' : '#64748b') }}>
                  All ({allReactionUsers.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setReactionTab('like')}
                style={[
                  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: reactionTab === 'like' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', borderWidth: 1, borderColor: reactionTab === 'like' ? '#3b82f6' : 'transparent' },
                ]}
              >
                <View style={[styles.reactionDot, { backgroundColor: '#0a66c2', width: 18, height: 18, borderRadius: 9 }]}>
                  <MaterialIcons name="thumb-up" size={10} color="#ffffff" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: reactionTab === 'like' ? '#3b82f6' : (isDark ? '#8b9bb4' : '#64748b') }}>
                  Thumbs Up ({allReactionUsers.length})
                </Text>
              </Pressable>
            </View>

            {/* Users List Filtered by Active Tab */}
            <ScrollView style={{ marginTop: 8 }} showsVerticalScrollIndicator={false}>
              {isLoadingLikes ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={goldPrimary} />
                  <Text style={{ color: isDark ? '#8b9bb4' : '#64748b', fontSize: 12, marginTop: 8 }}>Loading real-time reactions...</Text>
                </View>
              ) : (reactionTab === 'all' ? allReactionUsers : allReactionUsers.filter((u) => u.reactionType === reactionTab)).length > 0 ? (
                (reactionTab === 'all' ? allReactionUsers : allReactionUsers.filter((u) => u.reactionType === reactionTab)).map((u: any, idx: number) => {
                  const uId = u.id || u._id || u.username;
                  const isF = Boolean(followingMap[uId]);
                  const uReaction = u.reactionType || 'like';

                  return (
                    <View
                      key={uId || idx}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 10,
                        paddingHorizontal: 6,
                        borderRadius: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          setIsLikesModalOpen(false);
                          router.push({ pathname: '/(app)/profile', params: { id: uId } });
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}
                      >
                        <View style={{ position: 'relative' }}>
                          <UserAvatar user={u} size={40} />
                          <View
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              width: 16,
                              height: 16,
                              borderRadius: 8,
                              backgroundColor: '#0a66c2',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: 1.5,
                              borderColor: cardBg,
                            }}
                          >
                            <MaterialIcons name="thumb-up" size={8} color="#ffffff" />
                          </View>
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700', fontSize: 14 }}>
                              {u.fullName || u.username}
                            </Text>
                            <MaterialIcons name="verified" size={14} color="#0095f6" />
                          </View>
                          <Text style={{ color: isDark ? '#8b9bb4' : '#64748b', fontSize: 12 }}>
                            @{u.username}
                          </Text>
                          {u.headline && (
                            <Text style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                              {u.headline}
                            </Text>
                          )}
                        </View>
                      </Pressable>

                      {/* Follow/Connect Button */}
                      <Pressable
                        onPress={() => toggleFollowAdvisor(uId)}
                        style={[
                          styles.advisorFollowBtn,
                          isF && { backgroundColor: isDark ? '#1a273c' : '#f1f5f9' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.advisorFollowBtnText,
                            { color: isF ? (isDark ? '#ffffff' : '#0f172a') : goldPrimary },
                          ]}
                        >
                          {isF ? '✓ Connected' : '+ Connect'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              ) : (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <Text style={{ color: isDark ? '#8b9bb4' : '#64748b', fontSize: 13 }}>No {reactionTab === 'like' ? 'Likes' : reactionTab === 'love' ? 'Love reactions' : 'reactions'} yet.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Followers Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={isFollowersModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFollowersModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 480, backgroundColor: isDark ? '#09111e' : '#ffffff', borderRadius: 16, borderWidth: 1, borderColor, maxHeight: 540, padding: 18 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(230, 184, 0, 0.2)', justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialIcons name="people" size={16} color={goldPrimary} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>
                    Network Followers ({followersList.length})
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#8b9bb4' : '#64748b', marginTop: 1 }}>
                    Real-time real estate professionals in your network
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setIsFollowersModalOpen(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color={isDark ? '#8b9bb4' : '#64748b'} />
              </Pressable>
            </View>

            {/* List */}
            <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
              {isLoadingFollowers ? (
                <ActivityIndicator size="small" color={goldPrimary} style={{ marginVertical: 24 }} />
              ) : followersList.length > 0 ? (
                followersList.map((fUser: any, idx: number) => {
                  const fId = fUser.id || fUser._id || fUser.username;
                  const isF = Boolean(followingMap[fId] || followingMap[fUser.username]);
                  return (
                    <View
                      key={fId || idx}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderRadius: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          setIsFollowersModalOpen(false);
                          router.push({ pathname: '/(app)/profile', params: { id: fId } });
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}
                      >
                        <UserAvatar user={fUser} size={42} />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700', fontSize: 13.5 }}>
                              {fUser.fullName || fUser.username}
                            </Text>
                            <MaterialIcons name="verified" size={14} color="#0095f6" />
                          </View>
                          <Text style={{ color: isDark ? '#8b9bb4' : '#64748b', fontSize: 11.5 }}>
                            @{fUser.username}
                          </Text>
                          {fUser.headline && (
                            <Text style={{ color: '#64748b', fontSize: 11, marginTop: 1 }} numberOfLines={1}>
                              {fUser.headline}
                            </Text>
                          )}
                        </View>
                      </Pressable>

                      {/* Connect / Follow Toggle */}
                      <Pressable
                        onPress={() => toggleFollowAdvisor(fId)}
                        style={[
                          styles.advisorFollowBtn,
                          isF && { backgroundColor: '#1a273c', borderColor: '#223854' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.advisorFollowBtnText,
                            { color: isF ? '#ffffff' : goldPrimary },
                          ]}
                        >
                          {isF ? '✓ Connected' : '+ Connect'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              ) : (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <Text style={{ color: '#8b9bb4', fontSize: 13 }}>No followers yet.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 1. SAVED PROPERTIES & REELS MODAL (Remains saved until removed) ── */}
      <Modal
        visible={isSavedModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSavedModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor, maxWidth: 580, maxHeight: 640 }]}>
            <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(230, 184, 0, 0.2)', justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialIcons name="bookmark" size={18} color={goldPrimary} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>
                    Saved Properties & Reels ({savedReelsList.length})
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#8b9bb4' : '#64748b' }}>
                    Persisted portfolio clips and listings · Stays saved until you remove
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setIsSavedModalOpen(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color={isDark ? '#8b9bb4' : '#64748b'} />
              </Pressable>
            </View>

            <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
              {savedReelsList.length > 0 ? (
                savedReelsList.map((item: any, idx: number) => (
                  <View
                    key={item._id || item.id || idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? '#08111e' : '#f8fafc',
                      borderRadius: 12,
                      padding: 10,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: isDark ? '#1a273c' : '#e2e8f0',
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        setIsSavedModalOpen(false);
                        router.push('/(app)/insights');
                      }}
                      style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }}
                    >
                      <Image
                        source={{ uri: item.thumbnail || item.poster || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800' }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                        <MaterialIcons name="play-circle-filled" size={24} color="#e6b800" />
                      </View>
                    </Pressable>

                    <View style={{ flex: 1, marginLeft: 12, paddingRight: 6 }}>
                      <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700', fontSize: 13.5 }} numberOfLines={1}>
                        {item.title || 'Saved Property Reel'}
                      </Text>
                      <Text style={{ color: goldPrimary, fontSize: 11.5, fontWeight: '600', marginTop: 2 }}>
                        📍 {item.location || 'Bangalore, India'}
                      </Text>
                      {item.insight && (
                        <Text style={{ color: isDark ? '#8b9bb4' : '#64748b', fontSize: 11, marginTop: 3 }} numberOfLines={2}>
                          {item.insight}
                        </Text>
                      )}
                    </View>

                    <Pressable
                      onPress={() => handleRemoveSavedReel(item._id || item.id)}
                      style={{ padding: 8, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.12)' }}
                    >
                      <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                    </Pressable>
                  </View>
                ))
              ) : (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="bookmark-off-outline" size={42} color={isDark ? '#334155' : '#cbd5e1'} />
                  <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700', fontSize: 15, marginTop: 12 }}>
                    No Saved Items Yet
                  </Text>
                  <Text style={{ color: isDark ? '#8b9bb4' : '#64748b', fontSize: 12, textAlign: 'center', marginTop: 4, maxWidth: 300 }}>
                    Click the bookmark button on any reel in Insights or property listing to save it here indefinitely.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 2. REAL-TIME BROKERS NEAR ME MODAL ── */}
      <Modal
        visible={isBrokerNetworkModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBrokerNetworkModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor, maxWidth: 580, maxHeight: 660 }]}>
            <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(230, 184, 0, 0.2)', justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialIcons name="location-on" size={18} color={goldPrimary} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>
                    Real-Time Brokers Near Me
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#8b9bb4' : '#64748b' }}>
                    Live GPS radar active · Verified certified real estate advisors in your radius
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setIsBrokerNetworkModalOpen(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color={isDark ? '#8b9bb4' : '#64748b'} />
              </Pressable>
            </View>

            <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
              {DEFAULT_COMMUNITY_ADVISORS.map((broker: any) => {
                const bId = broker.id || broker._id;
                const isF = Boolean(followingMap[bId] || followingMap[broker.username]);
                return (
                  <View
                    key={bId}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      marginBottom: 10,
                      borderRadius: 12,
                      backgroundColor: isDark ? '#08111e' : '#f8fafc',
                      borderWidth: 1,
                      borderColor: isDark ? '#1a273c' : '#e2e8f0',
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        setIsBrokerNetworkModalOpen(false);
                        router.push({ pathname: '/(app)/profile', params: { id: bId } });
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}
                    >
                      <UserAvatar user={broker} size={48} />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700', fontSize: 14 }}>
                            {broker.fullName}
                          </Text>
                          <MaterialIcons name="verified" size={15} color="#0095f6" />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <Text style={{ color: goldPrimary, fontSize: 11.5, fontWeight: '700' }}>
                            📍 {broker.distance || '1.2 km away'}
                          </Text>
                          <Text style={{ color: isDark ? '#8b9bb4' : '#64748b', fontSize: 11 }}>
                            · {broker.deals || '18 deals closed'}
                          </Text>
                        </View>
                        <Text style={{ color: isDark ? '#8b9bb4' : '#64748b', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                          {broker.headline}
                        </Text>
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => toggleFollowAdvisor(bId)}
                      style={[
                        styles.advisorFollowBtn,
                        isF && { backgroundColor: '#1a273c', borderColor: '#223854' },
                      ]}
                    >
                      <Text style={[styles.advisorFollowBtnText, { color: isF ? '#ffffff' : goldPrimary }]}>
                        {isF ? '✓ Connected' : '+ Connect'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 3. MARKET NEWSLETTERS MODAL ── */}
      <Modal
        visible={isNewslettersModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNewslettersModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor, maxWidth: 620, maxHeight: 680 }]}>
            <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(56, 189, 248, 0.2)', justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialIcons name="article" size={18} color="#38bdf8" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>
                    Commercial & Residential Newsletters
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#8b9bb4' : '#64748b' }}>
                    Curated weekly intelligence for institutional real estate decision-makers
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setIsNewslettersModalOpen(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color={isDark ? '#8b9bb4' : '#64748b'} />
              </Pressable>
            </View>

            <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
              {[
                {
                  id: 'nl-1',
                  edition: 'Issue #48 · September 2026',
                  title: 'Outer Ring Road Tech Hub Yields & Cap Rate Index',
                  readTime: '4 min read · 8,400 subscribers',
                  excerpt: 'Commercial campus pre-leasing velocity on Bangalore’s Outer Ring Road accelerated by 18% YoY. Tech conglomerates are committing to 9-year WALE leases with institutional 8.4% cap returns.',
                  author: 'Shreekutti · Head of Campus Acquisitions',
                  tags: ['Commercial', 'Tech Parks', 'Bangalore'],
                },
                {
                  id: 'nl-2',
                  edition: 'Issue #47 · September 2026',
                  title: 'Global Trophy Waterfronts & Private Island Compounds',
                  readTime: '6 min read · 12,100 subscribers',
                  excerpt: 'Deepwater dock accessibility and private helipad configurations are driving $4.2B in institutional capital allocation across Miami Beach and Dubai Palm Jumeirah.',
                  author: 'Mohammed Ajmal · Luxury Real Estate Lead',
                  tags: ['Luxury Estates', 'Waterfront', 'Global'],
                },
                {
                  id: 'nl-3',
                  edition: 'Issue #46 · August 2026',
                  title: 'Agricultural & Vineyard Terroir Valuations in Western Australia',
                  readTime: '5 min read · 6,900 subscribers',
                  excerpt: 'Margaret River commercial estate acquisitions yield high-margin hospitality and cellar door revenue, underpinned by 50-year deeded water rights.',
                  author: 'Logeshwaran A · Architectural Consultant',
                  tags: ['Vineyards', 'Hospitality', 'Australia'],
                },
              ].map((nl) => (
                <View
                  key={nl.id}
                  style={{
                    backgroundColor: isDark ? '#08111e' : '#f8fafc',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: isDark ? '#1a273c' : '#e2e8f0',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                      {nl.edition}
                    </Text>
                    <Text style={{ color: isDark ? '#8b9bb4' : '#64748b', fontSize: 11 }}>
                      {nl.readTime}
                    </Text>
                  </View>
                  <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '800', fontSize: 15, marginTop: 6 }}>
                    {nl.title}
                  </Text>
                  <Text style={{ color: isDark ? '#8b9bb4' : '#64748b', fontSize: 12.5, lineHeight: 18, marginTop: 6 }}>
                    {nl.excerpt}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: borderColor }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 11.5, fontWeight: '600' }}>
                      ✍️ {nl.author}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setIsNewslettersModalOpen(false);
                        router.push('/(app)/insights');
                      }}
                      style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                    >
                      <Text style={{ color: '#38bdf8', fontSize: 12, fontWeight: '700' }}>Read Edition →</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 4. PROPERTY AUCTIONS & UPCOMING EVENTS MODAL ── */}
      <Modal
        visible={isAuctionsModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAuctionsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor, maxWidth: 620, maxHeight: 680 }]}>
            <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(236, 72, 153, 0.2)', justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialIcons name="gavel" size={18} color="#ec4899" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>
                    Upcoming Property Auctions & Events
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#8b9bb4' : '#64748b' }}>
                    Live institutional bidding · Turnkey residential & commercial properties for sale
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setIsAuctionsModalOpen(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color={isDark ? '#8b9bb4' : '#64748b'} />
              </Pressable>
            </View>

            <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
              {[
                {
                  id: 'auc-1',
                  badge: 'LIVE AUCTION · 3 DAYS LEFT',
                  badgeColor: '#ec4899',
                  title: 'Grade-A Tech Park SEZ Development (Bangalore)',
                  startingBid: '$42,000,000',
                  specs: '92,000 sq ft · 8.4% Cap Rate · Triple Net Lease',
                  date: 'September 12, 2026 · 10:00 AM IST',
                  location: 'Outer Ring Road Tech Corridor, Bangalore',
                  organizer: 'Listed by Shreekutti (Boolok Advisors)',
                },
                {
                  id: 'auc-2',
                  badge: 'UPCOMING BIDDING',
                  badgeColor: '#3b82f6',
                  title: 'Margaret River Commercial Vineyard Estate',
                  startingBid: '$18,500,000',
                  specs: '140 Acres · Boutique Winery & Luxury Cellar Door',
                  date: 'September 18, 2026 · 02:00 PM AWST',
                  location: 'Caves Road, Western Australia',
                  organizer: 'Advised by Logeshwaran A',
                },
                {
                  id: 'auc-3',
                  badge: 'PRIVATE SYNDICATION',
                  badgeColor: '#10b981',
                  title: 'Palm Jumeirah Signature Waterfront Villa',
                  startingBid: '$24,000,000',
                  specs: '7 Beds · 9 Baths · Private Beachfront & Yacht Slip',
                  date: 'September 24, 2026 · 11:30 AM GST',
                  location: 'Palm Jumeirah Frond N, Dubai, UAE',
                  organizer: 'Represented by Mohammed Ajmal',
                },
              ].map((auc) => (
                <View
                  key={auc.id}
                  style={{
                    backgroundColor: isDark ? '#08111e' : '#f8fafc',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: isDark ? '#1a273c' : '#e2e8f0',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ backgroundColor: `${auc.badgeColor}25`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                      <Text style={{ color: auc.badgeColor, fontSize: 10.5, fontWeight: '800' }}>
                        {auc.badge}
                      </Text>
                    </View>
                    <Text style={{ color: goldPrimary, fontSize: 14, fontWeight: '800' }}>
                      {auc.startingBid}
                    </Text>
                  </View>

                  <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '800', fontSize: 15, marginTop: 8 }}>
                    {auc.title}
                  </Text>
                  <Text style={{ color: isDark ? '#8b9bb4' : '#64748b', fontSize: 12, marginTop: 4 }}>
                    📐 {auc.specs}
                  </Text>
                  <Text style={{ color: isDark ? '#8b9bb4' : '#64748b', fontSize: 11.5, marginTop: 3 }}>
                    📅 {auc.date} · 📍 {auc.location}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: borderColor }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 11.5 }}>
                      {auc.organizer}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setIsAuctionsModalOpen(false);
                        router.push('/(app)/search');
                      }}
                      style={{ backgroundColor: goldPrimary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 }}
                    >
                      <Text style={{ color: '#000000', fontSize: 12, fontWeight: '800' }}>Bid / Register</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 5. BOOLOK GPT NEWS STORY & OFFICIAL REFERENCE MODAL ── */}
      <Modal
        visible={Boolean(selectedNewsStory)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNewsStory(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor, maxWidth: 640, maxHeight: 680 }]}>
            {selectedNewsStory && (
              <>
                <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 12 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                    <BoolokLogo size={22} color="#ffffff" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>
                        Boolok GPT News · {selectedNewsStory.category || 'Real Estate Intelligence'}
                      </Text>
                      <Text style={{ fontSize: 11, color: isDark ? '#8b9bb4' : '#64748b' }}>
                        Updated daily · {selectedNewsStory.time || 'Today'} · {selectedNewsStory.readers || 'Thousands reading'}
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setSelectedNewsStory(null)} style={{ padding: 4 }}>
                    <MaterialIcons name="close" size={22} color={isDark ? '#8b9bb4' : '#64748b'} />
                  </Pressable>
                </View>

                <ScrollView style={{ marginTop: 14 }} showsVerticalScrollIndicator={false}>
                  <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '800', fontSize: 18, lineHeight: 24 }}>
                    {selectedNewsStory.title}
                  </Text>

                  {selectedNewsStory.summary && (
                    <View style={{ backgroundColor: isDark ? '#162235' : '#f1f5f9', padding: 12, borderRadius: 8, marginTop: 12, borderLeftWidth: 3, borderLeftColor: goldPrimary }}>
                      <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: 13, lineHeight: 19, fontWeight: '500' }}>
                        {selectedNewsStory.summary}
                      </Text>
                    </View>
                  )}

                  <Text style={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: 13.5, lineHeight: 21, marginTop: 14 }}>
                    {selectedNewsStory.content || selectedNewsStory.snippet || 'Real-time property transactions demonstrate accelerating liquidity into premier commercial and residential assets.'}
                  </Text>

                  {/* Official Reference & Daily Source Link */}
                  <View style={{ marginTop: 20, padding: 14, borderRadius: 10, backgroundColor: isDark ? '#08111e' : '#f8fafc', borderWidth: 1, borderColor: isDark ? '#1a273c' : '#e2e8f0' }}>
                    <Text style={{ color: goldPrimary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
                      OFFICIAL SOURCE & REFERENCE LINK
                    </Text>
                    <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: 13, fontWeight: '600', marginTop: 4 }}>
                      {selectedNewsStory.sourceName || 'Bloomberg Real Estate & Global Property Index'}
                    </Text>
                    <Pressable
                      onPress={() => {
                        const url = selectedNewsStory.sourceUrl || 'https://www.bloomberg.com/real-estate';
                        if (Platform.OS === 'web') {
                          window.open(url, '_blank');
                        } else {
                          Linking.openURL(url);
                        }
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}
                    >
                      <MaterialIcons name="open-in-new" size={16} color="#38bdf8" />
                      <Text style={{ color: '#38bdf8', fontSize: 12.5, fontWeight: '700', textDecorationLine: 'underline' }}>
                        {selectedNewsStory.sourceUrl || 'https://www.bloomberg.com/real-estate'}
                      </Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (isDark: boolean, width: number = 1024) => {
  const isDesktop = width >= 1024;
  const isMobile = width < 768;
  const isSmallMobile = width < 450;
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#cbd5e1' : '#475569';
  const textMuted = isDark ? '#8b9bb4' : '#64748b';
  const borderCol = isDark ? '#1a273c' : '#E2E8F0';
  const inputBg = isDark ? '#070e1a' : '#F1F5F9';
  const itemBubbleBg = isDark ? '#162235' : '#F1F5F9';
  const cardBackground = isDark ? '#0c1626' : '#FFFFFF';
  const actionBtnBackground = isDark ? '#1a273c' : '#F8FAFC';

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? '#060B13' : '#F8FAFC',
    },
    scrollContent: {
      paddingVertical: isMobile ? 12 : 24,
      paddingHorizontal: isMobile ? 10 : 16,
      alignItems: 'center',
    },
    mainLayoutContainer: {
      width: '100%',
      maxWidth: 1180,
      flexDirection: isDesktop ? 'row' : 'column',
      alignItems: isDesktop ? 'flex-start' : 'stretch',
      gap: isDesktop ? 24 : 12,
    },

    // Left Column
    leftColumn: {
      width: 240,
    },
    card: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderCol,
      backgroundColor: cardBackground,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? 'none'
            : '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        } as any,
      }),
    },
    profileCoverBanner: {
      height: 64,
      width: '100%',
      padding: 8,
      alignItems: 'flex-end',
      borderTopLeftRadius: 11,
      borderTopRightRadius: 11,
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
      borderColor: cardBackground,
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
      color: textPrimary,
      textAlign: 'center',
    },
    profileRoleText: {
      fontSize: 12,
      color: textSecondary,
      marginTop: 4,
      textAlign: 'center',
      lineHeight: 16,
    },
    profileLocationText: {
      fontSize: 11,
      color: textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
    companyTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      backgroundColor: isDark ? '#162235' : '#f1f5f9',
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
      borderTopColor: borderCol,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    statRowItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 3,
    },
    statRowLabel: {
      color: textMuted,
      fontSize: 12,
    },
    statRowValue: {
      color: '#e6b800',
      fontSize: 12,
      fontWeight: '700',
    },
    savedItemsBtn: {
      borderTopWidth: 1,
      borderTopColor: borderCol,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
    },
    savedItemsText: {
      color: textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    quickMenuHeading: {
      color: textMuted,
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
      color: textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },

    // Center Column
    centerColumn: {
      flex: 1,
      width: '100%',
      maxWidth: isDesktop ? 580 : '100%',
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
      backgroundColor: inputBg,
      borderWidth: 1,
      borderColor: borderCol,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 12,
      justifyContent: 'center',
    },
    startPostPlaceholder: {
      color: textMuted,
      fontSize: 13,
      fontWeight: '500',
    },
    startPostActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: borderCol,
    },
    composerActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isSmallMobile ? 4 : 6,
      paddingHorizontal: isSmallMobile ? 6 : 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: actionBtnBackground,
    },
    composerActionText: {
      color: textSecondary,
      fontSize: isSmallMobile ? 11 : 12,
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
      backgroundColor: borderCol,
    },
    sortLabel: {
      color: textMuted,
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
      color: textPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
    postAuthorDegree: {
      color: textMuted,
      fontSize: 12,
    },
    postAuthorTitle: {
      color: textMuted,
      fontSize: 11,
      marginTop: 1,
    },
    postTimeText: {
      color: isDark ? '#64748b' : '#94a3b8',
      fontSize: 10,
      marginTop: 2,
    },
    feedFollowBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: actionBtnBackground,
    },
    feedFollowBtnText: {
      fontSize: 12,
      fontWeight: '700',
    },
    postBodyContent: {
      color: isDark ? '#e2e8f0' : '#1e293b',
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
      height: isMobile ? Math.min(width * 0.72, 280) : 340,
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
      borderBottomColor: borderCol,
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
      color: textMuted,
      fontSize: 11,
    },
    socialCommentsCountText: {
      color: textMuted,
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
      gap: isSmallMobile ? 4 : 6,
      paddingVertical: 8,
      paddingHorizontal: isSmallMobile ? 6 : 12,
    },
    postActionItemText: {
      color: textMuted,
      fontSize: isSmallMobile ? 11 : 12,
      fontWeight: '600',
    },

    // Comments Drawer
    commentSectionDrawer: {
      borderTopWidth: 1,
      borderTopColor: borderCol,
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
      backgroundColor: inputBg,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      color: textPrimary,
      fontSize: 12.5,
      borderWidth: 1,
      borderColor: borderCol,
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
      backgroundColor: itemBubbleBg,
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
      color: isDark ? '#e2e8f0' : '#1e293b',
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
      color: textPrimary,
      fontSize: 14,
      fontWeight: '800',
      marginLeft: 8,
    },
    newsSubheader: {
      color: textMuted,
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
      color: textPrimary,
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
    },
    newsItemMeta: {
      color: textMuted,
      fontSize: 10,
      marginTop: 2,
    },
    showMoreNewsBtn: {
      paddingVertical: 10,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: borderCol,
      marginTop: 8,
    },
    showMoreNewsText: {
      color: '#e6b800',
      fontSize: 11,
      fontWeight: '700',
    },

    // Suggested Advisors
    advisorsHeading: {
      color: textPrimary,
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
      color: textPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
    advisorSubtitle: {
      color: textMuted,
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
      color: isDark ? '#64748b' : '#94a3b8',
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
    },
    footerCopyright: {
      color: isDark ? '#475569' : '#64748b',
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
      padding: isMobile ? 10 : 20,
    },
    modalBox: {
      width: '100%',
      maxWidth: isMobile ? '96%' : 540,
      maxHeight: isMobile ? '92%' : '85%',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderCol,
      backgroundColor: cardBackground,
      padding: isMobile ? 14 : 20,
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
      color: textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    modalAuthorPrivacy: {
      color: textMuted,
      fontSize: 11,
      marginTop: 2,
    },
    modalTextInput: {
      backgroundColor: inputBg,
      borderRadius: 8,
      padding: 14,
      color: textPrimary,
      fontSize: 14,
      minHeight: 120,
      textAlignVertical: 'top',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: borderCol,
    },
    modalUrlInput: {
      backgroundColor: inputBg,
      borderWidth: 1,
      borderColor: borderCol,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: textPrimary,
      fontSize: 13,
      marginBottom: 16,
    },
    modalUploadOptionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    modalUploadDeviceBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: actionBtnBackground,
      borderWidth: 1.5,
      borderColor: '#38bdf8',
      borderRadius: 8,
      paddingVertical: 11,
      paddingHorizontal: 12,
    },
    modalUploadDeviceText: {
      color: '#38bdf8',
      fontSize: 13,
      fontWeight: '700',
    },
    modalUploadCameraBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: actionBtnBackground,
      borderWidth: 1,
      borderColor: borderCol,
      borderRadius: 8,
      paddingVertical: 11,
      paddingHorizontal: 14,
    },
    modalUploadCameraText: {
      color: textSecondary,
      fontSize: 12.5,
      fontWeight: '600',
    },
    imagePreviewBox: {
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: borderCol,
      backgroundColor: inputBg,
    },
    imagePreviewImg: {
      width: '100%',
      height: 190,
    },
    imagePreviewInfoBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: cardBackground,
      borderTopWidth: 1,
      borderTopColor: borderCol,
    },
    imagePreviewLabel: {
      color: textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    imagePreviewRemoveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#ef4444',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
    },
    imagePreviewRemoveText: {
      color: '#ffffff',
      fontSize: 11,
      fontWeight: '700',
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
};