import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography } from '../../constants/theme';
import Animated, {
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { API_BASE_URL, resolveImageUrl } from '../../lib/api';

const DUMMY_VIDEOS = [
  {
    _id: '1',
    title: 'Margaret River Vineyard',
    location: 'Western Australia',
    aiMatch: 98,
    insight: 'Soil analysis indicates 92% suitability for premium Cabernet Sauvignon. Water rights pre-verified for 50 years with automated yield forecasts.',
    likes: 0,
    likesCount: 0,
    poster: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    music: 'Boolok AI · Viticulture Advisory Track',
    author: {
      _id: 'sai',
      fullName: 'Sai Vimenthan',
      username: 'saivimenthan',
      profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c',
      isVerified: true,
      headline: 'Principal Broker · Commercial Assets',
    },
    comments: [
      {
        _id: 'c1-1',
        user: {
          fullName: 'Shreekutti',
          username: 'shreekutti',
          profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
        },
        text: 'The terroir and climate suitability metrics are exceptional here! 🍇✨',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        _id: 'c1-2',
        user: {
          fullName: 'Ajmal',
          username: 'ajmal',
          profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
        },
        text: '50-year pre-verified water rights make this a bulletproof acquisition. 🍷',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        _id: 'c1-3',
        user: {
          fullName: 'Yashwanth',
          username: 'yashwanth',
          profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
        },
        text: 'Incredible drone framing! Would love to feature this estate portfolio. 🎥',
        createdAt: new Date(Date.now() - 14400000).toISOString(),
      },
    ],
  },
  {
    _id: '2',
    title: 'Uluwatu Cliffside Resort',
    location: 'Bali, Indonesia',
    aiMatch: 92,
    insight: 'Tourism growth in this sector is up 14% YoY. Zoning allows for luxury boutique resort development with private oceanfront boardwalks.',
    likes: 0,
    likesCount: 0,
    poster: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    music: 'Boolok AI · Coastal Hospitality Radar',
    author: {
      _id: 'logeshwarana',
      fullName: 'Logeshwaran A',
      username: 'logeshwaran',
      profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r=s96-c',
      isVerified: true,
      headline: 'Architectural Consultant · Tech Parks',
    },
    comments: [
      {
        _id: 'c2-1',
        user: {
          fullName: 'Yashwanth',
          username: 'yashwanth',
          profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
        },
        text: 'Breathtaking ocean cliff views! Perfect setting for luxury resort hospitality. 🌅🏖️',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        _id: 'c2-2',
        user: {
          fullName: 'Shreekutti',
          username: 'shreekutti',
          profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
        },
        text: '14% YoY tourism surge matches our regional Bali portfolio forecast. 📈',
        createdAt: new Date(Date.now() - 5400000).toISOString(),
      },
      {
        _id: 'c2-3',
        user: {
          fullName: 'Ajmal',
          username: 'ajmal',
          profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
        },
        text: 'Zoning approvals for boutique development add immediate upside. 🔑',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
      },
    ],
  },
  {
    _id: '3',
    title: 'Kyoto Forest Retreat',
    location: 'Kyoto, Japan',
    aiMatch: 95,
    insight: 'Thermal zoning optimized. High potential for eco-luxury cabins or a private wellness estate with mountain spring access.',
    likes: 0,
    likesCount: 0,
    poster: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    music: 'Boolok AI · Alpine Zen Intelligence',
    author: {
      _id: 'yashwanth',
      fullName: 'Yashwanth',
      username: 'yashwanth_cre',
      profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
      isVerified: true,
      headline: 'Commercial Realty · Tech Hubs',
    },
    comments: [
      {
        _id: 'c3-1',
        user: {
          fullName: 'Ajmal',
          username: 'ajmal',
          profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
        },
        text: 'Thermal zoning and serene forested topography are hard to find in Kyoto! ⛩️🍃',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        _id: 'c3-2',
        user: {
          fullName: 'Shreekutti',
          username: 'shreekutti',
          profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
        },
        text: 'Eco-luxury cabins here will command top-tier international ADRs. 🏡✨',
        createdAt: new Date(Date.now() - 14400000).toISOString(),
      },
    ],
  },
  {
    _id: '4',
    title: 'Coventry Tech Campus',
    location: 'Coventry, United Kingdom',
    aiMatch: 97,
    insight: 'Strong enterprise tenant interest in logistics and green tech lab spaces. Excellent connectivity to Birmingham transit network.',
    likes: 0,
    likesCount: 0,
    poster: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    music: 'Boolok AI · Corporate Industrial Audio',
    author: {
      _id: 'shreekutti',
      fullName: 'Shreekutti',
      username: 'shree_arch',
      profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      isVerified: true,
      headline: 'Residential & CRE Architect · Chennai',
    },
    comments: [
      {
        _id: 'c4-1',
        user: {
          fullName: 'Logeshwaran A',
          username: 'logeshwaran',
          profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r=s96-c',
        },
        text: 'Grade-A office specs with strong institutional tenant appeal. 🏢💼',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        _id: 'c4-2',
        user: {
          fullName: 'Sai Vimenthan',
          username: 'saivimenthan',
          profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c',
        },
        text: 'High floor efficiency and convenient transit access. 🚆',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
];

const SHARE_CONTACTS = [
  { id: '1', name: 'Shreekutti', role: 'Residential Architect · Chennai', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' },
  { id: '2', name: 'Ajmal', role: 'CRE Advisory & Multi-Family', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120' },
  { id: '3', name: 'Yashwanth', role: 'Commercial Realty · Tech Hubs', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120' },
  { id: '4', name: 'Logeshwaran A', role: 'Architectural Consultant · Tech Parks', avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r=s96-c' },
  { id: '5', name: 'Sai Vimenthan', role: 'Principal Broker · Commercial Assets', avatar: 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c' },
];

const DEFAULT_POSTERS: Record<string, string> = {
  'Uluwatu Cliffside Resort': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
  'Kyoto Forest Retreat': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200',
  'Coventry Tech Campus': 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
  'Margaret River Vineyard': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
};

const MarketIntelligenceSidebar = ({ theme, isDark }: { theme: any, isDark: boolean }) => {
  const cardBg = isDark ? theme.surfaceContainerHigh : theme.surface;
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <Animated.View entering={FadeIn} style={[styles.sidebarCollapsed, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant }]}>
        <Pressable
          onPress={() => setIsExpanded(true)}
          style={[styles.miBotIcon, { backgroundColor: theme.primary }]}
        >
          <MaterialCommunityIcons name="robot-outline" size={24} color={theme.onPrimary} />
        </Pressable>
        <View style={{ marginTop: 24, height: 150, width: 24, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.onSurfaceVariant, fontSize: 12, fontWeight: 'bold', transform: [{ rotate: '90deg' }], width: 150, textAlign: 'center', letterSpacing: 2 }}>
            MARKET INSIGHTS
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn} style={[styles.sidebar, { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: theme.onSurface, fontSize: 16, fontWeight: 'bold' }}>Market Insights</Text>
        <Pressable onPress={() => setIsExpanded(false)} style={{ padding: 4 }}>
          <MaterialIcons name="close" size={20} color={theme.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={{ color: theme.onSurfaceVariant, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 12 }}>
          REAL-TIME RADAR
        </Text>

        <View style={[styles.miLocationRow, { backgroundColor: cardBg, borderColor: theme.outlineVariant }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.miLocationIcon, { backgroundColor: isDark ? theme.surfaceContainerHighest : theme.surfaceContainerLow }]}>
              <MaterialIcons name="location-on" size={18} color={theme.primary} />
            </View>
            <View>
              <Text style={{ color: theme.onSurface, fontSize: 14, fontWeight: '600' }}>Western Australia</Text>
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 12 }}>High Viticulture Yields</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.onSurfaceVariant} />
        </View>

        <View style={[styles.miLocationRow, { backgroundColor: cardBg, borderColor: theme.outlineVariant }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.miLocationIcon, { backgroundColor: isDark ? theme.surfaceContainerHighest : theme.surfaceContainerLow }]}>
              <MaterialIcons name="location-on" size={18} color={theme.primary} />
            </View>
            <View>
              <Text style={{ color: theme.onSurface, fontSize: 14, fontWeight: '600' }}>Bali, Indonesia</Text>
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 12 }}>+14% YoY Tourism Growth</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.onSurfaceVariant} />
        </View>

        <View style={[styles.miLocationRow, { backgroundColor: cardBg, borderColor: theme.outlineVariant }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.miLocationIcon, { backgroundColor: isDark ? theme.surfaceContainerHighest : theme.surfaceContainerLow }]}>
              <MaterialIcons name="location-on" size={18} color={theme.primary} />
            </View>
            <View>
              <Text style={{ color: theme.onSurface, fontSize: 14, fontWeight: '600' }}>Kyoto, Japan</Text>
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 12 }}>Thermal Eco-Resort Zone</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={theme.onSurfaceVariant} />
        </View>

        <Text style={{ color: theme.onSurfaceVariant, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, marginTop: 16, marginBottom: 12 }}>
          PORTFOLIO PULSE
        </Text>

        <View style={[styles.miCard, { backgroundColor: cardBg, borderColor: theme.outlineVariant }]}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.onSurfaceVariant, fontSize: 12, marginBottom: 8 }}>Global Land Liquidity</Text>
            <View style={[styles.miProgressBarBg, { backgroundColor: isDark ? theme.surfaceContainerHighest : theme.surfaceContainerLow }]}>
              <View style={[styles.miProgressBarFill, { backgroundColor: theme.primary, width: '78%' }]} />
            </View>
          </View>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: theme.onSurfaceVariant, fontSize: 12, marginBottom: 8 }}>AI Match Accuracy (Avg)</Text>
            <View style={[styles.miProgressBarBg, { backgroundColor: isDark ? theme.surfaceContainerHighest : theme.surfaceContainerLow }]}>
              <View style={[styles.miProgressBarFill, { backgroundColor: theme.primary, width: '94%' }]} />
            </View>
          </View>

          <Text style={{ color: theme.onSurface, fontSize: 24, fontWeight: 'bold' }}>$14.2B</Text>
          <Text style={{ color: theme.onSurfaceVariant, fontSize: 12 }}>Total Assets Under Monitoring</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// ── Heart burst component for double-tap ─────────────────────────────────────
const HeartBurst = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(120)}
      style={styles.heartBurstContainer}
      pointerEvents="none"
    >
      <View style={styles.heartBurstGlow}>
        <MaterialIcons name="favorite" size={90} color="#ff2d55" />
      </View>
    </Animated.View>
  );
};

// ── Single Video Item ────────────────────────────────────────────────────────
const VideoItem = ({
  item,
  isActive,
  cardHeight,
  cardWidth,
  isMobile,
  onDelete,
  onOpenUpload,
}: any) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [deleting, setDeleting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState(false);

  // Follow author state
  const authorId = item.author?._id || item.author?.id || item.author?.username || 'sai';
  const authorName = item.author?.fullName || item.author?.name || 'Verified Advisor';
  const authorHandle = item.author?.username ? `@${item.author.username}` : '@boolok_pro';
  const authorAvatar = item.author?.profilePicture || item.author?.avatar;

  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('boolok_following_users_set');
        if (raw) {
          const set = JSON.parse(raw);
          return Boolean(set[authorId]);
        }
      } catch (_) {}
    }
    return false;
  });

  // Likes state - real database count
  const initialLikes = typeof item.likesCount === 'number'
    ? item.likesCount
    : (Array.isArray(item.likes) ? item.likes.length : (typeof item.likes === 'number' ? item.likes : 0));
  const [likesCount, setLikesCount] = useState<number>(initialLikes);
  const [hasLiked, setHasLiked] = useState<boolean>(() => {
    if (Boolean(item.isLiked)) return true;
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('boolok_liked_reels_set');
        if (raw) {
          const set = JSON.parse(raw);
          return Boolean(set[item._id]);
        }
      } catch (_) {}
    }
    return false;
  });

  // Keep likes accurately synchronized when reel data updates from server
  useEffect(() => {
    const realCount = typeof item.likesCount === 'number'
      ? item.likesCount
      : (Array.isArray(item.likes) ? item.likes.length : (typeof item.likes === 'number' ? item.likes : 0));
    setLikesCount(realCount);
    if (typeof item.isLiked === 'boolean') {
      setHasLiked(item.isLiked);
    }
  }, [item._id, item.likesCount, item.likes, item.isLiked]);

  // Saved state
  const [isSaved, setIsSaved] = useState<boolean>(() => {
    if (Platform.OS === 'web') {
      try {
        const savedRaw = localStorage.getItem('boolok_saved_reels');
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          return Array.isArray(parsed) && parsed.some((r: any) => r._id === item._id || r.id === item._id);
        }
      } catch (_) {}
    }
    return false;
  });

  // Comments state
  const [comments, setComments] = useState<any[]>(() => {
    let base = Array.isArray(item.comments) ? item.comments : [];
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem(`boolok_comments_${item._id}`);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached) && cached.length > 0) {
            return cached;
          }
        }
      } catch (_) {}
    }
    return base;
  });
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedContacts, setSharedContacts] = useState<Record<string, boolean>>({});

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Video playback references
  const webVideoRef = useRef<any>(null);
  const lastTapRef = useRef<number>(0);
  const commentsScrollRef = useRef<ScrollView>(null);

  const player = useVideoPlayer(item.videoUrl, (p) => {
    p.loop = true;
    p.muted = isMuted;
  });

  // Load mobile persistent storage on mount
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        // Liked state
        const likedRaw = await SecureStore.getItemAsync('boolok_liked_reels_set');
        if (likedRaw) {
          const set = JSON.parse(likedRaw);
          if (set[item._id]) setHasLiked(true);
        }
        // Saved state
        const savedRaw = await SecureStore.getItemAsync('boolok_saved_reels');
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          if (Array.isArray(parsed) && parsed.some((r: any) => r._id === item._id || r.id === item._id)) {
            setIsSaved(true);
          }
        }
        // Following state
        const followRaw = await SecureStore.getItemAsync('boolok_following_users_set');
        if (followRaw) {
          const set = JSON.parse(followRaw);
          if (set[authorId]) setIsFollowing(true);
        }
        // Comments cache
        const commentsRaw = await SecureStore.getItemAsync(`boolok_comments_${item._id}`);
        if (commentsRaw) {
          const parsed = JSON.parse(commentsRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setComments(parsed);
          }
        }
      } catch (_) {}
    })();
  }, [item._id, authorId]);

  // Autoplay / Pause based on visibility
  useEffect(() => {
    if (isActive) {
      if (Platform.OS === 'web' && webVideoRef.current) {
        const vid = webVideoRef.current;
        vid.muted = isMuted;
        const p = vid.play();
        if (p !== undefined) {
          p.then(() => {
            setIsPlaying(true);
          }).catch(() => {
            vid.muted = true;
            vid.play().then(() => setIsPlaying(true)).catch(() => {});
          });
        }
      } else if (player) {
        player.muted = isMuted;
        player.play();
        setIsPlaying(true);
      }
    } else {
      if (Platform.OS === 'web' && webVideoRef.current) {
        webVideoRef.current.pause();
      } else if (player) {
        player.pause();
      }
      setIsPlaying(false);
    }
  }, [isActive, isMuted]);

  // Handle Play / Pause toggle
  const togglePlay = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();

    if (Platform.OS === 'web' && webVideoRef.current) {
      const vid = webVideoRef.current;
      if (vid.paused) {
        vid.play().then(() => setIsPlaying(true)).catch(() => {
          vid.muted = true;
          vid.play().then(() => setIsPlaying(true)).catch(() => {});
        });
      } else {
        vid.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (player) {
      if (player.playing) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    }
  };

  // Toggle Mute
  const toggleMute = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (Platform.OS === 'web' && webVideoRef.current) {
      webVideoRef.current.muted = nextMuted;
    } else if (player) {
      player.muted = nextMuted;
    }
  };

  // Trigger Heart Burst
  const triggerHeartBurst = () => {
    setShowHeartBurst(true);
    setTimeout(() => {
      setShowHeartBurst(false);
    }, 700);
  };

  // Tap handler: single tap play/pause, double tap like
  const handleVideoPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap -> Like
      if (!hasLiked) {
        handleLike();
      } else {
        triggerHeartBurst();
      }
    } else {
      togglePlay();
    }
    lastTapRef.current = now;
  };

  // Like Toggle
  const handleLike = async (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();

    const nextState = !hasLiked;
    setHasLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    if (nextState) {
      triggerHeartBurst();
    }

    // Save to local cache
    try {
      if (Platform.OS === 'web') {
        const raw = localStorage.getItem('boolok_liked_reels_set');
        const set = raw ? JSON.parse(raw) : {};
        if (nextState) set[item._id] = true;
        else delete set[item._id];
        localStorage.setItem('boolok_liked_reels_set', JSON.stringify(set));
      } else {
        const raw = await SecureStore.getItemAsync('boolok_liked_reels_set');
        const set = raw ? JSON.parse(raw) : {};
        if (nextState) set[item._id] = true;
        else delete set[item._id];
        await SecureStore.setItemAsync('boolok_liked_reels_set', JSON.stringify(set));
      }
    } catch (_) {}

    // Send to backend if valid DB reel
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      if (item._id && token) {
        const res = await axios.put(
          `${API_BASE_URL}/api/reels/${item._id}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data) {
          if (typeof res.data.likesCount === 'number') {
            setLikesCount(res.data.likesCount);
          }
          if (typeof res.data.isLiked === 'boolean') {
            setHasLiked(res.data.isLiked);
          }
        }
      }
    } catch (err) {
      console.warn('Liked in local session');
    }
  };

  // Follow Toggle
  const handleToggleFollow = async (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const nextFollow = !isFollowing;
    setIsFollowing(nextFollow);

    try {
      if (Platform.OS === 'web') {
        const raw = localStorage.getItem('boolok_following_users_set');
        const set = raw ? JSON.parse(raw) : {};
        if (nextFollow) set[authorId] = true;
        else delete set[authorId];
        localStorage.setItem('boolok_following_users_set', JSON.stringify(set));
      } else {
        const raw = await SecureStore.getItemAsync('boolok_following_users_set');
        const set = raw ? JSON.parse(raw) : {};
        if (nextFollow) set[authorId] = true;
        else delete set[authorId];
        await SecureStore.setItemAsync('boolok_following_users_set', JSON.stringify(set));
      }
    } catch (_) {}
  };

  // Save / Bookmark Toggle
  const handleToggleSave = async (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    const reelPayload = {
      _id: item._id,
      id: item._id,
      title: item.title,
      location: item.location,
      insight: item.insight,
      aiMatch: item.aiMatch,
      likes: likesCount,
      videoUrl: item.videoUrl,
      thumbnail: item.thumbnail || item.poster,
      poster: item.poster || item.thumbnail,
      author: item.author,
      savedAt: new Date().toISOString(),
    };

    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('boolok_saved_reels');
        let list: any[] = raw ? JSON.parse(raw) : [];
        if (nextSaved) {
          if (!list.some((r) => r._id === item._id || r.id === item._id)) {
            list.unshift(reelPayload);
          }
        } else {
          list = list.filter((r) => r._id !== item._id && r.id !== item._id);
        }
        localStorage.setItem('boolok_saved_reels', JSON.stringify(list));
      } catch (_) {}
    } else {
      try {
        const raw = await SecureStore.getItemAsync('boolok_saved_reels');
        let list: any[] = raw ? JSON.parse(raw) : [];
        if (nextSaved) {
          if (!list.some((r) => r._id === item._id || r.id === item._id)) {
            list.unshift(reelPayload);
          }
        } else {
          list = list.filter((r) => r._id !== item._id && r.id !== item._id);
        }
        await SecureStore.setItemAsync('boolok_saved_reels', JSON.stringify(list));
      } catch (_) {}
    }
  };

  // Share to contact
  const handleShareToContact = (contactId: string) => {
    setSharedContacts((prev) => ({ ...prev, [contactId]: true }));
    setTimeout(() => {
      setSharedContacts((prev) => ({ ...prev, [contactId]: false }));
    }, 2000);
  };

  // Add Comment
  const handleAddComment = async () => {
    if (!commentInput.trim() || isSubmittingComment) return;
    const text = commentInput.trim();
    setCommentInput('');
    setIsSubmittingComment(true);

    const currentUserObj = {
      _id: user?.id || user?._id || 'me',
      fullName: user?.fullName || 'You',
      username: user?.username || 'member',
      profilePicture: user?.profilePicture || null,
    };

    const newComment = {
      _id: `comment_${Date.now()}`,
      user: currentUserObj,
      author: currentUserObj,
      text,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments);

    // Save to local cache
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(`boolok_comments_${item._id}`, JSON.stringify(updatedComments));
      } else {
        await SecureStore.setItemAsync(`boolok_comments_${item._id}`, JSON.stringify(updatedComments));
      }
    } catch (_) {}

    // Send to backend if server reel
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      if (token && item._id && !['1', '2', '3', '4'].includes(item._id)) {
        const res = await axios.post(
          `${API_BASE_URL}/api/reels/${item._id}/comments`,
          { text },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data && Array.isArray(res.data.comments)) {
          setComments(res.data.comments);
          if (Platform.OS === 'web') {
            localStorage.setItem(`boolok_comments_${item._id}`, JSON.stringify(res.data.comments));
          }
        }
      }
    } catch (err) {
      console.warn('Comment added in local session');
    } finally {
      setIsSubmittingComment(false);
      setTimeout(() => {
        commentsScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Open comments and fetch server comments if available
  const handleOpenComments = async () => {
    setShowComments(true);
    if (!['1', '2', '3', '4'].includes(item._id)) {
      try {
        const token = Platform.OS === 'web'
          ? localStorage.getItem('userToken')
          : await SecureStore.getItemAsync('userToken');

        const res = await axios.get(`${API_BASE_URL}/api/reels/${item._id}/comments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data && Array.isArray(res.data)) {
          const formatted = res.data.map((c: any) => ({
            _id: c._id,
            user: c.author || { fullName: 'Advisor' },
            text: c.text,
            createdAt: c.createdAt,
          }));
          setComments(formatted);
        }
      } catch (_) {}
    }
  };

  // Navigate to profile
  const handleGoToProfile = (id?: string) => {
    setShowComments(false);
    const target = id || authorId || 'sai';
    router.push({ pathname: '/(app)/profile', params: { id: target } });
  };

  const currentUserId = String(user?.id || user?._id || '');
  const currentUsername = String(user?.username || '').toLowerCase();
  const authorUserId = String(item.author?._id || item.author?.id || '');
  const authorUserHandle = String(item.author?.username || '').toLowerCase();

  const isUploadedByMe = Boolean(
    (currentUserId && authorUserId && currentUserId === authorUserId) ||
    (currentUsername && authorUserHandle && currentUsername === authorUserHandle) ||
    authorUserId === 'you' ||
    authorUserHandle === 'you' ||
    authorUserHandle === 'logeshwaran' ||
    authorUserHandle === 'logeshwarana' ||
    authorUserId === 'logeshwarana'
  );

  const isDeletable = Boolean(onDelete && isUploadedByMe);

  return (
    <View
      style={[
        styles.videoContainer,
        {
          height: cardHeight,
          width: cardWidth,
          borderRadius: isMobile ? 0 : 24,
          marginBottom: isMobile ? 0 : 36,
          borderWidth: isMobile ? 0 : 1,
          borderColor: '#1e293b',
        },
      ]}
    >
      {/* ── Video Background / Tap Layer ── */}
      <TouchableOpacity
        activeOpacity={0.98}
        onPress={handleVideoPress}
        style={StyleSheet.absoluteFill}
      >
        {/* Background Cover Image fallback so screen is NEVER black */}
        <Image
          source={{
            uri:
              item.poster ||
              item.thumbnail ||
              DEFAULT_POSTERS[item.title] ||
              'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
          }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {Platform.OS === 'web' ? (
          <video
            ref={webVideoRef}
            src={item.videoUrl}
            poster={
              item.poster ||
              item.thumbnail ||
              DEFAULT_POSTERS[item.title] ||
              'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200'
            }
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
            }}
          />
        ) : (
          <VideoView
            player={player}
            style={{ width: cardWidth, height: cardHeight }}
            contentFit="cover"
            nativeControls={false}
          />
        )}

        {/* Center Heart Burst on double tap */}
        <HeartBurst visible={showHeartBurst} />

        {/* Play / Pause Indicator */}
        {!isPlaying && (
          <View style={styles.playOverlay} pointerEvents="none">
            <View style={styles.playIconContainer}>
              <MaterialIcons name="play-arrow" size={50} color={theme.primary} />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Top Bar Overlay: Insights Branding + AI Match Badge + Sound & Upload Controls ── */}
      <View
        style={[
          styles.topOverlay,
          { top: isMobile ? (Platform.OS === 'web' ? 14 : 44) : 18 },
        ]}
        pointerEvents="box-none"
      >
        {/* Left: Brand Title (Mobile) + AI Match Badge */}
        <View style={styles.topLeftContainer}>
          {isMobile && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 2 }}>
              <Text style={styles.mobileTopTitle}>Insights</Text>
              <View style={[styles.liveDot, { backgroundColor: theme.primary }]} />
            </View>
          )}
          <View style={styles.aiMatchBadge}>
            <View style={[styles.pulseDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.aiMatchText, { color: theme.primary }]}>
              {item.aiMatch || 96}% AI MATCH
            </Text>
          </View>
        </View>

        {/* Right: Sound / Mute Toggle + Upload Button */}
        <View style={styles.topRightContainer}>
          <TouchableOpacity
            onPress={toggleMute}
            style={styles.soundBtn}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isMuted ? 'volume-off' : 'volume-up'}
              size={18}
              color="#ffffff"
            />
          </TouchableOpacity>

          {isMobile && onOpenUpload && (
            <TouchableOpacity
              onPress={onOpenUpload}
              style={[styles.topUploadBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={15} color="#000000" />
              <Text style={styles.topUploadBtnText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Right Social Actions Rail ── */}
      <View style={[styles.rightOverlay, { bottom: isMobile ? 66 : 32 }]} pointerEvents="box-none">
        {/* Creator Avatar with follow badge */}
        <View style={styles.creatorRailItem}>
          <TouchableOpacity
            onPress={() => handleGoToProfile(authorId)}
            activeOpacity={0.8}
            style={styles.creatorAvatarRing}
          >
            {authorAvatar && (authorAvatar.startsWith('http') || authorAvatar.startsWith('data:')) ? (
              <Image source={{ uri: authorAvatar }} style={styles.creatorAvatarImg} resizeMode="cover" />
            ) : (
              <View style={[styles.creatorAvatarFallback, { backgroundColor: theme.primary }]}>
                <Text style={{ color: '#000', fontWeight: '800', fontSize: 13 }}>
                  {(authorName || 'V').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {!isFollowing && (
            <TouchableOpacity
              onPress={handleToggleFollow}
              style={[styles.miniFollowPlus, { backgroundColor: theme.primary }]}
              activeOpacity={0.7}
            >
              <MaterialIcons name="add" size={13} color="#000" />
            </TouchableOpacity>
          )}
        </View>

        {/* Like Button */}
        <TouchableOpacity
          onPress={handleLike}
          activeOpacity={0.7}
          style={styles.actionBtn}
        >
          <View style={[styles.actionIconContainer, hasLiked && styles.actionIconContainerLiked]}>
            <MaterialIcons
              name={hasLiked ? 'favorite' : 'favorite-border'}
              size={24}
              color={hasLiked ? '#ff2d55' : '#ffffff'}
            />
          </View>
          <Text style={[styles.actionText, hasLiked && { color: '#ff2d55', fontWeight: '700' }]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          onPress={handleOpenComments}
          activeOpacity={0.7}
          style={styles.actionBtn}
        >
          <View style={styles.actionIconContainer}>
            <MaterialCommunityIcons name="comment-text-outline" size={23} color="#ffffff" />
          </View>
          <Text style={styles.actionText}>{comments.length}</Text>
        </TouchableOpacity>

        {/* Bookmark / Save Button */}
        <TouchableOpacity
          onPress={handleToggleSave}
          activeOpacity={0.7}
          style={styles.actionBtn}
        >
          <View style={[styles.actionIconContainer, isSaved && styles.actionIconContainerSaved]}>
            <MaterialIcons
              name={isSaved ? 'bookmark' : 'bookmark-border'}
              size={24}
              color={isSaved ? theme.primary : '#ffffff'}
            />
          </View>
          <Text style={[styles.actionText, isSaved && { color: theme.primary, fontWeight: '700' }]}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          onPress={() => setShowShareModal(true)}
          activeOpacity={0.7}
          style={styles.actionBtn}
        >
          <View style={styles.actionIconContainer}>
            <MaterialCommunityIcons name="share" size={23} color="#ffffff" />
          </View>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        {/* Delete button for user's uploaded reels */}
        {isDeletable && (
          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            disabled={deleting}
            activeOpacity={0.7}
            style={styles.actionBtn}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.25)', borderColor: 'rgba(239, 68, 68, 0.5)' }]}>
              {deleting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
              )}
            </View>
            <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Bottom Overlay: Author Bar, Title, Location, AI Insight, Music ── */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.72)']}
        style={[
          styles.bottomOverlay,
          {
            paddingBottom: isMobile ? 64 : 20,
            paddingRight: isMobile ? 74 : 70,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Author row */}
        <View style={styles.authorRow}>
          <TouchableOpacity
            onPress={() => handleGoToProfile(authorId)}
            style={styles.authorProfileLink}
            activeOpacity={0.8}
          >
            <Text style={styles.authorNameText} numberOfLines={1}>{authorName}</Text>
            <MaterialIcons name="verified" size={14} color="#38bdf8" style={{ marginLeft: 3 }} />
            <Text style={styles.authorHandleText} numberOfLines={1}>{authorHandle}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleFollow}
            style={[
              styles.authorFollowBtn,
              isFollowing
                ? { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }
                : { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.authorFollowBtnText,
                { color: isFollowing ? '#ffffff' : '#000000' },
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Property Title */}
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        {/* Location Badge */}
        {Boolean(item.location) && (
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={14} color={theme.primary} />
            <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
          </View>
        )}

        {/* Expandable AI Insight */}
        {Boolean(item.insight) && (
          <View style={styles.insightContainer}>
            <View style={styles.insightHeader}>
              <MaterialCommunityIcons name="brain" size={14} color={theme.primary} />
              <Text style={[styles.insightTitle, { color: theme.primary }]}>AI INSIGHT</Text>
            </View>
            <Text
              style={styles.insightText}
              numberOfLines={expandedInsight ? undefined : 2}
            >
              {item.insight}
            </Text>
            {item.insight.length > 80 && (
              <TouchableOpacity
                onPress={() => setExpandedInsight(!expandedInsight)}
                style={{ marginTop: 3 }}
              >
                <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: '700' }}>
                  {expandedInsight ? 'Show less' : '...more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Audio / Music Track Marquee Pill */}
        <View style={styles.musicPill}>
          <MaterialCommunityIcons name="music-note" size={13} color="#ffffff" style={{ marginRight: 5 }} />
          <Text style={styles.musicText} numberOfLines={1}>
            {item.music || 'Boolok AI · Market Verification Audio'}
          </Text>
        </View>
      </LinearGradient>

      {/* ── Custom Delete Confirmation Modal ── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDeleteModal(false)}>
          <Pressable style={styles.deleteDialogCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.deleteDialogIconBox}>
              <MaterialIcons name="delete-forever" size={32} color="#ef4444" />
            </View>
            <Text style={styles.deleteDialogTitle}>Delete Property Reel</Text>
            <Text style={styles.deleteDialogDesc}>
              Are you sure you want to delete &ldquo;{item.title}&rdquo;? This listing video and all its analytics will be permanently removed.
            </Text>
            <View style={styles.deleteDialogBtnRow}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={styles.deleteDialogCancelBtn}
              >
                <Text style={styles.deleteDialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  setShowDeleteModal(false);
                  setDeleting(true);
                  try {
                    await onDelete(item._id);
                  } finally {
                    setDeleting(false);
                  }
                }}
                style={styles.deleteDialogConfirmBtn}
              >
                <Text style={styles.deleteDialogConfirmText}>Delete Reel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Share Modal ── */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <Pressable
          onPress={() => setShowShareModal(false)}
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.shareCard}
          >
            <View style={styles.shareCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="send" size={20} color={theme.primary} />
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>
                  Share Property Reel
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowShareModal(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color="#8b9bb4" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#8b9bb4', fontSize: 12.5, marginBottom: 14 }}>
              Select a certified broker or advisor to send this video insight:
            </Text>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {SHARE_CONTACTS.map((contact) => {
                const isSent = sharedContacts[contact.id];
                return (
                  <View key={contact.id} style={styles.shareContactRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      {contact.avatar && (contact.avatar.startsWith('http') || contact.avatar.startsWith('data:')) ? (
                        <Image source={{ uri: contact.avatar }} style={styles.shareAvatar} resizeMode="cover" />
                      ) : (
                        <View style={[styles.shareAvatarFallback, { backgroundColor: theme.primary }]}>
                          <Text style={{ color: '#000000', fontWeight: '800', fontSize: 14 }}>
                            {(contact.name || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                          {contact.name}
                        </Text>
                        <Text style={{ color: '#8b9bb4', fontSize: 11.5 }} numberOfLines={1}>
                          {contact.role}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleShareToContact(contact.id)}
                      style={[
                        styles.shareSendBtn,
                        { backgroundColor: isSent ? '#10b981' : theme.primary },
                      ]}
                    >
                      <Text style={{ color: '#000000', fontWeight: '700', fontSize: 12 }}>
                        {isSent ? '✓ Sent' : 'Send'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Real-Time Comments Bottom Sheet / Modal ── */}
      <Modal
        visible={showComments}
        transparent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <Pressable
          onPress={() => setShowComments(false)}
          style={styles.commentsBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.commentsSheet,
              {
                maxHeight: isMobile ? '75%' : '65%',
                height: isMobile ? '75%' : 540,
              },
            ]}
          >
            {/* Sheet Top Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.commentsHeader}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>
                Comments ({comments.length})
              </Text>
              <TouchableOpacity onPress={() => setShowComments(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Comments Scrollable List */}
            <ScrollView
              ref={commentsScrollRef}
              style={{ flex: 1, marginVertical: 10 }}
              showsVerticalScrollIndicator={false}
            >
              {comments.length === 0 ? (
                <View style={styles.emptyCommentsContainer}>
                  <MaterialCommunityIcons name="chat-processing-outline" size={44} color="#475569" />
                  <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: '600', marginTop: 10 }}>
                    No comments yet
                  </Text>
                  <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    Be the first to share an analysis or feedback!
                  </Text>
                </View>
              ) : (
                comments.map((c, idx) => {
                  const cUser = c.user || c.author || {};
                  const cName = cUser.fullName || cUser.username || (typeof c.user === 'string' ? c.user : 'Advisor');
                  const targetId = cUser._id || cUser.id || cUser.username || 'sai';
                  let photoUri = cUser.profilePicture || cUser.avatar;

                  return (
                    <View key={c._id || idx} style={styles.commentItem}>
                      <TouchableOpacity
                        onPress={() => handleGoToProfile(targetId)}
                        style={styles.commentAvatarBtn}
                      >
                        {photoUri && (photoUri.startsWith('http') || photoUri.startsWith('data:')) ? (
                          <Image source={{ uri: photoUri }} style={styles.commentAvatarImg} resizeMode="cover" />
                        ) : (
                          <View style={[styles.commentAvatarFallback, { backgroundColor: theme.primary }]}>
                            <Text style={{ color: '#000000', fontWeight: '800', fontSize: 13 }}>
                              {(cName || 'U').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      <View style={styles.commentContentBox}>
                        <View style={styles.commentUserRow}>
                          <TouchableOpacity onPress={() => handleGoToProfile(targetId)}>
                            <Text style={[styles.commentUserName, { color: theme.primary }]}>
                              {cName}
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.commentTime}>
                            {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{c.text}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Comment Input Row with Real-Time Enter & Submit */}
            <View style={styles.commentInputContainer}>
              {user?.profilePicture && resolveImageUrl(user.profilePicture) ? (
                <Image source={{ uri: resolveImageUrl(user.profilePicture)! }} style={styles.myCommentAvatar} />
              ) : (
                <View style={[styles.myCommentAvatarFallback, { backgroundColor: theme.primary }]}>
                  <Text style={{ color: '#000', fontWeight: '700', fontSize: 12 }}>
                    {(user?.fullName || 'Y').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <TextInput
                value={commentInput}
                onChangeText={setCommentInput}
                placeholder="Add a property insight or feedback..."
                placeholderTextColor="#64748b"
                returnKeyType="send"
                onSubmitEditing={handleAddComment}
                {...(Platform.OS === 'web' && {
                  onKeyDown: (e: any) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  },
                })}
                style={styles.commentInputField}
              />

              <TouchableOpacity
                onPress={handleAddComment}
                disabled={!commentInput.trim() || isSubmittingComment}
                style={[
                  styles.commentSendBtn,
                  { backgroundColor: theme.primary },
                  (!commentInput.trim() || isSubmittingComment) && { opacity: 0.4 },
                ]}
              >
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <MaterialIcons name="send" size={18} color="#000000" />
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

// ── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ visible, onClose, onUploaded, theme, isDark }: any) {
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setVideo(null);
    setTitle('');
    setLocation('');
    setCaption('');
  };

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow access to your media library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      setVideo(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!video) {
      Alert.alert('No video selected', 'Please choose a video to upload.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a property title.');
      return;
    }

    setUploading(true);
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const blobRes = await fetch(video.uri);
        const blob = await blobRes.blob();
        const ext = video.uri.split('.').pop() || 'mp4';
        formData.append('video', blob, `upload.${ext}`);
      } else {
        const ext = video.uri.split('.').pop() || 'mp4';
        (formData as any).append('video', {
          uri: video.uri,
          name: `upload.${ext}`,
          type: video.mimeType || 'video/mp4',
        });
      }

      formData.append('title', title.trim());
      formData.append('location', location.trim());
      formData.append('caption', caption.trim());

      const response = await axios.post(`${API_BASE_URL}/api/reels`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      onUploaded(response.data);
      reset();
      onClose();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Upload failed', err?.response?.data?.message || err.message);
    } finally {
      setUploading(false);
    }
  };

  const cardBg = isDark ? theme.surfaceContainerHigh : theme.surface;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Pressable style={uploadStyles.backdrop} onPress={!uploading ? onClose : undefined}>
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          style={[uploadStyles.sheet, { backgroundColor: cardBg }]}
        >
          <Pressable>
            <View style={[uploadStyles.handle, { backgroundColor: theme.outlineVariant }]} />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={[uploadStyles.headerIcon, { backgroundColor: theme.primaryContainer }]}>
                <MaterialIcons name="video-call" size={18} color={theme.primary} />
              </View>
              <Text style={{ color: theme.onSurface, fontSize: 16, fontWeight: '700', marginLeft: 10 }}>
                Upload Property Reel
              </Text>
            </View>

            <Pressable
              onPress={pickVideo}
              style={[
                uploadStyles.pickerRow,
                {
                  borderColor: video ? theme.primary : theme.outlineVariant,
                  backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest,
                },
              ]}
            >
              <View
                style={[
                  uploadStyles.pickerIconBox,
                  {
                    backgroundColor: video
                      ? theme.primaryContainer
                      : (isDark ? theme.surfaceContainerHigh : theme.surfaceContainerLow),
                  },
                ]}
              >
                <MaterialIcons
                  name={video ? 'check-circle' : 'upload-file'}
                  size={20}
                  color={video ? theme.primary : theme.onSurfaceVariant}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={{ color: video ? theme.primary : theme.onSurface, fontSize: 13, fontWeight: '600' }}
                  numberOfLines={1}
                >
                  {video ? (video.fileName ?? video.uri.split('/').pop()) : 'Choose video file'}
                </Text>
                <Text style={{ color: theme.onSurfaceVariant, fontSize: 11, marginTop: 2 }}>
                  {video ? 'Tap to replace file' : 'MP4, MOV · up to 200 MB'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={theme.onSurfaceVariant} />
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={{ flex: 3 }}>
                <Text style={[uploadStyles.label, { color: theme.onSurfaceVariant }]}>Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Property name"
                  placeholderTextColor={theme.onSurfaceVariant}
                  style={[
                    uploadStyles.input,
                    {
                      color: theme.onSurface,
                      borderColor: theme.outlineVariant,
                      backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest,
                    },
                  ]}
                />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={[uploadStyles.label, { color: theme.onSurfaceVariant }]}>Location</Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, Country"
                  placeholderTextColor={theme.onSurfaceVariant}
                  style={[
                    uploadStyles.input,
                    {
                      color: theme.onSurface,
                      borderColor: theme.outlineVariant,
                      backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={{ marginTop: 10, marginBottom: 16 }}>
              <Text style={[uploadStyles.label, { color: theme.onSurfaceVariant }]}>Caption / Insights</Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Market metrics, zoning, ROI data…"
                placeholderTextColor={theme.onSurfaceVariant}
                style={[
                  uploadStyles.input,
                  {
                    color: theme.onSurface,
                    borderColor: theme.outlineVariant,
                    backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest,
                  },
                ]}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={onClose}
                disabled={uploading}
                style={[uploadStyles.btn, { flex: 1, borderWidth: 1, borderColor: theme.outlineVariant }]}
              >
                <Text style={{ color: theme.onSurfaceVariant, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleUpload}
                disabled={uploading}
                style={[uploadStyles.btn, { flex: 2, backgroundColor: theme.primary }]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                  <Text style={{ color: theme.onPrimary, fontSize: 13, fontWeight: '700' }}>Upload Reel</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function InsightsScreen() {
  const { theme, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768; // Standard responsive breakpoint
  const [listHeight, setListHeight] = useState(height);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videos, setVideos] = useState<any[]>(DUMMY_VIDEOS);
  const [showUpload, setShowUpload] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Layout sizing
  const cardWidth = isMobile ? width : 420;
  const mobileDefaultHeight = Math.max(300, height - 64);
  const cardHeight = isMobile
    ? (listHeight > 200 ? listHeight : mobileDefaultHeight)
    : Math.min(height - 120, 750);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // Load backend reels on mount
  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      const response = await axios.get(`${API_BASE_URL}/api/reels`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data && response.data.length > 0) {
        const dbReels = response.data.map((r: any) => ({
          _id: r._id,
          title: r.title || r.caption || 'Untitled',
          location: r.location || '',
          aiMatch: r.aiMatch ?? 95,
          insight: r.insight || r.caption || '',
          likes: r.likesCount ?? (Array.isArray(r.likes) ? r.likes.length : 0),
          likesCount: r.likesCount ?? (Array.isArray(r.likes) ? r.likes.length : 0),
          isLiked: Boolean(r.isLiked),
          comments: Array.isArray(r.comments) ? r.comments : [],
          author: r.author || {
            _id: 'sai',
            fullName: 'Sai Vimenthan',
            username: 'saivimenthan',
            profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c',
            isVerified: true,
          },
          poster:
            r.poster ||
            r.thumbnail ||
            DEFAULT_POSTERS[r.title] ||
            'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
          videoUrl: r.videoUrl.startsWith('http')
            ? r.videoUrl
            : `${API_BASE_URL}${r.videoUrl}`,
          music: 'Boolok AI · Market Verification Audio',
        }));

        // Set real reels directly from database without hardcoded dummy additions
        setVideos(dbReels);
      }
    } catch (err) {
      console.warn('Could not load reels from server, using demo data.');
    }
  };

  const handleUploaded = (newReel: any) => {
    const mapped = {
      _id: newReel._id,
      title: newReel.title || 'Untitled',
      location: newReel.location || '',
      aiMatch: newReel.aiMatch ?? 96,
      insight: newReel.insight || newReel.caption || '',
      likes: newReel.likesCount ?? 0,
      isLiked: false,
      comments: [],
      author: newReel.author || {
        _id: 'you',
        fullName: 'You',
        username: 'you',
        profilePicture: null,
      },
      videoUrl: newReel.videoUrl?.startsWith('http')
        ? newReel.videoUrl
        : `${API_BASE_URL}${newReel.videoUrl}`,
      music: 'Boolok AI · User Uploaded Property Radar',
    };
    setVideos((prev) => [mapped, ...prev]);
  };

  const handleDelete = async (reelId: string) => {
    // 1. Immediately remove from local state so UI updates with zero delay
    setVideos((prev) => prev.filter((v) => v._id !== reelId && v.id !== reelId));

    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      if (token && reelId && !['1', '2', '3', '4'].includes(reelId)) {
        await axios.delete(`${API_BASE_URL}/api/reels/${reelId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err: any) {
      console.warn('Backend delete info:', err?.response?.data?.message || err.message);
    }
  };

  // Scroll to Next / Previous Reel (for desktop click & keyboard)
  const scrollToNext = useCallback(() => {
    if (activeVideoIndex < videos.length - 1) {
      const nextIdx = activeVideoIndex + 1;
      setActiveVideoIndex(nextIdx);
      flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
    }
  }, [activeVideoIndex, videos.length]);

  const scrollToPrev = useCallback(() => {
    if (activeVideoIndex > 0) {
      const prevIdx = activeVideoIndex - 1;
      setActiveVideoIndex(prevIdx);
      flatListRef.current?.scrollToIndex({ index: prevIdx, animated: true });
    }
  }, [activeVideoIndex]);

  // Desktop keyboard shortcuts on Web
  useEffect(() => {
    if (Platform.OS !== 'web' || isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as any)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        scrollToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        scrollToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollToNext, scrollToPrev, isMobile]);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: isMobile ? '#000000' : (isDark ? '#0b0f17' : theme.background) },
      ]}
      entering={FadeIn.duration(300)}
    >
      {isMobile ? (
        // ── MOBILE VIEW: Full bleed reels feed with unified non-colliding overlays ──
        <View
          style={{ flex: 1, width: '100%' }}
          onLayout={(e) => {
            const h = Math.round(e.nativeEvent.layout.height);
            if (h > 200 && Math.abs(h - listHeight) > 6) {
              setListHeight(h);
            }
          }}
        >
          <FlatList
            ref={flatListRef}
            data={videos}
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{ flexGrow: 1 }}
            renderItem={({ item, index }) => (
              <VideoItem
                item={item}
                isActive={activeVideoIndex === index}
                cardHeight={cardHeight}
                cardWidth={cardWidth}
                isMobile={true}
                onDelete={handleDelete}
                onOpenUpload={() => setShowUpload(true)}
              />
            )}
            keyExtractor={(item) => item._id}
            pagingEnabled={true}
            snapToInterval={cardHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={cardHeight > 100 ? (_, index) => ({
              length: cardHeight,
              offset: cardHeight * index,
              index,
            }) : undefined}
          />
        </View>
      ) : (
        // ── COMPUTER / DESKTOP VIEW: Luxury centered player with sidebar & controls ──
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            {/* Desktop Top Header */}
            <View style={styles.desktopHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[typography.headlineLg, { color: theme.onSurface, fontWeight: '800' }]}>
                    Market Insights
                  </Text>
                  <View style={[styles.liveBadge, { backgroundColor: 'rgba(249, 192, 61, 0.15)', borderColor: theme.primary }]}>
                    <View style={[styles.liveDot, { backgroundColor: theme.primary }]} />
                    <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '800' }}>LIVE RADAR</Text>
                  </View>
                </View>
                <Text style={[typography.bodyMd, { color: theme.onSurfaceVariant, marginTop: 4 }]}>
                  High-yield commercial drone tours and AI-verified land acquisitions.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowUpload(true)}
                style={[styles.desktopUploadBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <MaterialIcons name="video-call" size={20} color="#000000" />
                <Text style={{ color: '#000000', fontSize: 13, fontWeight: '800', marginLeft: 6 }}>
                  Upload Property Reel
                </Text>
              </TouchableOpacity>
            </View>

            {/* Desktop Reel Frame & Side Navigation Controls */}
            <View style={styles.desktopPlayerArea}>
              <FlatList
                ref={flatListRef}
                data={videos}
                renderItem={({ item, index }) => (
                  <VideoItem
                    item={item}
                    isActive={activeVideoIndex === index}
                    cardHeight={cardHeight}
                    cardWidth={cardWidth}
                    isMobile={false}
                    onDelete={handleDelete}
                    onOpenUpload={() => setShowUpload(true)}
                  />
                )}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                contentContainerStyle={{ alignItems: 'center', paddingVertical: 10 }}
                snapToInterval={cardHeight + 36}
                snapToAlignment="start"
                decelerationRate="fast"
                getItemLayout={(_, index) => ({
                  length: cardHeight + 36,
                  offset: (cardHeight + 36) * index,
                  index,
                })}
              />

              {/* Desktop Up / Down Float Navigation Rail */}
              <View style={styles.desktopNavRail}>
                <TouchableOpacity
                  onPress={scrollToPrev}
                  disabled={activeVideoIndex === 0}
                  style={[
                    styles.desktopNavBtn,
                    activeVideoIndex === 0 && { opacity: 0.3 },
                  ]}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="keyboard-arrow-up" size={26} color="#ffffff" />
                </TouchableOpacity>

                <View style={styles.desktopCounterBadge}>
                  <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>
                    {activeVideoIndex + 1}
                  </Text>
                  <Text style={{ color: '#64748b', fontSize: 10 }}>/</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                    {videos.length}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={scrollToNext}
                  disabled={activeVideoIndex === videos.length - 1}
                  style={[
                    styles.desktopNavBtn,
                    activeVideoIndex === videos.length - 1 && { opacity: 0.3 },
                  ]}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="keyboard-arrow-down" size={26} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Market Intelligence Sidebar on wide desktop */}
          <MarketIntelligenceSidebar theme={theme} isDark={isDark} />
        </View>
      )}

      {/* Upload Reel Modal */}
      <UploadModal
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={handleUploaded}
        theme={theme}
        isDark={isDark}
      />
    </Animated.View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Mobile Top Bar
  mobileTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  mobileTopTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 6,
  },
  mobileUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  // Desktop Header
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 12,
    width: '100%',
    maxWidth: 900,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  desktopUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  desktopPlayerArea: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  desktopNavRail: {
    position: 'absolute',
    right: 28,
    top: '40%',
    transform: [{ translateY: -60 }],
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 6,
    alignItems: 'center',
    gap: 8,
    zIndex: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  desktopNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopCounterBadge: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  // Video Card Container
  videoContainer: {
    backgroundColor: '#0a0e17',
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 10,
  },
  playIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(249, 192, 61, 0.6)',
  },
  heartBurstContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  heartBurstGlow: {
    shadowColor: '#ff2d55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
  },
  // Top Overlay
  topOverlay: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 192, 61, 0.4)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  aiMatchText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  soundBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  topUploadBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 2,
  },
  // Right Social Rail
  rightOverlay: {
    position: 'absolute',
    right: 10,
    zIndex: 30,
    alignItems: 'center',
    width: 52,
  },
  creatorRailItem: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#f9c03d',
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  creatorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  creatorAvatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniFollowPlus: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  actionBtn: {
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 2,
  },
  actionIconContainerLiked: {
    backgroundColor: 'rgba(255, 45, 85, 0.25)',
    borderColor: '#ff2d55',
  },
  actionIconContainerSaved: {
    backgroundColor: 'rgba(249, 192, 61, 0.25)',
    borderColor: '#f9c03d',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Bottom Overlay
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingLeft: 14,
    paddingRight: 74,
    paddingTop: 24,
    zIndex: 15,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'nowrap',
  },
  authorProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 2,
  },
  authorNameText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 0,
  },
  authorHandleText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 4,
    flexShrink: 1,
  },
  authorFollowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    flexShrink: 0,
  },
  authorFollowBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  insightContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(249, 192, 61, 0.35)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  insightTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 5,
    letterSpacing: 0.5,
  },
  insightText: {
    color: '#e2e8f0',
    fontSize: 12.5,
    lineHeight: 17,
  },
  musicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  musicText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 240,
  },
  // Modal Backdrops
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Custom Delete Dialog
  deleteDialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 24,
    alignItems: 'center',
  },
  deleteDialogIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  deleteDialogTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  deleteDialogDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  deleteDialogBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  deleteDialogCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteDialogCancelText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteDialogConfirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteDialogConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  // Share Card
  shareCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 22,
  },
  shareCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 12,
  },
  shareContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#162033',
    borderRadius: 14,
    marginBottom: 8,
  },
  shareAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  shareAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareSendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  // Comments Sheet
  commentsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  commentsSheet: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#0c1322',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 12,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  commentAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  commentAvatarImg: {
    width: 36,
    height: 36,
  },
  commentAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContentBox: {
    flex: 1,
    backgroundColor: '#162033',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  commentUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentTime: {
    color: '#64748b',
    fontSize: 11,
  },
  commentText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
  commentInputContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  myCommentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  myCommentAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInputField: {
    flex: 1,
    backgroundColor: '#162033',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13.5,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Market Intelligence Sidebar
  sidebar: {
    width: 300,
    borderLeftWidth: 1,
    padding: 16,
  },
  sidebarCollapsed: {
    width: 72,
    borderLeftWidth: 1,
    paddingTop: 28,
    alignItems: 'center',
  },
  miCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  miBotIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  miLocationIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miProgressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  miProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

// ── Upload modal styles ───────────────────────────────────────────────────────
const uploadStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  handle: {
    width: 34,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
