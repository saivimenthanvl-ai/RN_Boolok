import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, Platform, useWindowDimensions, ScrollView, TextInput } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import LoadingScreen from '../../components/LoadingScreen';
import { LinearGradient } from 'expo-linear-gradient';

// ── Stories Row ─────────────────────────────────────────────────────────────
const DUMMY_STORIES = [
  { id: '1', username: 'prasanth_...', image: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', username: 'aswin.pras...', image: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', username: 'ig_vicky16', image: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', username: 'the_akshtr...', image: 'https://i.pravatar.cc/150?u=4' },
  { id: '5', username: 'alfie_prasa...', image: 'https://i.pravatar.cc/150?u=5' },
  { id: '6', username: 'thiruninja', image: 'https://i.pravatar.cc/150?u=6' },
  { id: '7', username: 'jishhthetics', image: 'https://i.pravatar.cc/150?u=7' },
];

function StoriesRow({ theme, isDark }: any) {
  return (
    <View style={styles.storiesContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
        {DUMMY_STORIES.map((story) => (
          <Pressable key={story.id} style={styles.storyItem}>
            <LinearGradient
              colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
              style={styles.storyGradient}
            >
              <View style={[styles.storyImageContainer, { backgroundColor: isDark ? '#000' : '#fff' }]}>
                <Image source={{ uri: story.image }} style={styles.storyImage} />
              </View>
            </LinearGradient>
            <Text style={[styles.storyUsername, { color: theme.onSurface }]} numberOfLines={1}>
              {story.username}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Animated like button ──────────────────────────────────────────────────────
function LikeButton({ isLiked, onPress, theme }: any) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.4, { damping: 4, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 6, stiffness: 200 });
    });
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.iconBtn}>
      <Animated.View style={animatedStyle}>
        <MaterialCommunityIcons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={28}
          color={isLiked ? '#ff3040' : theme.onSurface}
        />
      </Animated.View>
    </Pressable>
  );
}

// ── Post card (Instagram Style) ───────────────────────────────────────────────
function PostCard({ item, user, theme, onLike, onComment, isDark }: any) {
  const isLiked = item.likes.includes(user?.id);
  const likeCount = item.likes.length;
  const [commentText, setCommentText] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setIsPosting(true);
    await onComment(item._id, commentText);
    setCommentText('');
    setIsPosting(false);
  };

  return (
    <View style={[styles.postCard, { borderBottomColor: theme.outlineVariant }]}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient
            colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
            style={styles.headerAvatarGradient}
          >
            <View style={[styles.headerAvatarContainer, { backgroundColor: isDark ? '#000' : '#fff' }]}>
              <Image
                source={{ uri: item.author.profilePicture || 'https://via.placeholder.com/40' }}
                style={styles.headerAvatar}
              />
            </View>
          </LinearGradient>
          <Text style={[styles.headerUsername, { color: theme.onSurface }]}>
            {item.author.fullName.replace(' ', '').toLowerCase()}
          </Text>
          {item.verified && (
            <MaterialIcons name="verified" size={14} color="#0095f6" style={{ marginLeft: 4 }} />
          )}
          <Text style={[styles.headerTime, { color: theme.onSurfaceVariant }]}> • 15m</Text>
        </View>
        <Pressable>
          <MaterialCommunityIcons name="dots-horizontal" size={20} color={theme.onSurface} />
        </Pressable>
      </View>

      {/* Media */}
      {item.mediaUrl && (
        <Image
          source={{ uri: item.mediaUrl }}
          style={styles.postMedia}
          resizeMode="cover"
        />
      )}

      {/* Actions */}
      <View style={styles.postActionsRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LikeButton isLiked={isLiked} onPress={() => onLike(item._id)} theme={theme} />
          <Pressable style={styles.iconBtn}>
            <MaterialCommunityIcons name="chat-outline" size={26} color={theme.onSurface} style={{ transform: [{ scaleX: -1 }] }} />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <MaterialCommunityIcons name="send-outline" size={26} color={theme.onSurface} style={{ transform: [{ rotate: '-30deg' }, { translateY: -2 }] }} />
          </Pressable>
        </View>
        <Pressable style={styles.iconBtnRight}>
          <MaterialCommunityIcons name="bookmark-outline" size={28} color={theme.onSurface} />
        </Pressable>
      </View>

      {/* Likes */}
      <Text style={[styles.likesText, { color: theme.onSurface }]}>
        {likeCount > 0 ? (
          <>
            Liked by <Text style={{ fontWeight: '700' }}>{likeCount === 1 ? 'someone' : `${likeCount} others`}</Text>
          </>
        ) : (
          'Be the first to like this'
        )}
      </Text>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={[styles.captionText, { color: theme.onSurface }]}>
          <Text style={{ fontWeight: '700' }}>{item.author.fullName.replace(' ', '').toLowerCase()} </Text>
          {item.content}
        </Text>
      </View>

      {/* Comments */}
      {item.comments?.length > 0 && (
        <Pressable style={{ marginTop: 6, paddingHorizontal: 16 }}>
          <Text style={{ color: theme.onSurfaceVariant, fontSize: 14 }}>
            View all {item.comments.length} comments
          </Text>
        </Pressable>
      )}

      {/* Add comment input placeholder */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 8, marginBottom: 16 }}>
        <TextInput
          placeholder="Add a comment..."
          placeholderTextColor={theme.onSurfaceVariant}
          style={{ color: theme.onSurface, fontSize: 14, flex: 1, paddingVertical: 4, outlineStyle: 'none' } as any}
          value={commentText}
          onChangeText={setCommentText}
          onSubmitEditing={handlePostComment}
        />
        {commentText.trim().length > 0 ? (
          <Pressable onPress={handlePostComment} disabled={isPosting}>
            <Text style={{ color: '#0095f6', fontWeight: '600', marginLeft: 8 }}>
              {isPosting ? '...' : 'Post'}
            </Text>
          </Pressable>
        ) : (
          <MaterialCommunityIcons name="emoticon-happy-outline" size={16} color={theme.onSurfaceVariant} style={{ marginLeft: 8 }} />
        )}
      </View>
    </View>
  );
}

// ── Right Sidebar (Suggested for you) ─────────────────────────────────────────
function RightSidebar({ user, theme }: any) {
  const SUGGESTED = [
    { id: '1', username: 'Amish', subtitle: 'Followed by madhuverseoffi...', image: 'https://i.pravatar.cc/150?u=11' },
    { id: '2', username: 'cinemahub.live', subtitle: 'Suggested for you', image: 'https://i.pravatar.cc/150?u=12' },
    { id: '3', username: 'Bavadharini RS', subtitle: 'Followed by thiru.yashhh', image: 'https://i.pravatar.cc/150?u=13' },
    { id: '4', username: 'shreekutti', subtitle: 'Followed by lyra_orphe...', image: 'https://i.pravatar.cc/150?u=14' },
  ];

  return (
    <View style={styles.rightSidebar}>
      {/* Current User */}
      <View style={styles.rightSidebarUser}>
        <Image
          source={{ uri: user?.profilePicture || 'https://via.placeholder.com/44' }}
          style={styles.rightSidebarAvatar}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.rightSidebarUsername, { color: theme.onSurface }]}>
            {user?.fullName?.replace(' ', '').toLowerCase() || 'logeshwaranashok'}
          </Text>
          <Text style={[styles.rightSidebarSubtitle, { color: theme.onSurfaceVariant }]}>
            {user?.fullName || 'Logeshwaran Ashok'}
          </Text>
        </View>
        <Pressable>
          <Text style={styles.switchBtn}>Switch</Text>
        </Pressable>
      </View>

      {/* Suggested Header */}
      <View style={styles.suggestedHeader}>
        <Text style={{ color: theme.onSurfaceVariant, fontWeight: '600', fontSize: 14 }}>Suggested for you</Text>
        <Pressable>
          <Text style={{ color: theme.onSurface, fontSize: 12, fontWeight: '700' }}>See all</Text>
        </Pressable>
      </View>

      {/* Suggested List */}
      {SUGGESTED.map((s) => (
        <View key={s.id} style={styles.suggestedItem}>
          <Image source={{ uri: s.image }} style={styles.suggestedAvatar} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.suggestedUsername, { color: theme.onSurface }]}>{s.username}</Text>
            <Text style={[styles.suggestedSubtitle, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
              {s.subtitle}
            </Text>
          </View>
          <Pressable>
            <Text style={styles.followBtn}>Follow</Text>
          </Pressable>
        </View>
      ))}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={{ color: '#737373', fontSize: 12, lineHeight: 16 }}>
          About · Help · Press · API · Jobs · Privacy · Terms ·{'\n'}
          Locations · Language · Meta Verified
        </Text>
        <Text style={{ color: '#737373', fontSize: 12, marginTop: 16 }}>
          © 2026 INSTAGRAM FROM META
        </Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SocialFeedScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 1000;
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.length > 0) {
        setPosts(response.data);
      } else {
        setPosts([
          {
            _id: '2',
            author: { fullName: 'Jishhthetics', profilePicture: 'https://i.pravatar.cc/150?u=jish' },
            content: 'Went to the NEET Protest in Chennai ( Balan Illam )',
            mediaUrl: 'https://images.unsplash.com/photo-1542361345-89e58247f2d5?w=800',
            likes: Array(1719).fill('u'),
            comments: Array(19).fill({}),
            createdAt: new Date(Date.now() - 900000).toISOString(),
            verified: true,
          },
          {
            _id: '1',
            author: { fullName: 'Sarah Jenkins', profilePicture: 'https://i.pravatar.cc/150?u=sarah' },
            content: 'Just closed a massive deal in downtown Manhattan! The commercial real estate market is definitely bouncing back this quarter. 🏙️📈',
            likes: ['user1', 'user2'],
            comments: [{ text: 'Congrats!' }],
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    // Optimistic UI update
    setPosts(posts.map((p) => {
      if (p._id === postId) {
        const isLiked = p.likes.includes(user?.id);
        const newLikes = isLiked
          ? p.likes.filter((id: string) => id !== user?.id)
          : [...p.likes, user?.id];
        return { ...p, likes: newLikes };
      }
      return p;
    }));

    // Backend call
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/feed/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Failed to like post:', error);
      // We could revert the state here if the API call fails
    }
  };

  const handleComment = async (postId: string, text: string) => {
    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/feed/${postId}/comment`, { text }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Response returns updated comments array
      const updatedComments = response.data;

      setPosts(posts.map((p) => {
        if (p._id === postId) {
          return { ...p, comments: updatedComments };
        }
        return p;
      }));
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  if (loading) return <LoadingScreen />;

  // Force dark mode background for Instagram replica if not already dark
  const bgColor = isDark ? theme.surfaceContainerLowest : '#000';
  const customTheme = isDark ? theme : {
    ...theme,
    onSurface: '#f5f5f5',
    onSurfaceVariant: '#a8a8a8',
    outlineVariant: '#262626',
  };

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mainContainer}>
          {/* Center Feed Column */}
          <View style={styles.feedColumn}>
            <StoriesRow theme={customTheme} isDark={true} />
            <View style={styles.postsWrapper}>
              {posts.map((item) => (
                <PostCard
                  key={item._id}
                  item={item}
                  user={user}
                  theme={customTheme}
                  onLike={handleLike}
                  onComment={handleComment}
                  isDark={true}
                />
              ))}
            </View>
          </View>

          {/* Right Sidebar */}
          {isWide && (
            <View style={styles.rightSidebarColumn}>
              <RightSidebar user={user} theme={customTheme} />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  mainContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 820,
    justifyContent: 'center',
  },
  feedColumn: {
    width: '100%',
    maxWidth: 470,
  },
  rightSidebarColumn: {
    width: 320,
    marginLeft: 64,
    paddingTop: 16,
  },

  // Stories
  storiesContainer: {
    marginBottom: 24,
  },
  storiesScroll: {
    paddingHorizontal: 0,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 66,
  },
  storyGradient: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  storyImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  storyUsername: {
    fontSize: 11,
    textAlign: 'center',
  },

  // Post Card
  postsWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  postCard: {
    width: '100%',
    maxWidth: 470,
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 20,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  headerAvatarGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  headerUsername: {
    fontWeight: '600',
    fontSize: 14,
  },
  headerTime: {
    fontSize: 14,
  },
  postMedia: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  iconBtn: {
    marginRight: 16,
    paddingVertical: 8,
  },
  iconBtnRight: {
    paddingVertical: 8,
  },
  likesText: {
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  captionContainer: {
    paddingHorizontal: 16,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 18,
  },

  // Right Sidebar
  rightSidebar: {
    width: 320,
  },
  rightSidebarUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  rightSidebarAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  rightSidebarUsername: {
    fontSize: 14,
    fontWeight: '700',
  },
  rightSidebarSubtitle: {
    fontSize: 14,
  },
  switchBtn: {
    color: '#0095f6',
    fontWeight: '700',
    fontSize: 12,
  },
  suggestedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  suggestedUsername: {
    fontSize: 14,
    fontWeight: '700',
  },
  suggestedSubtitle: {
    fontSize: 12,
  },
  followBtn: {
    color: '#0095f6',
    fontWeight: '700',
    fontSize: 12,
  },
  footer: {
    marginTop: 32,
  }
});