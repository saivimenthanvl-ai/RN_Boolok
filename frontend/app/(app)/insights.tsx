import React, { useEffect, useState, useRef } from 'react';
// Note: useState and useRef kept for MarketIntelligenceSidebar usage
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
import { spacing, typography, radius } from '../../constants/theme';
import Animated, { FadeIn, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

const DUMMY_VIDEOS = [
  {
    _id: '1',
    title: 'Margaret River Vineyard',
    location: 'Western Australia',
    aiMatch: 98,
    insight: 'Soil analysis indicates 92% suitability for premium Cabernet Sauvignon. Water rights pre-verified for 50 years.',
    likes: 2400,
    poster: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    comments: [
      { _id: 'c1-1', user: { fullName: 'shreekutti' }, text: 'The terroir and climate suitability metrics are exceptional here! 🍇✨', createdAt: new Date() },
      { _id: 'c1-2', user: { fullName: 'ajmal' }, text: '50-year pre-verified water rights make this a bulletproof acquisition. 🍷', createdAt: new Date() },
      { _id: 'c1-3', user: { fullName: 'cinemahub.live' }, text: 'Incredible drone framing! Would love to feature this estate portfolio. 🎥', createdAt: new Date() },
    ],
  },
  {
    _id: '2',
    title: 'Uluwatu Cliffside',
    location: 'Bali, Indonesia',
    aiMatch: 92,
    insight: 'Tourism growth in this sector is up 14% YoY. Zoning allows for luxury boutique resort development.',
    likes: 1800,
    poster: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    comments: [
      { _id: 'c2-1', user: { fullName: 'cinemahub.live' }, text: 'Breathtaking ocean cliff views! Perfect setting for luxury resort hospitality. 🌅🏖️', createdAt: new Date() },
      { _id: 'c2-2', user: { fullName: 'shreekutti' }, text: '14% YoY tourism surge matches our regional Bali portfolio forecast. 📈', createdAt: new Date() },
      { _id: 'c2-3', user: { fullName: 'ajmal' }, text: 'Zoning approvals for boutique development add immediate upside. 🔑', createdAt: new Date() },
    ],
  },
  {
    _id: '3',
    title: 'Kyoto Forest Retreat',
    location: 'Kyoto, Japan',
    aiMatch: 95,
    insight: 'Thermal zoning optimized. High potential for eco-luxury cabins or a private wellness estate.',
    likes: 920,
    poster: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    comments: [
      { _id: 'c3-1', user: { fullName: 'ajmal' }, text: 'Thermal zoning and serene forested topography are hard to find in Kyoto! ⛩️🍃', createdAt: new Date() },
      { _id: 'c3-2', user: { fullName: 'shreekutti' }, text: 'Eco-luxury cabins here will command top-tier international ADRs. 🏡✨', createdAt: new Date() },
      { _id: 'c3-3', user: { fullName: 'cinemahub.live' }, text: 'Stunning cinematography and pagoda vista backdrop. 🎬', createdAt: new Date() },
    ],
  },
  {
    _id: '4',
    title: 'Coventry Office',
    location: 'Coventry, United Kingdom',
    aiMatch: 97,
    insight: 'Strong engagement expected based on similar recent listings.',
    likes: 100,
    poster: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    comments: [
      { _id: 'c4-1', user: { fullName: 'Logeshwaran A' }, text: 'Grade-A office specs with strong institutional tenant appeal. 🏢💼', createdAt: new Date() },
      { _id: 'c4-2', user: { fullName: 'shreekutti' }, text: 'High floor efficiency and convenient transit access. 🚆', createdAt: new Date() },
      { _id: 'c4-3', user: { fullName: 'cinemahub.live' }, text: 'Clean architectural lines and modern corporate facade. ✨', createdAt: new Date() },
    ],
  },
];

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
          <MaterialIcons name="close" size={24} color={theme.onSurfaceVariant} />
        </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* AI Assistant Status */}
        <View style={[styles.miCard, { backgroundColor: cardBg, borderColor: theme.outlineVariant }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={[styles.miBotIcon, { backgroundColor: theme.primary }]}>
              <MaterialCommunityIcons name="robot-outline" size={24} color={theme.onPrimary} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[typography.labelMd, { color: theme.onSurface, fontSize: 16, fontWeight: 'bold' }]}>Boolok AI</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <View style={[styles.pulseDot, { backgroundColor: theme.primary, width: 6, height: 6 }]} />
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '500' }}>Online & Analyzing</Text>
              </View>
            </View>
          </View>
          <Text style={{ color: theme.onSurfaceVariant, fontSize: 14, fontStyle: 'italic', lineHeight: 20 }}>
            "I've found 3 new matches in your preferred zones since you last logged in."
          </Text>
        </View>

        {/* Trending Locations */}
        <View style={{ marginTop: 32, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: theme.onSurfaceVariant, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>TRENDING LOCATIONS</Text>
          <MaterialIcons name="more-horiz" size={20} color={theme.onSurfaceVariant} />
        </View>

        {[
          { title: 'Ubud, Bali', change: '+12.4%', icon: 'trending-up', flat: false },
          { title: 'Phuket, TH', change: '+8.2%', icon: 'trending-up', flat: false },
          { title: 'Kyoto, JP', change: '+2.1%', icon: 'trending-flat', flat: true }
        ].map((loc, i) => (
          <View key={i} style={[styles.miLocationRow, { backgroundColor: cardBg, borderColor: theme.outlineVariant }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.miLocationIcon, { backgroundColor: isDark ? theme.surfaceContainerHighest : theme.surfaceContainerLow }]}>
                <MaterialIcons name={loc.icon as any} size={16} color={loc.flat ? theme.onSurfaceVariant : theme.primary} />
              </View>
              <Text style={{ color: theme.onSurface, fontSize: 14, fontWeight: '500', marginLeft: 12 }}>{loc.title}</Text>
            </View>
            <Text style={{ color: loc.flat ? theme.onSurfaceVariant : theme.primary, fontSize: 12, fontWeight: 'bold' }}>{loc.change}</Text>
          </View>
        ))}

        {/* Intelligence Stats */}
        <View style={{ marginTop: 32, marginBottom: 16 }}>
          <Text style={{ color: theme.onSurfaceVariant, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>INTELLIGENCE STATS</Text>
        </View>
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

const SHARE_CONTACTS = [
  { id: '1', name: 'shreekutti', role: 'Residential Architect · Chennai', avatar: 'S' },
  { id: '2', name: 'ajmal', role: 'CRE Advisory & Multi-Family', avatar: 'A' },
  { id: '3', name: 'cinemahub.live', role: 'Studio & Commercial Spaces', avatar: 'C' },
  { id: '4', name: 'Logeshwaran A', role: 'Architectural Consultant · Tech Parks', avatar: 'L' },
  { id: '5', name: 'Sai Vimenthan', role: 'Principal Broker · Commercial Assets', avatar: 'S' },
];

const VideoItem = ({ item, isActive, cardHeight, cardWidth, isMobile, onDelete }: any) => {
  const router = useRouter();
  const { theme } = useTheme();
  const [deleting, setDeleting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(item.likes || 920);
  const [hasLiked, setHasLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedContacts, setSharedContacts] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<any[]>(item.comments || [
    { _id: 'ic1', user: { fullName: 'Logeshwaran A' }, text: 'High potential zoning for hospitality & luxury retreats! 🏢✨', createdAt: new Date() },
    { _id: 'ic2', user: { fullName: 'Sai Vimenthan' }, text: 'Water rights & soil pre-certification confirms strong ROI.', createdAt: new Date() },
  ]);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  const webVideoRef = useRef<any>(null);
  const autoPlayTimerRef = useRef<any>(null);

  const player = useVideoPlayer(item.videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
  });

  // Play reel for 5 to 10 seconds smoothly when active
  useEffect(() => {
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);

    if (isActive) {
      if (Platform.OS === 'web' && webVideoRef.current) {
        const vid = webVideoRef.current;
        vid.muted = true;
        const p = vid.play();
        if (p !== undefined) {
          p.then(() => {
            setIsPlaying(true);
            // Engage for 8 seconds, then loop seamlessly
            autoPlayTimerRef.current = setTimeout(() => {
              if (webVideoRef.current) {
                webVideoRef.current.currentTime = 0;
                webVideoRef.current.play().catch(() => {});
              }
            }, 8000);
          }).catch((e: any) => {
            console.log('Autoplay waiting for user gesture:', e);
            setIsPlaying(false);
          });
        }
      } else if (player) {
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

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isActive]);

  const togglePlay = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();

    if (Platform.OS === 'web' && webVideoRef.current) {
      const vid = webVideoRef.current;
      if (vid.paused) {
        vid.muted = true; // start muted to guarantee browser playback permission
        const p = vid.play();
        if (p !== undefined) {
          p.then(() => {
            setIsPlaying(true);
            // Optionally try unmuting once user has interacted
            try { vid.muted = false; } catch (_) {}
          }).catch(() => {
            vid.muted = true;
            vid.load();
            vid.play().then(() => setIsPlaying(true)).catch(() => {});
          });
        }
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

  const handleLike = () => {
    if (hasLiked) {
      setHasLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
    } else {
      setHasLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const handleToggleSave = () => {
    setIsSaved((prev) => !prev);
  };

  const handleShareToContact = (contactId: string) => {
    setSharedContacts((prev) => ({ ...prev, [contactId]: true }));
    setTimeout(() => {
      setSharedContacts((prev) => ({ ...prev, [contactId]: false }));
    }, 2000);
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    const newC = {
      _id: Date.now().toString(),
      user: { fullName: 'You' },
      text: commentInput.trim(),
      createdAt: new Date(),
    };
    setComments((prev) => [...prev, newC]);
    setCommentInput('');
  };

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Delete this reel? This cannot be undone.')) return;
      setDeleting(true);
      try { await onDelete(item._id); } finally { setDeleting(false); }
    } else {
      Alert.alert(
        'Delete Reel',
        'Are you sure you want to delete this video? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setDeleting(true);
              try { await onDelete(item._id); } finally { setDeleting(false); }
            },
          },
        ]
      );
    }
  };

  const isDeletable = onDelete && !['1', '2', '3', '4'].includes(item._id);

  return (
    <View
      style={[
        styles.videoContainer,
        {
          height: cardHeight,
          width: cardWidth,
          borderRadius: isMobile ? 0 : 24,
          marginBottom: isMobile ? 0 : 40,
        }
      ]}
    >
      {/* ── Play / Pause tap area ── */}
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={togglePlay}
        style={StyleSheet.absoluteFill}
      >
        {Platform.OS === 'web' ? (
          <video
            ref={webVideoRef}
            src={item.videoUrl}
            poster={item.poster}
            loop
            muted
            playsInline
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
          <>
            {item.poster && !player.playing && (
              <Image
                source={{ uri: item.poster }}
                style={[StyleSheet.absoluteFill, { width: cardWidth, height: cardHeight }]}
                resizeMode="cover"
              />
            )}
            <VideoView
              player={player}
              style={{ width: cardWidth, height: cardHeight }}
              contentFit="cover"
              nativeControls={false}
            />
          </>
        )}

        {!isPlaying && (
          <View style={styles.playOverlay} pointerEvents="none">
            <View style={styles.playIconContainer}>
              <MaterialIcons name="play-arrow" size={54} color={theme.primary} />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Top Overlay: AI Match Score ── */}
      <View style={styles.topOverlay} pointerEvents="none">
        <View style={styles.aiMatchBadge}>
          <View style={[styles.pulseDot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.aiMatchText, { color: theme.primary }]}>{item.aiMatch}% AI MATCH</Text>
        </View>
      </View>

      {/* ── Right Actions ── */}
      <View style={[styles.rightOverlay, { bottom: isMobile ? 160 : 80 }]} pointerEvents="box-none">
        {/* Like */}
        <TouchableOpacity
          onPress={handleLike}
          activeOpacity={0.7}
          style={[styles.actionBtn, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
        >
          <View style={[styles.actionIconContainer, hasLiked && { backgroundColor: 'rgba(239, 68, 68, 0.4)', borderColor: '#ef4444' }]}>
            <MaterialIcons
              name={hasLiked ? 'favorite' : 'favorite-border'}
              size={28}
              color={hasLiked ? '#ef4444' : '#fff'}
            />
          </View>
          <Text style={[styles.actionText, hasLiked && { color: '#ef4444', fontWeight: 'bold' }]}>
            {likesCount > 1000 ? (likesCount / 1000).toFixed(1) + 'k' : likesCount}
          </Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          onPress={() => setShowComments(true)}
          activeOpacity={0.7}
          style={[styles.actionBtn, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
        >
          <View style={styles.actionIconContainer}>
            <MaterialCommunityIcons name="comment-text-outline" size={26} color="#fff" />
          </View>
          <Text style={styles.actionText}>{comments.length}</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity
          onPress={handleToggleSave}
          activeOpacity={0.7}
          style={[styles.actionBtn, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
        >
          <View style={[styles.actionIconContainer, isSaved && { backgroundColor: 'rgba(230, 184, 0, 0.35)', borderColor: '#e6b800' }]}>
            <MaterialIcons
              name={isSaved ? 'bookmark' : 'bookmark-border'}
              size={28}
              color={isSaved ? '#e6b800' : '#fff'}
            />
          </View>
          <Text style={[styles.actionText, isSaved && { color: '#e6b800', fontWeight: 'bold' }]}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          onPress={() => setShowShareModal(true)}
          activeOpacity={0.7}
          style={[styles.actionBtn, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
        >
          <View style={styles.actionIconContainer}>
            <MaterialIcons name="share" size={28} color="#fff" />
          </View>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        {/* Delete */}
        {isDeletable && (
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.7}
            style={[
              styles.actionBtn,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
            ]}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(200,40,40,0.5)', borderColor: 'rgba(255,80,80,0.4)' }]}>
              {deleting
                ? <ActivityIndicator size="small" color="#fff" />
                : <MaterialIcons name="delete-outline" size={26} color="#ff6b6b" />}
            </View>
            <Text style={[styles.actionText, { color: '#ff6b6b' }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Share Modal ── */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <Pressable
          onPress={() => setShowShareModal(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#0b1322',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#1a273c',
              padding: 22,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1a273c', paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="send" size={20} color={theme.primary} />
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Share Property Reel</Text>
              </View>
              <Pressable onPress={() => setShowShareModal(false)}>
                <MaterialIcons name="close" size={22} color="#8b9bb4" />
              </Pressable>
            </View>

            <Text style={{ color: '#8b9bb4', fontSize: 12.5, marginBottom: 14 }}>
              Select a certified broker or advisor to send this video listing:
            </Text>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {SHARE_CONTACTS.map((contact) => {
                const isSent = sharedContacts[contact.id];
                return (
                  <View
                    key={contact.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: '#162235',
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#000000', fontWeight: '800', fontSize: 14 }}>{contact.avatar}</Text>
                      </View>
                      <View>
                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>{contact.name}</Text>
                        <Text style={{ color: '#8b9bb4', fontSize: 11.5 }}>{contact.role}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleShareToContact(contact.id)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 16,
                        backgroundColor: isSent ? '#10b981' : theme.primary,
                      }}
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

      {/* ── Bottom Info gradient ── */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        style={[styles.bottomOverlay, { paddingBottom: isMobile ? 90 : 20 }]}
        pointerEvents="none"
      >
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        <View style={styles.insightContainer}>
          <View style={styles.insightHeader}>
            <MaterialCommunityIcons name="brain" size={16} color={theme.primary} />
            <Text style={[styles.insightTitle, { color: theme.primary }]}>AI INSIGHT</Text>
          </View>
          <Text style={styles.insightText}>{item.insight}</Text>
        </View>
      </LinearGradient>

      {/* ── Comments Modal ── */}
      <Modal
        visible={showComments}
        transparent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <Pressable
          onPress={() => setShowComments(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              height: '65%',
              backgroundColor: '#0b1322',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: '#1a273c',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1a273c' }}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Comments ({comments.length})</Text>
              <Pressable onPress={() => setShowComments(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>

            {/* Comments List */}
            <ScrollView style={{ flex: 1, marginVertical: 12 }} showsVerticalScrollIndicator={false}>
              {comments.map((c, idx) => {
                const cUser = c.user || c.author || {};
                const cName = cUser.fullName || cUser.username || (typeof c.user === 'string' ? c.user : 'Advisor');
                let targetId = cUser._id || cUser.id || cUser.username;
                if (!targetId && cName) {
                  const clean = cName.toLowerCase().trim();
                  if (clean.includes('shree')) targetId = 'shreekutti';
                  else if (clean.includes('logesh')) targetId = 'logeshwarana';
                  else if (clean.includes('ajmal')) targetId = 'ajmal';
                  else if (clean.includes('bava')) targetId = 'bavadharini_rs';
                  else if (clean.includes('akshat')) targetId = 'the_akshtr_estate';
                  else if (clean.includes('prasanth')) targetId = 'prasanth_properties';
                  else if (clean.includes('sai')) targetId = 'sai';
                  else targetId = clean.replace(/\s+/g, '_');
                }

                return (
                  <View key={c._id || idx} style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                    <Pressable
                      onPress={() => {
                        setShowComments(false);
                        if (targetId) {
                          router.push({ pathname: '/(app)/profile', params: { id: targetId } });
                        }
                      }}
                      style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Text style={{ color: '#000000', fontWeight: '800', fontSize: 14 }}>
                        {(cName || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </Pressable>
                    <View style={{ flex: 1, backgroundColor: '#162235', borderRadius: 12, padding: 10 }}>
                      <Pressable
                        onPress={() => {
                          setShowComments(false);
                          if (targetId) {
                            router.push({ pathname: '/(app)/profile', params: { id: targetId } });
                          }
                        }}
                      >
                        <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 12.5, marginBottom: 2, textDecorationLine: 'underline' }}>
                          {cName}
                        </Text>
                      </Pressable>
                      <Text style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 18 }}>{c.text}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input Row */}
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1a273c' }}>
              <TextInput
                value={commentInput}
                onChangeText={setCommentInput}
                placeholder="Add an insight or comment..."
                placeholderTextColor="#64748b"
                style={{
                  flex: 1,
                  backgroundColor: '#162235',
                  borderWidth: 1,
                  borderColor: '#1a273c',
                  borderRadius: 24,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  color: '#ffffff',
                  fontSize: 13.5,
                }}
              />
              <Pressable
                onPress={handleAddComment}
                style={[
                  { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
                  !commentInput.trim() && { opacity: 0.5 },
                ]}
                disabled={!commentInput.trim()}
              >
                <MaterialIcons name="send" size={20} color="#000000" />
              </Pressable>
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
    setVideo(null); setTitle(''); setLocation(''); setCaption('');
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
    if (!video) { Alert.alert('No video', 'Please select a video first.'); return; }
    if (!title.trim()) { Alert.alert('Missing title', 'Please enter a title.'); return; }

    setUploading(true);
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      const formData = new FormData();

      if (Platform.OS === 'web') {
        // On web, fetch the blob from the object URL and append it
        const blobRes = await fetch(video.uri);
        const blob = await blobRes.blob();
        const ext = video.uri.split('.').pop() || 'mp4';
        formData.append('video', blob, `upload.${ext}`);
      } else {
        // On native, append the file URI directly
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

      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/reels`, formData, {
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
            {/* Handle */}
            <View style={[uploadStyles.handle, { backgroundColor: theme.outlineVariant }]} />

            {/* Header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={[uploadStyles.headerIcon, { backgroundColor: theme.primaryContainer }]}>
                <MaterialIcons name="video-call" size={18} color={theme.primary} />
              </View>
              <Text style={{ color: theme.onSurface, fontSize: 16, fontWeight: '700', marginLeft: 10 }}>
                Upload Reel
              </Text>
            </View>

            {/* Compact picker row */}
            <Pressable
              onPress={pickVideo}
              style={[uploadStyles.pickerRow, { borderColor: video ? theme.primary : theme.outlineVariant, backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest }]}
            >
              <View style={[uploadStyles.pickerIconBox, { backgroundColor: video ? theme.primaryContainer : (isDark ? theme.surfaceContainerHigh : theme.surfaceContainerLow) }]}>
                <MaterialIcons
                  name={video ? 'check-circle' : 'upload-file'}
                  size={20}
                  color={video ? theme.primary : theme.onSurfaceVariant}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: video ? theme.primary : theme.onSurface, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                  {video ? (video.fileName ?? video.uri.split('/').pop()) : 'Choose video file'}
                </Text>
                <Text style={{ color: theme.onSurfaceVariant, fontSize: 11, marginTop: 2 }}>
                  {video ? 'Tap to change' : 'MP4, MOV · up to 200 MB'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={theme.onSurfaceVariant} />
            </Pressable>

            {/* Title + Location row */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={{ flex: 3 }}>
                <Text style={[uploadStyles.label, { color: theme.onSurfaceVariant }]}>Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Property name"
                  placeholderTextColor={theme.onSurfaceVariant}
                  style={[uploadStyles.input, { color: theme.onSurface, borderColor: theme.outlineVariant, backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest }]}
                />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={[uploadStyles.label, { color: theme.onSurfaceVariant }]}>Location</Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, Country"
                  placeholderTextColor={theme.onSurfaceVariant}
                  style={[uploadStyles.input, { color: theme.onSurface, borderColor: theme.outlineVariant, backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest }]}
                />
              </View>
            </View>

            {/* Caption — single line */}
            <View style={{ marginTop: 10, marginBottom: 16 }}>
              <Text style={[uploadStyles.label, { color: theme.onSurfaceVariant }]}>Caption</Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Short description…"
                placeholderTextColor={theme.onSurfaceVariant}
                style={[uploadStyles.input, { color: theme.onSurface, borderColor: theme.outlineVariant, backgroundColor: isDark ? theme.surfaceContainerLow : theme.surfaceContainerLowest }]}
              />
            </View>

            {/* Actions */}
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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function InsightsScreen() {
  const { theme, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 1024;
  const [listHeight, setListHeight] = useState(height);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videos, setVideos] = useState<any[]>(DUMMY_VIDEOS);
  const [showUpload, setShowUpload] = useState(false);

  const cardWidth = isMobile ? width : Math.min(width - 400, 400);
  const cardHeight = isMobile ? listHeight : cardWidth * (16 / 9);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // ── Load real reels from DB on mount ─────────────────────────────────────
  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/reels`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.length > 0) {
        const dbReels = response.data.map((r: any) => ({
          _id: r._id,
          title: r.title || r.caption || 'Untitled',
          location: r.location || '',
          aiMatch: r.aiMatch ?? 0,
          insight: r.insight || r.caption || '',
          likes: r.likes?.length ?? 0,
          // Uploaded files are relative paths; stream URLs are absolute
          videoUrl: r.videoUrl.startsWith('http')
            ? r.videoUrl
            : `${process.env.EXPO_PUBLIC_API_URL}${r.videoUrl}`,
        }));
        // Real reels first, then dummy placeholders
        setVideos([...dbReels, ...DUMMY_VIDEOS]);
      }
    } catch (err) {
      // Silently fall back to dummy videos if API fails
      console.warn('Could not load reels from server, using demo data.');
    }
  };

  const handleUploaded = (newReel: any) => {
    const mapped = {
      _id: newReel._id,
      title: newReel.title || 'Untitled',
      location: newReel.location || '',
      aiMatch: newReel.aiMatch ?? 0,
      insight: newReel.insight || newReel.caption || '',
      likes: newReel.likes?.length ?? 0,
      videoUrl: `${process.env.EXPO_PUBLIC_API_URL}${newReel.videoUrl}`,
    };
    setVideos((prev) => [mapped, ...prev]);
  };

  const handleDelete = async (reelId: string) => {
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/reels/${reelId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove from local list immediately
      setVideos((prev) => prev.filter((v) => v._id !== reelId));
    } catch (err: any) {
      Alert.alert('Delete failed', err?.response?.data?.message || err.message);
    }
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: isMobile ? '#000' : theme.background }]} entering={FadeIn.duration(400)}>
      {isMobile ? (
        // Mobile: full-screen feed with a slim transparent top bar (upload button top-right)
        <View
          style={{ flex: 1, width: '100%' }}
          onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
        >
          {/* Top bar — sits above content, fully transparent so video shows through */}
          <View style={[styles.mobileTopBar, { justifyContent: 'flex-end' }]}>
            <Pressable
              onPress={() => setShowUpload(true)}
              style={[styles.mobileUploadBtn, { backgroundColor: theme.primary, borderColor: 'transparent', paddingHorizontal: 16, paddingVertical: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 }]}
            >
              <MaterialIcons name="cloud-upload" size={20} color={theme.onPrimary} />
              <Text style={{ color: theme.onPrimary, fontSize: 13, fontWeight: '700', marginLeft: 6 }}>Upload</Text>
            </Pressable>
          </View>

          <FlatList
            data={videos}
            renderItem={({ item, index }) => (
              <VideoItem
                item={item}
                isActive={activeVideoIndex === index}
                cardHeight={cardHeight}
                cardWidth={cardWidth}
                isMobile={isMobile}
                onDelete={handleDelete}
              />
            )}
            keyExtractor={item => item._id}
            pagingEnabled={true}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            snapToAlignment="start"
            decelerationRate="fast"
          />
        </View>
      ) : (
        // Desktop: upload button lives inside the header next to search bar
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
              <FlatList
                data={videos}
                ListHeaderComponent={
                  <View style={styles.desktopHeader}>
                    <Text style={[typography.headlineLg, { color: theme.onSurface, marginBottom: 8 }]}>Video Insights</Text>
                    <Text style={[typography.bodyMd, { color: theme.onSurfaceVariant, marginBottom: 24 }]}>
                      Immersive land analysis and drone tours powered by Boolok AI.
                    </Text>
                    {/* Search + Upload button in same row */}
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      <View style={[styles.searchBar, { flex: 1, backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant }]}>
                        <MaterialIcons name="search" size={20} color={theme.primary} style={{ marginRight: 10 }} />
                        <TextInput
                          style={[styles.searchInput, { color: theme.onSurface }]}
                          placeholder="Search video insights..."
                          placeholderTextColor={theme.onSurfaceVariant}
                        />
                      </View>
                      <Pressable
                        onPress={() => setShowUpload(true)}
                        style={[styles.desktopUploadBtn, { backgroundColor: theme.primary }]}
                      >
                        <MaterialIcons name="add" size={18} color={theme.onPrimary} />
                        <Text style={{ color: theme.onPrimary, fontSize: 13, fontWeight: '700', marginLeft: 6 }}>Upload</Text>
                      </Pressable>
                    </View>
                  </View>
                }
                renderItem={({ item, index }) => (
                  <VideoItem
                    item={item}
                    isActive={activeVideoIndex === index}
                    cardHeight={cardHeight}
                    cardWidth={cardWidth}
                    isMobile={false}
                    onDelete={handleDelete}
                  />
                )}
                keyExtractor={item => item._id}
                pagingEnabled={false}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                snapToAlignment="start"
                decelerationRate="normal"
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
              />
            </View>
          </View>

          <MarketIntelligenceSidebar theme={theme} isDark={isDark} />
        </View>
      )}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sidebar: {
    width: 300,
    borderLeftWidth: 1,
    padding: 16,
  },
  sidebarCollapsed: {
    width: 80,
    borderLeftWidth: 1,
    paddingTop: 32,
    alignItems: 'center',
  },
  miCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  miBotIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 12,
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
  desktopHeader: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  // Desktop header upload button
  desktopUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
  },
  // Mobile transparent top bar
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
    paddingTop: 52,
    paddingBottom: 12,
  },
  mobileTopTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  mobileUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  videoContainer: {
    justifyContent: 'flex-end',
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  // FAB removed — upload button moved to header/top-bar
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  playIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(249, 192, 61, 0.2)', // primary with opacity
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 192, 61, 0.4)',
  },
  topOverlay: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 20,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(249, 192, 61, 0.3)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  aiMatchText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  rightOverlay: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
    alignItems: 'center',
    gap: 24,
  },
  actionBtn: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    zIndex: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginLeft: 4,
  },
  insightContainer: {
    backgroundColor: 'rgba(249, 192, 61, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249, 192, 61, 0.3)',
    borderRadius: 12,
    padding: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  insightText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
  },

});

// ── Upload modal styles ───────────────────────────────────────────────────────
const uploadStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Compact horizontal picker strip
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
    fontWeight: '600',
    marginBottom: 5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  btn: {
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});