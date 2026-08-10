import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  spacing,
  typography,
  radius,
} from '../../constants/theme';
import LoadingScreen from '../../components/LoadingScreen';

type Author = {
  _id?: string;
  fullName: string;
  profilePicture: string | null;
};

type FeedPost = {
  _id: string;
  content: string;
  mediaUrl: string | null;
  author: Author;
  likes: string[];
  comments: any[];
  createdAt: string;
};

type LikeButtonProps = {
  isLiked: boolean;
  count: number;
  onPress: () => void;
  theme: any;
};

type PostCardProps = {
  item: FeedPost;
  index: number;
  user: any;
  theme: any;
  onLike: (postId: string) => void;
};

const getAuthToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('userToken');
  }

  return SecureStore.getItemAsync(
    'userToken'
  );
};

const normalizeMediaUrl = (
  rawUrl: unknown
): string | null => {
  if (
    typeof rawUrl !== 'string' ||
    !rawUrl.trim()
  ) {
    return null;
  }

  const cleanUrl = rawUrl.trim();

  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('data:') ||
    cleanUrl.startsWith('blob:')
  ) {
    return cleanUrl;
  }

  const cleanPath =
    cleanUrl.startsWith('/')
      ? cleanUrl
      : `/${cleanUrl}`;

  return `${API_BASE_URL}${cleanPath}`;
};

const normalizePost = (
  post: any,
  index: number
): FeedPost => {
  const rawMediaUrl =
    post?.mediaUrl ??
    post?.imageUrl ??
    post?.image ??
    post?.photo ??
    post?.media?.url ??
    post?.attachment?.url ??
    null;

  const authorSource =
    post?.author ??
    post?.user ??
    post?.createdBy ??
    post?.owner ??
    {};

  const rawCreatedAt =
    post?.createdAt ??
    post?.created_at ??
    post?.date ??
    post?.timestamp ??
    new Date().toISOString();

  const parsedDate =
    new Date(rawCreatedAt);

  const safeCreatedAt =
    Number.isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();

  const likes = Array.isArray(post?.likes)
    ? post.likes
      .map((like: any) => {
        if (typeof like === 'string') {
          return like;
        }

        return String(
          like?._id ??
          like?.id ??
          ''
        );
      })
      .filter(Boolean)
    : [];

  return {
    _id: String(
      post?._id ??
      post?.id ??
      post?.postId ??
      `post-${index}`
    ),

    content:
      post?.content ??
      post?.caption ??
      post?.description ??
      post?.text ??
      '',

    mediaUrl:
      normalizeMediaUrl(rawMediaUrl),

    author: {
      _id:
        authorSource?._id ??
        authorSource?.id,

      fullName:
        authorSource?.fullName ??
        authorSource?.name ??
        authorSource?.username ??
        post?.authorName ??
        post?.userName ??
        'Unknown user',

      profilePicture:
        authorSource?.profilePicture ??
        authorSource?.avatar ??
        authorSource?.photoURL ??
        post?.profilePicture ??
        null,
    },

    likes,

    comments:
      Array.isArray(post?.comments)
        ? post.comments
        : [],

    createdAt: safeCreatedAt,
  };
};

function LikeButton({
  isLiked,
  count,
  onPress,
  theme,
}: LikeButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle =
    useAnimatedStyle(() => ({
      transform: [
        {
          scale: scale.value,
        },
      ],
    }));

  const handlePress = () => {
    scale.value = withSpring(
      1.35,
      {
        damping: 5,
        stiffness: 300,
      },
      () => {
        scale.value = withSpring(
          1,
          {
            damping: 7,
            stiffness: 220,
          }
        );
      }
    );

    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.actionBtn}
    >
      <Animated.View
        style={animatedStyle}
      >
        <MaterialIcons
          name={
            isLiked
              ? 'favorite'
              : 'favorite-border'
          }
          size={20}
          color={
            isLiked
              ? theme.error
              : theme.onSurfaceVariant
          }
        />
      </Animated.View>

      <Text
        style={[
          styles.actionText,
          {
            color: isLiked
              ? theme.error
              : theme.onSurfaceVariant,
          },
        ]}
      >
        {count}{' '}
        {count === 1
          ? 'Like'
          : 'Likes'}
      </Text>
    </Pressable>
  );
}

function PostCard({
  item,
  index,
  user,
  theme,
  onLike,
}: PostCardProps) {
  const currentUserId = String(
    user?._id ??
    user?.id ??
    ''
  );

  const isLiked =
    currentUserId.length > 0 &&
    item.likes.includes(
      currentUserId
    );

  const parsedDate =
    new Date(item.createdAt);

  const formattedDate =
    Number.isNaN(
      parsedDate.getTime()
    )
      ? 'Recently'
      : parsedDate.toLocaleString();

  const avatarInitial =
    item.author.fullName
      .trim()
      .charAt(0)
      .toUpperCase() || 'U';

  return (
    <Animated.View
      entering={FadeInDown
        .delay(index * 80)
        .duration(420)
        .springify()}
      style={[
        styles.postCard,
        {
          backgroundColor:
            theme.surfaceContainer,
          borderColor:
            theme.outlineVariant,
        },
      ]}
    >
      <View
        style={styles.postHeader}
      >
        {item.author
          .profilePicture ? (
          <Image
            source={{
              uri: item.author
                .profilePicture,
            }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarFallback,
              {
                backgroundColor:
                  theme.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarInitial,
                {
                  color:
                    theme.onPrimary,
                },
              ]}
            >
              {avatarInitial}
            </Text>
          </View>
        )}

        <View
          style={styles.authorInfo}
        >
          <Text
            style={[
              typography.labelMd,
              {
                color:
                  theme.onSurface,
              },
            ]}
            numberOfLines={1}
          >
            {item.author.fullName}
          </Text>

          <Text
            style={[
              styles.dateText,
              {
                color:
                  theme.onSurfaceVariant,
              },
            ]}
          >
            {formattedDate}
          </Text>
        </View>

        <Pressable
          style={styles.moreButton}
          hitSlop={10}
        >
          <MaterialIcons
            name="more-horiz"
            size={24}
            color={
              theme.onSurfaceVariant
            }
          />
        </Pressable>
      </View>

      {item.content.trim()
        .length > 0 && (
          <Text
            style={[
              typography.bodyMd,
              styles.contentText,
              {
                color:
                  theme.onSurface,
              },
            ]}
          >
            {item.content}
          </Text>
        )}

      {item.mediaUrl && (
        <Animated.Image
          entering={FadeIn
            .delay(
              index * 80 + 150
            )
            .duration(500)}
          source={{
            uri: item.mediaUrl,
          }}
          style={styles.postMedia}
          resizeMode="cover"
          onError={(event) => {
            console.error(
              'Post image failed to load:',
              item.mediaUrl,
              event.nativeEvent
            );
          }}
        />
      )}

      {!item.content.trim() &&
        !item.mediaUrl && (
          <View
            style={[
              styles.emptyPost,
              {
                borderColor:
                  theme.outlineVariant,
              },
            ]}
          >
            <MaterialIcons
              name="broken-image"
              size={28}
              color={
                theme
                  .onSurfaceVariant
              }
            />

            <Text
              style={[
                styles.emptyPostText,
                {
                  color:
                    theme
                      .onSurfaceVariant,
                },
              ]}
            >
              This post has no
              visible content.
            </Text>
          </View>
        )}

      <View
        style={[
          styles.postActions,
          {
            borderTopColor:
              theme.outlineVariant,
          },
        ]}
      >
        <LikeButton
          isLiked={isLiked}
          count={item.likes.length}
          onPress={() =>
            onLike(item._id)
          }
          theme={theme}
        />

        <Pressable
          style={styles.actionBtn}
        >
          <MaterialIcons
            name="chat-bubble-outline"
            size={20}
            color={
              theme.onSurfaceVariant
            }
          />

          <Text
            style={[
              styles.actionText,
              {
                color:
                  theme
                    .onSurfaceVariant,
              },
            ]}
          >
            {item.comments.length}{' '}
            {item.comments.length ===
              1
              ? 'Comment'
              : 'Comments'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
        >
          <MaterialIcons
            name="share"
            size={20}
            color={
              theme.onSurfaceVariant
            }
          />

          <Text
            style={[
              styles.actionText,
              {
                color:
                  theme
                    .onSurfaceVariant,
              },
            ]}
          >
            Share
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function SocialFeedScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [posts, setPosts] =
    useState<FeedPost[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const fetchPosts =
    useCallback(async () => {
      try {
        const token =
          await getAuthToken();

        console.log(
          'FEED REQUEST URL:',
          `${API_BASE_URL}/api/feed`
        );

        const response =
          await axios.get(
            `${API_BASE_URL}/api/feed`,
            {
              headers: token
                ? {
                  Authorization:
                    `Bearer ${token}`,
                }
                : {},
            }
          );

        console.log(
          'FEED API RESPONSE:',
          JSON.stringify(
            response.data,
            null,
            2
          )
        );

        const rawPosts =
          Array.isArray(
            response.data
          )
            ? response.data
            : Array.isArray(
              response.data
                ?.posts
            )
              ? response.data.posts
              : Array.isArray(
                response.data
                  ?.data
              )
                ? response.data.data
                : Array.isArray(
                  response.data
                    ?.feed
                )
                  ? response.data.feed
                  : [];

        const normalizedPosts =
          rawPosts.map(
            (
              post: any,
              index: number
            ) =>
              normalizePost(
                post,
                index
              )
          );

        setPosts(
          normalizedPosts
        );
      } catch (error: any) {
        console.error(
          'FETCH POSTS STATUS:',
          error?.response?.status
        );

        console.error(
          'FETCH POSTS ERROR:',
          error?.response?.data ??
          error?.message ??
          error
        );

        setPosts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handleLike = (
    postId: string
  ) => {
    const userId = String(
      user?.id ??
      user?.id ??
      ''
    );

    if (!userId) {
      console.warn(
        'Cannot like post because user ID is missing.'
      );
      return;
    }

    setPosts(
      (currentPosts) =>
        currentPosts.map(
          (post) => {
            if (
              post._id !== postId
            ) {
              return post;
            }

            const alreadyLiked =
              post.likes.includes(
                userId
              );

            return {
              ...post,
              likes: alreadyLiked
                ? post.likes.filter(
                  (id) =>
                    id !== userId
                )
                : [
                  ...post.likes,
                  userId,
                ],
            };
          }
        )
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Animated.View
      style={styles.screen}
      entering={FadeIn.duration(
        300
      )}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor:
              theme
                .surfaceContainerLowest,
          },
        ]}
      >
        <View
          style={styles.feedWrapper}
        >
          <FlatList
            data={posts}
            keyExtractor={(item) =>
              item._id
            }
            renderItem={({
              item,
              index,
            }) => (
              <PostCard
                item={item}
                index={index}
                user={user}
                theme={theme}
                onLike={handleLike}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={
                  refreshing
                }
                onRefresh={
                  handleRefresh
                }
                tintColor={
                  theme.primary
                }
              />
            }
            contentContainerStyle={[
              styles.listContent,
              posts.length === 0 &&
              styles.emptyListContent,
            ]}
            showsVerticalScrollIndicator={
              false
            }
            ListEmptyComponent={
              <View
                style={
                  styles.emptyFeed
                }
              >
                <MaterialIcons
                  name="dynamic-feed"
                  size={48}
                  color={
                    theme
                      .onSurfaceVariant
                  }
                />

                <Text
                  style={[
                    typography.headlineSm,
                    {
                      color:
                        theme
                          .onSurface,
                      marginTop:
                        spacing.md,
                    },
                  ]}
                >
                  No posts available
                </Text>

                <Text
                  style={[
                    typography.bodySm,
                    styles
                      .emptyFeedDescription,
                    {
                      color:
                        theme
                          .onSurfaceVariant,
                    },
                  ]}
                >
                  Pull down to refresh or
                  create a post from your
                  profile.
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    container: {
      flex: 1,
      alignItems: 'center',
    },

    feedWrapper: {
      width: '100%',
      maxWidth: 680,
      flex: 1,
    },

    listContent: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },

    emptyListContent: {
      flexGrow: 1,
    },

    postCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.md,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },

    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },

    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },

    avatarFallback: {
      justifyContent: 'center',
      alignItems: 'center',
    },

    avatarInitial: {
      fontSize: 17,
      fontWeight: '700',
    },

    authorInfo: {
      marginLeft: spacing.sm,
      flex: 1,
    },

    dateText: {
      fontSize: 11,
      marginTop: 1,
    },

    moreButton: {
      padding: 4,
    },

    contentText: {
      marginBottom: spacing.md,
    },

    postMedia: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      backgroundColor: '#111827',
    },

    emptyPost: {
      minHeight: 100,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderRadius: radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
      padding: spacing.md,
    },

    emptyPostText: {
      fontSize: 13,
      marginTop: spacing.sm,
      textAlign: 'center',
    },

    postActions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      borderTopWidth: 1,
      paddingTop: spacing.md,
      gap: spacing.md,
    },

    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    actionText: {
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 6,
    },

    emptyFeed: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },

    emptyFeedDescription: {
      marginTop: spacing.sm,
      textAlign: 'center',
      maxWidth: 360,
    },
  });