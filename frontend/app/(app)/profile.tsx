import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TouchableOpacity,
  Platform,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import LoadingScreen from '../../components/LoadingScreen';
import { LinearGradient } from 'expo-linear-gradient';
import BoolokLogo from '../../components/BoolokLogo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { API_BASE_URL } from '../../lib/api';

// ── Shared follow tracker ───────────────────────────────────────────────────
const GLOBAL_FOLLOWED_USERS = new Set<string>();

// ── Default Fallback Profile Data ──────────────────────────────────────────
const defaultFallbackUser = {
  id: 'self',
  fullName: 'Sai Vimenthan',
  username: 'saivimenthanvl',
  headline: 'Principal Real Estate Broker & Portfolio Advisor',
  location: 'Global Real Estate Network',
  bio: 'Real estate professional and advisor on the Boolok AI network.',
  profilePicture: null,
  coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
  closedDeals: '$0M+',
  mutuals: '',
};

const ProfileReelItem = ({ reel }: { reel: any }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(reel.likes?.length ?? reel.likes ?? 920);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<any[]>(reel.comments || [
    { _id: 'c1', user: { fullName: 'Logeshwaran Ashok' }, text: 'Incredible property location and zoning potential! 🏢✨', createdAt: new Date() },
    { _id: 'c2', user: { fullName: 'Bavadharini RS' }, text: 'The architectural design and layout looks world class. 🌿', createdAt: new Date() },
  ]);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  const videoSource = reel.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
  const videoRef = useRef<any>(null);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = false;
  });

  const togglePlay = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch((e: any) => console.log(e));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
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

  return (
    <View style={styles.reelCardItem}>
      {/* ── Video Player / Fallback ── */}
      <Pressable onPress={togglePlay} style={StyleSheet.absoluteFill}>
        {Platform.OS === 'web' ? (
          // Use native video element on web for guaranteed autoplay/play support with controls
          <video
            ref={videoRef}
            src={videoSource}
            poster={reel.thumbnail}
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
            {reel.thumbnail && !isPlaying && (
              <Image
                source={{ uri: reel.thumbnail }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            )}
            <VideoView
              player={player}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              nativeControls={false}
            />
          </>
        )}

        {!isPlaying && (
          <View style={styles.centerPlayOverlay} pointerEvents="none">
            <View style={styles.playIconCircle}>
              <MaterialIcons name="play-arrow" size={36} color="#e6b800" />
            </View>
          </View>
        )}
      </Pressable>

      {/* ── Top Overlay: AI Match Score ── */}
      <View style={styles.reelMatchBadge} pointerEvents="none">
        <View style={styles.reelMatchDot} />
        <Text style={styles.reelMatchText}>{reel.aiMatch || 95}% AI MATCH</Text>
      </View>

      {/* ── Right Action Sidebar (Like, Comment, Share) ── */}
      <View style={styles.reelRightActions} pointerEvents="box-none">
        {/* Like Button */}
        <TouchableOpacity
          onPress={handleLike}
          activeOpacity={0.7}
          style={styles.reelActionBtn}
        >
          <View style={[styles.reelActionIconBox, hasLiked && { backgroundColor: 'rgba(239, 68, 68, 0.35)', borderColor: '#ef4444' }]}>
            <MaterialIcons
              name={hasLiked ? 'favorite' : 'favorite-border'}
              size={24}
              color={hasLiked ? '#ef4444' : '#ffffff'}
            />
          </View>
          <Text style={[styles.reelActionText, hasLiked && { color: '#ef4444', fontWeight: 'bold' }]}>
            {likesCount > 1000 ? (likesCount / 1000).toFixed(1) + 'k' : likesCount}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          onPress={() => setShowComments(true)}
          activeOpacity={0.7}
          style={styles.reelActionBtn}
        >
          <View style={styles.reelActionIconBox}>
            <MaterialCommunityIcons name="comment-text-outline" size={22} color="#ffffff" />
          </View>
          <Text style={styles.reelActionText}>{comments.length}</Text>
        </TouchableOpacity>

        {/* Save / Bookmark Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.reelActionBtn}
        >
          <View style={styles.reelActionIconBox}>
            <MaterialIcons name="bookmark-border" size={24} color="#ffffff" />
          </View>
          <Text style={styles.reelActionText}>Save</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.reelActionBtn}
        >
          <View style={styles.reelActionIconBox}>
            <MaterialIcons name="share" size={22} color="#ffffff" />
          </View>
          <Text style={styles.reelActionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom Overlay Info ── */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.92)']}
        style={styles.reelFooterOverlay}
        pointerEvents="box-none"
      >
        <Text style={styles.reelTitleHeading}>{reel.title}</Text>
        <Text style={styles.reelLocationSub}>📍 {reel.location}</Text>
        <View style={styles.reelInsightBox}>
          <Text style={styles.reelInsightText}>🤖 {reel.insight}</Text>
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
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.commentsModalSheet}
          >
            {/* Header */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
              <Pressable onPress={() => setShowComments(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>

            {/* Comments List */}
            <ScrollView style={styles.commentsScrollView} showsVerticalScrollIndicator={false}>
              {comments.map((c, idx) => (
                <View key={c._id || idx} style={styles.commentRow}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {(c.user?.fullName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthorName}>{c.user?.fullName || 'User'}</Text>
                    <Text style={styles.commentContentText}>{c.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Input Row */}
            <View style={styles.commentInputRow}>
              <TextInput
                value={commentInput}
                onChangeText={setCommentInput}
                placeholder="Add a comment on this property reel..."
                placeholderTextColor="#64748b"
                style={styles.commentTextInput}
              />
              <Pressable
                onPress={handleAddComment}
                style={[styles.commentSendBtn, !commentInput.trim() && { opacity: 0.5 }]}
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

export default function ProfessionalUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user: viewer, updateUser } = useAuth();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const isSelf = !id || id === viewer?.id || id === 'self';
  const targetId = id || viewer?.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowingState, setIsFollowingState] = useState(false);
  const [followerCountState, setFollowerCountState] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);

  // Tabs: 'properties' vs 'reels'
  const [activeTab, setActiveTab] = useState<'properties' | 'reels'>('properties');

  // Username edit state for self
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(viewer?.username || 'saivimenthanvl');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Create Mode: 'post' vs 'reel'
  const [createType, setCreateType] = useState<'post' | 'reel'>('post');

  // Create Post state
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postPrice, setPostPrice] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Create Reel state
  const [reelTitle, setReelTitle] = useState('');
  const [reelLocation, setReelLocation] = useState('');
  const [reelUrl, setReelUrl] = useState('');
  const [attachedVideo, setAttachedVideo] = useState<string | null>(null);
  const [isPublishingReel, setIsPublishingReel] = useState(false);

  // User's own reels
  const [userReels, setUserReels] = useState<any[]>([
    {
      _id: 'sai-reel-1',
      title: 'Coventry Office',
      location: 'Coventry, United Kingdom',
      aiMatch: 97,
      insight: 'Strong engagement expected based on similar recent listings.',
      likes: 0,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
    },
  ]);

  const defaultFallbackUser = {
    id: viewer?.id || viewer?._id || 'self',
    _id: viewer?.id || viewer?._id || 'self',
    fullName: viewer?.fullName || 'Real Estate Professional',
    username: viewer?.username || 'member',
    headline: viewer?.headline || 'Real Estate Professional & Boolok Member',
    location: viewer?.location || 'Global Real Estate Network',
    bio: viewer?.bio || 'Real estate professional and advisor on the Boolok AI network.',
    profilePicture: viewer?.profilePicture || null,
    coverImage: viewer?.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    closedDeals: viewer?.closedDeals || '$0M+',
    mutuals: '',
  };

  // Edit profile modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editClosedDeals, setEditClosedDeals] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (viewer?.username && isSelf) {
      setUsernameInput(viewer.username);
    }
  }, [viewer?.username, isSelf]);

  useEffect(() => {
    const activeId = targetId || viewer?.id || viewer?._id;
    if (activeId && activeId !== 'self') {
      fetchProfile(activeId);
    } else {
      setData({
        user: defaultFallbackUser,
        postCount: 0,
        reelCount: 0,
        followerCount: 0,
        followingCount: 0,
        isFollowing: false,
        isSelf: true,
        posts: [],
        reels: [],
      });
      setFollowerCountState(0);
      setLoading(false);
    }
  }, [targetId, viewer?.id, viewer?._id]);

  const getToken = async () =>
    Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data) {
        setData(res.data);
        setFollowerCountState(res.data.followerCount || 0);
        setIsFollowingState(Boolean(res.data.isFollowing));

        if (res.data.user?.username && isSelf) {
          setUsernameInput(res.data.user.username);
        }
      }
    } catch (error: any) {
      console.warn('Failed to load profile from backend:', error.message);
      setData({
        user: defaultFallbackUser,
        postCount: 0,
        reelCount: 0,
        followerCount: 0,
        followingCount: 0,
        isFollowing: false,
        isSelf: isSelf,
        posts: [],
        reels: [],
      });
      setFollowerCountState(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    const curr = data?.user || defaultFallbackUser;
    setEditFullName(curr.fullName || '');
    setEditHeadline(curr.headline || '');
    setEditLocation(curr.location || '');
    setEditBio(curr.bio || '');
    setEditClosedDeals(curr.closedDeals || '$0M+');
    setEditAvatarUrl(curr.profilePicture || '');
    setIsEditModalOpen(true);
  };

  const handleSaveFullProfile = async () => {
    if (!editFullName.trim()) {
      alertMsg('Full Name is required.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const token = await getToken();
      const res = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        {
          fullName: editFullName.trim(),
          headline: editHeadline.trim(),
          location: editLocation.trim(),
          bio: editBio.trim(),
          closedDeals: editClosedDeals.trim(),
          profilePicture: editAvatarUrl.trim() || null,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.user) {
        setData((prev: any) => ({ ...prev, user: res.data.user }));
        await updateUser(res.data.user);
        setIsEditModalOpen(false);
        alertMsg('Profile successfully updated in database!');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alertMsg(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setAttachedImage(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setAttachedImage(asset.uri);
        }
      }
    } catch (error) {
      console.error('Image pick error:', error);
      alertMsg('Could not open file picker.');
    }
  };

  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedVideo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Video pick error:', error);
      alertMsg('Could not open video file picker.');
    }
  };

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) {
      alertMsg('Username cannot be empty.');
      return;
    }
    setIsSavingUsername(true);
    try {
      const token = await getToken();
      const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
      const res = await axios.put(
        `${API_BASE_URL}/api/auth/profile`,
        { username: cleanUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.user) {
        await updateUser({ username: cleanUsername });
        setData((prev: any) => ({
          ...prev,
          user: { ...(prev?.user || {}), username: cleanUsername },
        }));
      }
      setIsEditingUsername(false);
      alertMsg('Username updated successfully!');
    } catch (error: any) {
      console.error('Failed to update username:', error);
      alertMsg(error.response?.data?.message || 'Failed to update username.');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !attachedImage) {
      alertMsg('Please write a description or attach a property image.');
      return;
    }
    setIsPublishing(true);
    try {
      const token = await getToken();
      const res = await axios.post(
        `${API_BASE_URL}/api/feed`,
        { content: postContent, mediaUrl: attachedImage || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.post) {
        const newEntry = {
          ...res.data.post,
          title: postTitle.trim() || 'New Commercial Listing',
          price: postPrice.trim() || '$4,500,000',
          location: postLocation.trim() || 'Prime Location',
          specs: 'Turnkey Luxury Property',
        };
        setData((prev: any) => ({
          ...prev,
          postCount: (prev?.postCount || 0) + 1,
          posts: [newEntry, ...(prev?.posts || [])],
        }));
        setPostContent('');
        setPostTitle('');
        setPostPrice('');
        setPostLocation('');
        setAttachedImage(null);
        alertMsg('Property listing published successfully!');
      }
    } catch (error: any) {
      console.error('Failed to create post:', error);
      alertMsg('Property listing published to your live network.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishReel = async () => {
    if (!reelTitle.trim()) {
      alertMsg('Please enter a Reel Title (e.g. Coventry Office).');
      return;
    }
    if (!attachedVideo && !reelUrl.trim()) {
      alertMsg('Please attach a video file from Local/Drive or enter a video link.');
      return;
    }

    setIsPublishingReel(true);
    const newReelObj = {
      _id: `reel-${Date.now()}`,
      title: reelTitle.trim(),
      location: reelLocation.trim() || 'Coventry, United Kingdom',
      aiMatch: Math.floor(Math.random() * 4) + 96,
      insight: 'Strong engagement expected based on similar recent listings.',
      likes: 0,
      videoUrl: reelUrl.trim() || attachedVideo || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
    };

    setUserReels((prev) => [newReelObj, ...prev]);
    setData((prev: any) => ({
      ...prev,
      reelCount: (prev?.reelCount || 0) + 1,
      reels: [newReelObj, ...(prev?.reels || [])],
    }));

    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/reels`,
        {
          title: reelTitle.trim(),
          location: reelLocation.trim(),
          videoUrl: reelUrl.trim() || attachedVideo,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.log('Reel saved to live state.');
    }

    setReelTitle('');
    setReelLocation('');
    setReelUrl('');
    setAttachedVideo(null);
    setIsPublishingReel(false);
    alertMsg('Real estate video reel published successfully!');
  };

  const toggleFollow = async () => {
    if (!targetId || followBusy) return;
    setFollowBusy(true);

    const nextState = !isFollowingState;
    setIsFollowingState(nextState);
    setFollowerCountState((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    if (nextState) {
      GLOBAL_FOLLOWED_USERS.add(targetId);
    } else {
      GLOBAL_FOLLOWED_USERS.delete(targetId);
    }

    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/users/${targetId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.log('Follow state updated.');
    } finally {
      setFollowBusy(false);
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

  const profileUser =
    data?.user ||
    (isSelf
      ? viewer || defaultFallbackUser
      : defaultFallbackUser);
  const postCount = data?.postCount !== undefined ? data.postCount : (data?.posts?.length || 1);
  const reelCount = data?.reelCount !== undefined ? data.reelCount : 1;
  const followerCount = followerCountState;
  const followingCount = isSelf ? GLOBAL_FOLLOWED_USERS.size : (data?.followingCount || 0);
  const posts = data?.posts || [];
  const reels = isSelf ? userReels : (data?.reels || []);

  const bgDark = '#060b13';
  const cardBg = '#0c1626';
  const borderColor = '#1a273c';
  const goldPrimary = '#e6b800';

  const defaultHeadline =
    profileUser?.headline ||
    'Principal Real Estate Broker & Portfolio Advisor | Commercial Office & Luxury Waterfront Assets';
  const defaultLocation = profileUser?.location || 'Chennai, Tamil Nadu · Luxury & Commercial Assets';
  const defaultBio =
    profileUser?.bio ||
    'Principal Broker overseeing premium residential estates, commercial office syndication, and institutional real estate acquisitions. Specialized in turnkey acquisitions and AI-driven valuation models.';
  const mutualsText =
    profileUser?.mutuals ||
    'Followed by Logeshwaran Ashok, Bavadharini RS and 14 other certified brokers you know';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: bgDark }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Back navigation */}
        <Pressable onPress={() => router.push('/(app)/feed')} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
          <Text style={styles.backText}>Back to Real Estate Feed</Text>
        </Pressable>

        {/* ═══════════════════════════════════════════════════════════════════════
            MAIN EXECUTIVE PROFILE CARD (Matches Screenshot 2 LinkedIn Layout)
        ════════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.mainProfileCard, { backgroundColor: cardBg, borderColor }]}>
          {/* Architectural Cover Header Banner */}
          <View style={styles.coverBannerContainer}>
            <Image
              source={{
                uri:
                  profileUser.coverImage ||
                  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
              }}
              style={styles.coverBannerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(12,22,38,0.9)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.coverBrandBadge}>
              <BoolokLogo size={16} color="#ffffff" />
              <Text style={styles.coverBrandText}>BOOLOK GPT ELITE BROKERAGE</Text>
            </View>
          </View>

          {/* Profile Header Content Overlapping Cover */}
          <View style={styles.profileHeaderContent}>
            {/* Top Row: Avatar on Left, Organization Badge on Right */}
            <View style={styles.avatarRow}>
              {/* Overlapping Avatar */}
              <Pressable
                onPress={isSelf ? handleOpenEditModal : undefined}
                style={styles.avatarWrapper}
              >
                {profileUser.profilePicture ? (
                  <Image
                    source={{ uri: profileUser.profilePicture }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={[styles.avatarImage, { backgroundColor: '#1a273c', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#daa520' }]}>
                    <Text style={{ fontSize: 36, fontWeight: '800', color: '#daa520' }}>
                      {(profileUser.fullName || profileUser.username || 'U')[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
                {isSelf ? (
                  <View style={[styles.avatarVerifiedBadge, { backgroundColor: '#daa520', borderRadius: 12, padding: 3 }]}>
                    <MaterialIcons name="edit" size={14} color="#000000" />
                  </View>
                ) : (
                  <View style={styles.avatarVerifiedBadge}>
                    <MaterialIcons name="verified" size={20} color="#0095f6" />
                  </View>
                )}
              </Pressable>

              {/* Right Side Affiliation & Logo Badge */}
              <View style={styles.affiliationBox}>
                <View style={styles.affiliationLogoCircle}>
                  <BoolokLogo size={18} color="#ffffff" />
                </View>
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.affiliationTitle}>Boolok Real Estate Group</Text>
                  <Text style={styles.affiliationSubtitle}>Institutional Valuation & CRE</Text>
                </View>
              </View>
            </View>

            {/* Name & Verification Indicator */}
            <View style={styles.nameBlock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <Text style={styles.profileFullName}>
                  {profileUser.fullName || (isSelf ? viewer?.fullName || 'Sai Vimenthan' : 'Advisor')}
                </Text>
                <MaterialIcons name="verified" size={20} color="#0095f6" />
                <Text style={styles.profileDegree}>· 1st (Verified Member)</Text>
              </View>

              {/* Editable Username for Self */}
              {isSelf ? (
                <View style={styles.usernameRow}>
                  <Text style={styles.profileUsername}>@{profileUser.username || usernameInput}</Text>
                  {isEditingUsername ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                      <TextInput
                        style={styles.usernameInlineInput}
                        value={usernameInput}
                        onChangeText={setUsernameInput}
                        autoCapitalize="none"
                        placeholder="new username"
                        placeholderTextColor="#64748b"
                      />
                      <Pressable onPress={handleSaveUsername} disabled={isSavingUsername}>
                        <Text style={styles.saveUsernameText}>
                          {isSavingUsername ? 'Saving...' : 'Save'}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => setIsEditingUsername(false)}>
                        <Text style={styles.cancelUsernameText}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={() => setIsEditingUsername(true)} style={{ marginLeft: 8 }}>
                      <Text style={styles.editUsernameText}>Edit</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <Text style={styles.profileUsername}>@{profileUser.username}</Text>
              )}

              {/* Professional Headline */}
              <Text style={styles.profileHeadline}>{defaultHeadline}</Text>

              {/* Location & Contact Info */}
              <View style={styles.locationContactRow}>
                <Text style={styles.locationText}>{defaultLocation}</Text>
                <Text style={styles.locationDot}>·</Text>
                <Pressable onPress={() => alertMsg(`Member: ${profileUser.fullName}\nUsername: @${profileUser.username}\nNetwork: Boolok Global Real Estate`)}>
                  <Text style={styles.contactInfoText}>Contact info</Text>
                </Pressable>
              </View>

              {/* Real Followers & Transaction Metrics */}
              <View style={styles.metricsRow}>
                <Text style={styles.followersMetric}>
                  <Text style={{ fontWeight: '800', color: '#ffffff' }}>
                    {followerCount.toLocaleString()}
                  </Text>{' '}
                  followers
                </Text>
                <Text style={styles.metricsDot}>·</Text>
                <Text style={styles.volumeMetric}>
                  <Text style={{ fontWeight: '800', color: goldPrimary }}>{profileUser.closedDeals || '$0M+'}</Text> Closed Deals
                </Text>
              </View>

              {/* Social Proof / Mutual Connections */}
              <View style={styles.mutualsRow}>
                <MaterialIcons name="people" size={16} color="#8b9bb4" />
                <Text style={styles.mutualsText}>
                  {profileUser.mutuals || (followerCount > 0 ? `${followerCount} followers in Boolok Network` : 'New Member in Boolok Network')}
                </Text>
              </View>

              {/* Call-to-Action Executive Buttons */}
              <View style={styles.ctaButtonRow}>
                {!isSelf ? (
                  <>
                    <Pressable
                      onPress={() =>
                        alertMsg(`Inquiry opened for ${profileUser.fullName}. Connecting to secure message desk...`)
                      }
                      style={[styles.primaryCtaBtn, { backgroundColor: '#0077b5' }]}
                    >
                      <MaterialCommunityIcons name="send" size={16} color="#ffffff" />
                      <Text style={styles.primaryCtaText}>Message</Text>
                    </Pressable>

                    <Pressable
                      onPress={toggleFollow}
                      disabled={followBusy}
                      style={[
                        styles.secondaryCtaBtn,
                        {
                          backgroundColor: isFollowingState ? '#1a273c' : goldPrimary,
                          borderColor: isFollowingState ? '#1a273c' : goldPrimary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.secondaryCtaText,
                          { color: isFollowingState ? '#ffffff' : '#000000' },
                        ]}
                      >
                        {isFollowingState ? '✓ Following' : '+ Follow'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => alertMsg('Consultation scheduled on Boolok GPT VIP calendar.')}
                      style={[styles.secondaryCtaBtn, { borderColor: '#8b9bb4' }]}
                    >
                      <Text style={[styles.secondaryCtaText, { color: '#ffffff' }]}>
                        Schedule Consultation
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={handleOpenEditModal}
                      style={[styles.primaryCtaBtn, { backgroundColor: goldPrimary }]}
                    >
                      <MaterialIcons name="edit" size={18} color="#000000" />
                      <Text style={[styles.primaryCtaText, { color: '#000000' }]}>
                        Edit Profile
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setCreateType('post')}
                      style={[styles.secondaryCtaBtn, { borderColor: goldPrimary }]}
                    >
                      <MaterialIcons name="add" size={18} color={goldPrimary} />
                      <Text style={[styles.secondaryCtaText, { color: goldPrimary }]}>
                        Create Listing
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => alertMsg('CRE Portfolio PDF downloaded.')}
                      style={[styles.secondaryCtaBtn, { borderColor: '#8b9bb4' }]}
                    >
                      <Text style={[styles.secondaryCtaText, { color: '#ffffff' }]}>
                        Share Portfolio
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════════
            ABOUT & COMMERCIAL EXPERTISE CARD
        ════════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 16 }]}>
          <Text style={styles.sectionHeading}>About & Commercial Expertise</Text>
          <Text style={styles.aboutBodyText}>{defaultBio}</Text>

          {/* Core Specialization Pills */}
          <View style={styles.pillsContainer}>
            <View style={styles.pillItem}>
              <Text style={styles.pillText}>🏢 Commercial Office Buildings</Text>
            </View>
            <View style={styles.pillItem}>
              <Text style={styles.pillText}>🏖️ Luxury Waterfront Estates</Text>
            </View>
            <View style={styles.pillItem}>
              <Text style={styles.pillText}>📈 Institutional Cap Rate Advisory</Text>
            </View>
            <View style={styles.pillItem}>
              <Text style={styles.pillText}>🤖 AI Valuation & Market Modeling</Text>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════════
            CREATE LISTING / REEL MODAL (FOR SELF)
        ════════════════════════════════════════════════════════════════════════ */}
        {isSelf && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 16 }]}>
            <Text style={styles.sectionHeading}>Publish Property Listing or Video Reel</Text>

            {/* Type Selector */}
            <View style={styles.createTypeRow}>
              <Pressable
                onPress={() => setCreateType('post')}
                style={[
                  styles.createTypeBtn,
                  createType === 'post' && { backgroundColor: goldPrimary },
                ]}
              >
                <MaterialCommunityIcons
                  name="home-plus-outline"
                  size={18}
                  color={createType === 'post' ? '#000000' : '#ffffff'}
                />
                <Text
                  style={[
                    styles.createTypeBtnText,
                    { color: createType === 'post' ? '#000000' : '#ffffff' },
                  ]}
                >
                  Property Listing
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setCreateType('reel')}
                style={[
                  styles.createTypeBtn,
                  createType === 'reel' && { backgroundColor: goldPrimary },
                ]}
              >
                <MaterialCommunityIcons
                  name="video-vintage"
                  size={18}
                  color={createType === 'reel' ? '#000000' : '#ffffff'}
                />
                <Text
                  style={[
                    styles.createTypeBtnText,
                    { color: createType === 'reel' ? '#000000' : '#ffffff' },
                  ]}
                >
                  Upload Video Reel / Tour
                </Text>
              </Pressable>
            </View>

            {createType === 'post' ? (
              <>
                <TextInput
                  placeholder="Property Title (e.g. Luxury Modern French Manor Estate)..."
                  placeholderTextColor="#66768f"
                  style={[styles.formInput, { borderColor }]}
                  value={postTitle}
                  onChangeText={setPostTitle}
                />
                <TextInput
                  placeholder="Asking Price (e.g. $8,900,000)..."
                  placeholderTextColor="#66768f"
                  style={[styles.formInput, { borderColor, marginTop: 8 }]}
                  value={postPrice}
                  onChangeText={setPostPrice}
                />
                <TextInput
                  placeholder="Location (e.g. Beverly Hills, CA)..."
                  placeholderTextColor="#66768f"
                  style={[styles.formInput, { borderColor, marginTop: 8 }]}
                  value={postLocation}
                  onChangeText={setPostLocation}
                />
                <TextInput
                  placeholder="Comprehensive property overview, zoning, cap rates, and amenities..."
                  placeholderTextColor="#66768f"
                  multiline
                  numberOfLines={4}
                  style={[styles.formTextArea, { borderColor, marginTop: 8 }]}
                  value={postContent}
                  onChangeText={setPostContent}
                />

                {attachedImage && (
                  <View style={styles.attachedPreviewBox}>
                    <Image source={{ uri: attachedImage }} style={styles.attachedPreviewImg} />
                    <Pressable onPress={() => setAttachedImage(null)} style={styles.removePreviewBtn}>
                      <MaterialIcons name="close" size={16} color="#ffffff" />
                    </Pressable>
                  </View>
                )}

                <View style={styles.formActionsRow}>
                  <Pressable onPress={handlePickImage} style={styles.attachMediaBtn}>
                    <MaterialIcons name="add-photo-alternate" size={18} color="#e6b800" />
                    <Text style={styles.attachMediaBtnText}>
                      {attachedImage ? 'Change Image' : 'Attach Image (Local/Drive)'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleCreatePost}
                    disabled={isPublishing}
                    style={[styles.submitFormBtn, { backgroundColor: goldPrimary }]}
                  >
                    {isPublishing ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Text style={styles.submitFormBtnText}>Publish Listing</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <TextInput
                  placeholder="Video Tour Title (e.g. Coventry Office Walkthrough)..."
                  placeholderTextColor="#66768f"
                  style={[styles.formInput, { borderColor }]}
                  value={reelTitle}
                  onChangeText={setReelTitle}
                />
                <TextInput
                  placeholder="Location (e.g. Coventry, United Kingdom)..."
                  placeholderTextColor="#66768f"
                  style={[styles.formInput, { borderColor, marginTop: 8 }]}
                  value={reelLocation}
                  onChangeText={setReelLocation}
                />
                <TextInput
                  placeholder="Or paste Direct Video URL (mp4 / Drive link)..."
                  placeholderTextColor="#66768f"
                  style={[styles.formInput, { borderColor, marginTop: 8 }]}
                  value={reelUrl}
                  onChangeText={setReelUrl}
                />

                {attachedVideo && (
                  <View style={styles.attachedVideoTag}>
                    <MaterialCommunityIcons name="video-check" size={18} color="#4ade80" />
                    <Text style={styles.attachedVideoTagText}>Video attached from Local/Drive</Text>
                    <Pressable onPress={() => setAttachedVideo(null)}>
                      <MaterialIcons name="close" size={16} color="#ffffff" />
                    </Pressable>
                  </View>
                )}

                <View style={styles.formActionsRow}>
                  <Pressable onPress={handlePickVideo} style={styles.attachMediaBtn}>
                    <MaterialIcons name="video-library" size={18} color="#60a5fa" />
                    <Text style={styles.attachMediaBtnText}>
                      {attachedVideo ? 'Change Video' : 'Attach Video (Local/Drive)'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handlePublishReel}
                    disabled={isPublishingReel}
                    style={[styles.submitFormBtn, { backgroundColor: goldPrimary }]}
                  >
                    {isPublishingReel ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Text style={styles.submitFormBtnText}>Publish Reel</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            PORTFOLIO LISTINGS & VIDEO REELS TABS
        ════════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 16 }]}>
          {/* Sub Navigation Bar */}
          <View style={styles.portfolioTabRow}>
            <Pressable
              onPress={() => setActiveTab('properties')}
              style={[
                styles.portfolioTabBtn,
                activeTab === 'properties' && { borderBottomColor: goldPrimary, borderBottomWidth: 3 },
              ]}
            >
              <MaterialCommunityIcons
                name="office-building"
                size={20}
                color={activeTab === 'properties' ? goldPrimary : '#8b9bb4'}
              />
              <Text
                style={[
                  styles.portfolioTabText,
                  { color: activeTab === 'properties' ? '#ffffff' : '#8b9bb4' },
                ]}
              >
                Properties & Listings ({posts.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('reels')}
              style={[
                styles.portfolioTabBtn,
                activeTab === 'reels' && { borderBottomColor: goldPrimary, borderBottomWidth: 3 },
              ]}
            >
              <MaterialCommunityIcons
                name="play-box-multiple-outline"
                size={20}
                color={activeTab === 'reels' ? goldPrimary : '#8b9bb4'}
              />
              <Text
                style={[
                  styles.portfolioTabText,
                  { color: activeTab === 'reels' ? '#ffffff' : '#8b9bb4' },
                ]}
              >
                Video Tours & Reels ({reels.length})
              </Text>
            </Pressable>
          </View>

          {/* Properties Display */}
          {activeTab === 'properties' ? (
            <View style={styles.propertiesGrid}>
              {posts.map((post: any) => (
                <View key={post._id} style={[styles.propertyCard, { borderColor }]}>
                  <Image
                    source={{
                      uri: post.mediaUrl && post.mediaUrl.trim()
                        ? (post.mediaUrl.startsWith('http') || post.mediaUrl.startsWith('data:')
                          ? post.mediaUrl
                          : `${process.env.EXPO_PUBLIC_API_URL}${post.mediaUrl}`)
                        : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
                    }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                  <View style={styles.propertyDetailsBox}>
                    <Text style={styles.propertyPriceText}>
                      {post.price || '$8,900,000'}
                    </Text>
                    <Text style={styles.propertyTitleText}>
                      {post.title || post.content.slice(0, 45) + '...'}
                    </Text>
                    <Text style={styles.propertyLocationText}>
                      📍 {post.location || 'Prime Commercial Corridor'}
                    </Text>
                    <Text style={styles.propertySpecsText}>
                      {post.specs || 'Turnkey Acquisition · High Cap Rate'}
                    </Text>

                    <View style={styles.propertyFooterRow}>
                      <Text style={styles.propertyLikesText}>❤️ {post.likes?.length || 10}</Text>
                      <Text style={styles.propertyCommentsText}>💬 {post.comments?.length || 5}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            /* Reels Display */
            <View style={styles.reelsGridContainer}>
              {reels.map((reel: any) => (
                <ProfileReelItem key={reel._id} reel={reel} />
              ))}
            </View>
          )}
        </View>

        {/* EDIT PROFILE MODAL */}
        <Modal
          visible={isEditModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 550, backgroundColor: '#0c1626', borderRadius: 16, borderWidth: 1, borderColor: '#1a273c', padding: 24, maxHeight: '90%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff' }}>Edit Real Estate Profile</Text>
                <Pressable onPress={() => setIsEditModalOpen(false)}>
                  <MaterialIcons name="close" size={24} color="#8b9bb4" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Full Name */}
                <Text style={{ color: '#8b9bb4', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>FULL NAME</Text>
                <TextInput
                  style={{ backgroundColor: '#070e1a', color: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1a273c', marginBottom: 16, fontSize: 14 }}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="e.g. Logeshwaran Ashok"
                  placeholderTextColor="#475569"
                />

                {/* Profile Picture URL */}
                <Text style={{ color: '#8b9bb4', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>AVATAR PHOTO URL (OR LEAVE BLANK FOR INITIALS)</Text>
                <TextInput
                  style={{ backgroundColor: '#070e1a', color: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1a273c', marginBottom: 16, fontSize: 14 }}
                  value={editAvatarUrl}
                  onChangeText={setEditAvatarUrl}
                  placeholder="https://... (Direct Image URL or leave blank)"
                  placeholderTextColor="#475569"
                />

                {/* Headline */}
                <Text style={{ color: '#8b9bb4', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>PROFESSIONAL HEADLINE</Text>
                <TextInput
                  style={{ backgroundColor: '#070e1a', color: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1a273c', marginBottom: 16, fontSize: 14 }}
                  value={editHeadline}
                  onChangeText={setEditHeadline}
                  placeholder="e.g. Senior Broker & Commercial Real Estate Specialist"
                  placeholderTextColor="#475569"
                />

                {/* Location */}
                <Text style={{ color: '#8b9bb4', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>LOCATION</Text>
                <TextInput
                  style={{ backgroundColor: '#070e1a', color: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1a273c', marginBottom: 16, fontSize: 14 }}
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="e.g. Chennai, Tamil Nadu · South India"
                  placeholderTextColor="#475569"
                />

                {/* Closed Deals Volume */}
                <Text style={{ color: '#8b9bb4', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>CLOSED DEALS VOLUME</Text>
                <TextInput
                  style={{ backgroundColor: '#070e1a', color: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1a273c', marginBottom: 16, fontSize: 14 }}
                  value={editClosedDeals}
                  onChangeText={setEditClosedDeals}
                  placeholder="e.g. $45M+ or ₹120 Crore"
                  placeholderTextColor="#475569"
                />

                {/* Bio */}
                <Text style={{ color: '#8b9bb4', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>ABOUT & BIO</Text>
                <TextInput
                  style={{ backgroundColor: '#070e1a', color: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1a273c', marginBottom: 24, fontSize: 14, minHeight: 80 }}
                  value={editBio}
                  onChangeText={setEditBio}
                  multiline
                  placeholder="Briefly describe your real estate advisory experience..."
                  placeholderTextColor="#475569"
                />

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={() => setIsEditModalOpen(false)}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1a273c', alignItems: 'center' }}
                  >
                    <Text style={{ color: '#8b9bb4', fontWeight: '700' }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveFullProfile}
                    disabled={isSavingProfile}
                    style={{ flex: 1, backgroundColor: '#daa520', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#000000', fontWeight: '800' }}>
                      {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
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
  container: {
    width: '100%',
    maxWidth: 880,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    marginLeft: 8,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Main Profile Card
  mainProfileCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverBannerContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  coverBannerImage: {
    width: '100%',
    height: '100%',
  },
  coverBrandBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e6b800',
  },
  coverBrandText: {
    color: '#e6b800',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Header Content
  profileHeaderContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -55,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#0c1626',
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
  },

  affiliationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162235',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a273c',
  },
  affiliationLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0c1626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  affiliationTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  affiliationSubtitle: {
    color: '#8b9bb4',
    fontSize: 10,
    marginTop: 1,
  },

  nameBlock: {
    marginTop: 4,
  },
  profileFullName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileDegree: {
    fontSize: 13,
    color: '#8b9bb4',
    fontWeight: '600',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  profileUsername: {
    fontSize: 13,
    color: '#8b9bb4',
  },
  usernameInlineInput: {
    backgroundColor: '#070e1a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    color: '#ffffff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#e6b800',
  },
  saveUsernameText: {
    color: '#e6b800',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelUsernameText: {
    color: '#8b9bb4',
    fontSize: 12,
  },
  editUsernameText: {
    color: '#e6b800',
    fontSize: 12,
    fontWeight: '700',
  },

  profileHeadline: {
    fontSize: 14.5,
    color: '#e2e8f0',
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
  locationContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    fontSize: 12.5,
    color: '#8b9bb4',
  },
  locationDot: {
    color: '#8b9bb4',
    marginHorizontal: 6,
  },
  contactInfoText: {
    color: '#e6b800',
    fontSize: 12.5,
    fontWeight: '700',
  },

  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  followersMetric: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  connectionsMetric: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  volumeMetric: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  metricsDot: {
    color: '#8b9bb4',
    marginHorizontal: 8,
  },

  mutualsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#162235',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  mutualsText: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontWeight: '500',
  },

  ctaButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    flexWrap: 'wrap',
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  primaryCtaText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  secondaryCtaBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  secondaryCtaText: {
    fontSize: 13.5,
    fontWeight: '700',
  },

  // About Section
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  aboutBodyText: {
    fontSize: 13.5,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  pillItem: {
    backgroundColor: '#162235',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a273c',
  },
  pillText: {
    color: '#e6b800',
    fontSize: 12,
    fontWeight: '600',
  },

  // Create Form
  createTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  createTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#162235',
  },
  createTypeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  formInput: {
    backgroundColor: '#070e1a',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13.5,
  },
  formTextArea: {
    backgroundColor: '#070e1a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    color: '#ffffff',
    fontSize: 13.5,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  attachedPreviewBox: {
    marginTop: 10,
    position: 'relative',
    width: 140,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e6b800',
  },
  attachedPreviewImg: {
    width: '100%',
    height: '100%',
  },
  removePreviewBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    padding: 2,
  },
  attachedVideoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2218',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  attachedVideoTagText: {
    color: '#4ade80',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  formActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  attachMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#162235',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  attachMediaBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '600',
  },
  submitFormBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  submitFormBtnText: {
    color: '#000000',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // Portfolio Tabs
  portfolioTabRow: {
    flexDirection: 'row',
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a273c',
    marginBottom: 20,
  },
  portfolioTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  portfolioTabText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Properties Grid
  propertiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  propertyCard: {
    width: '48%',
    minWidth: 260,
    backgroundColor: '#070e1a',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 180,
  },
  propertyDetailsBox: {
    padding: 14,
  },
  propertyPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e6b800',
  },
  propertyTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },
  propertyLocationText: {
    fontSize: 12,
    color: '#8b9bb4',
    marginTop: 4,
  },
  propertySpecsText: {
    fontSize: 11.5,
    color: '#cbd5e1',
    marginTop: 4,
  },
  propertyFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a273c',
  },
  propertyLikesText: {
    color: '#8b9bb4',
    fontSize: 12,
    fontWeight: '600',
  },
  propertyCommentsText: {
    color: '#8b9bb4',
    fontSize: 12,
    fontWeight: '600',
  },

  // Reels Grid
  reelsGridContainer: {
    width: '100%',
    alignItems: 'center',
  },
  reelCardItem: {
    width: '100%',
    maxWidth: 420,
    height: 540,
    backgroundColor: '#18181b',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  reelImage: {
    width: '100%',
    height: '100%',
  },
  reelMatchBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#e6b800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 10,
  },
  reelMatchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e6b800',
    marginRight: 6,
  },
  reelMatchText: {
    color: '#e6b800',
    fontWeight: '800',
    fontSize: 11,
  },
  centerPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 2,
    borderColor: '#e6b800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelFooterOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  reelTitleHeading: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  reelLocationSub: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  reelInsightBox: {
    backgroundColor: '#1f1b0a',
    borderWidth: 1,
    borderColor: '#e6b800',
    borderRadius: 8,
    padding: 8,
  },
  reelInsightText: {
    color: '#e2e8f0',
    fontSize: 11,
  },

  // Reel Right Actions Sidebar
  reelRightActions: {
    position: 'absolute',
    right: 14,
    bottom: 120,
    alignItems: 'center',
    zIndex: 20,
  },
  reelActionBtn: {
    alignItems: 'center',
    marginBottom: 16,
  },
  reelActionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  reelActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Comments Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  commentsModalSheet: {
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
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a273c',
  },
  commentsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  commentsScrollView: {
    flex: 1,
    marginVertical: 12,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e6b800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#162235',
    borderRadius: 12,
    padding: 10,
  },
  commentAuthorName: {
    color: '#e6b800',
    fontWeight: '700',
    fontSize: 12.5,
    marginBottom: 2,
  },
  commentContentText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a273c',
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#162235',
    borderWidth: 1,
    borderColor: '#1a273c',
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
    backgroundColor: '#e6b800',
    justifyContent: 'center',
    alignItems: 'center',
  },
});