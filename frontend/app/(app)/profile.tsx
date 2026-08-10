import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Image,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL, apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const isWide = width >= 768;

  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postImageAsset, setPostImageAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelCaption, setReelCaption] = useState('');
  const [isPostingReel, setIsPostingReel] = useState(false);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert(title, message);
    }
  };

  const getToken = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('userToken');
    }
    return SecureStore.getItemAsync('userToken');
  };

  const isAuthError = (error: any) => {
    const status = error?.status || error?.response?.status;
    const serverMessage: string =
      error?.data?.message || error?.response?.data?.message || '';

    return (
      status === 401 ||
      status === 403 ||
      (/invalid|expired/i.test(serverMessage) && /token/i.test(serverMessage))
    );
  };

  const handleAuthFailure = async (error: any) => {
    if (!isAuthError(error)) return false;

    showMessage(
      'Session expired',
      'Your session has expired or is no longer valid. Please sign in again.'
    );

    try {
      await signOut();
    } catch {
      // best-effort cleanup
    }

    router.replace('/(auth)/login');
    return true;
  };

  const handleUpdatePicture = () => {
    showMessage(
      'Update Picture',
      'Profile-picture upload is not implemented yet.'
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch {
      showMessage('Error', 'Failed to log out.');
    }
  };

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showMessage(
          'Permission required',
          'Allow access to your media library.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setPostImageAsset(selectedImage);
        setPostImage(selectedImage.uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showMessage('Error', 'Failed to select image.');
    }
  };

  const removePostImage = () => {
    setPostImage(null);
    setPostImageAsset(null);
  };

  const submitPost = async () => {
    const trimmedContent = postContent.trim();

    if (!trimmedContent && !postImageAsset) {
      showMessage('Empty post', 'Add text or select an image.');
      return;
    }

    setIsPosting(true);

    try {
      const token = await getToken();

      if (!token) {
        await handleAuthFailure({
          status: 401,
          data: { message: 'Authentication token is missing.' },
        });
        return;
      }

      const formData = new FormData();
      formData.append('content', trimmedContent);

      if (postImageAsset) {
        if (Platform.OS === 'web') {
          const fileResponse = await fetch(postImageAsset.uri);
          const blob = await fileResponse.blob();
          formData.append(
            'image',
            blob,
            postImageAsset.fileName || `property-${Date.now()}.jpg`
          );
        } else {
          (formData as any).append('image', {
            uri: postImageAsset.uri,
            name: postImageAsset.fileName || `property-${Date.now()}.jpg`,
            type: postImageAsset.mimeType || 'image/jpeg',
          });
        }
      }

      // Perform direct fetch for FormData so the browser automatically handles the multipart boundary
      const rawResponse = await fetch(`${API_BASE_URL}/api/feed`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await rawResponse.json().catch(() => ({}));

      if (!rawResponse.ok) {
        throw {
          status: rawResponse.status,
          data: responseData,
          message: responseData.message || 'Failed to publish post.',
        };
      }

      const createdPost =
        responseData?.post ??
        responseData?.data ??
        (responseData?._id ? responseData : null);

      if (!createdPost?._id) {
        throw new Error('Backend did not return the saved post.');
      }

      setPostContent('');
      removePostImage();

      showMessage(
        'Success',
        responseData?.message || 'Post published successfully.'
      );

      router.replace('/(app)/feed');
    } catch (error: any) {
      console.error('POST CREATION ERROR:', error);

      const handled = await handleAuthFailure(error);
      if (handled) return;

      showMessage(
        'Upload failed',
        error?.data?.message || error?.message || 'Failed to publish post.'
      );
    } finally {
      setIsPosting(false);
    }
  };

  const submitReel = async () => {
    const trimmedVideoUrl = reelVideoUrl.trim();

    if (!trimmedVideoUrl) {
      showMessage('Missing video', 'Enter a video URL.');
      return;
    }

    setIsPostingReel(true);

    try {
      const responseData = await apiFetch('/api/reels', {
        method: 'POST',
        body: JSON.stringify({
          videoUrl: trimmedVideoUrl,
          caption: reelCaption.trim(),
        }),
      });

      console.log('CREATE REEL RESPONSE:', responseData);

      setReelVideoUrl('');
      setReelCaption('');

      showMessage('Success', 'Reel published successfully.');
    } catch (error: any) {
      console.error('REEL CREATION ERROR:', error);

      const handled = await handleAuthFailure(error);
      if (handled) return;

      showMessage(
        'Error',
        error?.data?.message || error?.message || 'Failed to publish reel.'
      );
    } finally {
      setIsPostingReel(false);
    }
  };

  const canPublishPost =
    (postContent.trim().length > 0 || Boolean(postImageAsset)) && !isPosting;

  const initial = (user?.fullName || 'Agent').charAt(0).toUpperCase();

  return (
    <Animated.View style={styles.screen} entering={FadeIn.duration(400)}>
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: theme.surfaceContainerLowest },
        ]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <Text
            style={[
              typography.headlineLg,
              { color: theme.onSurface, marginBottom: spacing.xl },
            ]}
          >
            Your Profile
          </Text>

          <View style={styles.grid}>
            <Animated.View
              entering={FadeInDown.duration(500).delay(100)}
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.outlineVariant,
                },
              ]}
            >
              <Text
                style={[
                  typography.headlineSm,
                  { color: theme.onSurface, marginBottom: spacing.lg },
                ]}
              >
                Profile Picture
              </Text>

              <View style={styles.avatarRow}>
                {user?.profilePicture ? (
                  <Image
                    source={{ uri: user.profilePicture }}
                    style={styles.avatarLarge}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarLarge,
                      styles.avatarFallback,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.onPrimary,
                        fontSize: 40,
                        fontWeight: 'bold',
                      }}
                    >
                      {initial}
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    marginLeft: isWide ? spacing.xl : spacing.md,
                    flexShrink: 1,
                  }}
                >
                  <Pressable
                    onPress={handleUpdatePicture}
                    style={[
                      styles.updateBtn,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <MaterialIcons
                      name="photo-camera"
                      size={20}
                      color={theme.onPrimary}
                    />

                    {isWide && (
                      <Text
                        style={{
                          color: theme.onPrimary,
                          fontWeight: '700',
                          marginLeft: 8,
                        }}
                      >
                        Change Picture
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(500).delay(200)}
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.outlineVariant,
                },
              ]}
            >
              <Text
                style={[
                  typography.headlineSm,
                  { color: theme.onSurface, marginBottom: spacing.lg },
                ]}
              >
                Personal Information
              </Text>

              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <Text
                    style={[styles.infoLabel, { color: theme.outline }]}
                  >
                    Full Name
                  </Text>
                  <Text
                    style={[
                      typography.bodyLg,
                      { color: theme.onSurface },
                    ]}
                  >
                    {user?.fullName || 'N/A'}
                  </Text>
                </View>

                <View style={styles.infoCol}>
                  <Text
                    style={[styles.infoLabel, { color: theme.outline }]}
                  >
                    Email Address
                  </Text>
                  <Text
                    style={[
                      typography.bodyLg,
                      { color: theme.onSurface },
                    ]}
                  >
                    {user?.email || 'N/A'}
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(500).delay(300)}
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.outlineVariant,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <MaterialIcons
                  name="forum"
                  size={24}
                  color={theme.primary}
                />
                <Text
                  style={[
                    typography.headlineSm,
                    { color: theme.onSurface, marginLeft: 8 },
                  ]}
                >
                  Create Social Post
                </Text>
              </View>

              <TextInput
                style={[
                  styles.inputField,
                  styles.postInput,
                  {
                    backgroundColor: theme.surfaceContainerLowest,
                    borderColor: theme.outlineVariant,
                    color: theme.onSurface,
                  },
                ]}
                placeholder="Write your market update or analysis..."
                placeholderTextColor={theme.outline}
                multiline
                value={postContent}
                onChangeText={setPostContent}
              />

              {postImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: postImage }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />

                  <Pressable
                    style={styles.removeImageBtn}
                    onPress={removePostImage}
                  >
                    <MaterialIcons name="close" size={16} color="#ffffff" />
                  </Pressable>
                </View>
              )}

              <View style={styles.actionRow}>
                <Pressable
                  onPress={pickImage}
                  disabled={isPosting}
                  style={[
                    styles.secondaryBtn,
                    { backgroundColor: theme.surfaceContainerHigh },
                  ]}
                >
                  <MaterialIcons
                    name="image"
                    size={20}
                    color={theme.onSurfaceVariant}
                  />
                  <Text
                    style={{
                      color: theme.onSurfaceVariant,
                      fontWeight: '600',
                      marginLeft: 6,
                    }}
                  >
                    Attach Image
                  </Text>
                </Pressable>

                <Pressable
                  onPress={submitPost}
                  disabled={!canPublishPost}
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: theme.primary,
                      opacity: canPublishPost ? 1 : 0.6,
                    },
                  ]}
                >
                  {isPosting ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.onPrimary}
                    />
                  ) : (
                    <Text
                      style={{
                        color: theme.onPrimary,
                        fontWeight: '700',
                      }}
                    >
                      Publish Post
                    </Text>
                  )}
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(500).delay(400)}
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.outlineVariant,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <MaterialIcons
                  name="dynamic-feed"
                  size={24}
                  color={theme.primary}
                />
                <Text
                  style={[
                    typography.headlineSm,
                    { color: theme.onSurface, marginLeft: 8 },
                  ]}
                >
                  Publish Reel Video
                </Text>
              </View>

              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: theme.surfaceContainerLowest,
                    borderColor: theme.outlineVariant,
                    color: theme.onSurface,
                    marginBottom: spacing.md,
                  },
                ]}
                placeholder="Video URL"
                placeholderTextColor={theme.outline}
                value={reelVideoUrl}
                onChangeText={setReelVideoUrl}
              />

              <TextInput
                style={[
                  styles.inputField,
                  styles.reelCaption,
                  {
                    backgroundColor: theme.surfaceContainerLowest,
                    borderColor: theme.outlineVariant,
                    color: theme.onSurface,
                  },
                ]}
                placeholder="Add a caption..."
                placeholderTextColor={theme.outline}
                multiline
                value={reelCaption}
                onChangeText={setReelCaption}
              />

              <View
                style={[styles.actionRow, { justifyContent: 'flex-end' }]}
              >
                <Pressable
                  onPress={submitReel}
                  disabled={!reelVideoUrl.trim() || isPostingReel}
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: theme.primary,
                      opacity:
                        !reelVideoUrl.trim() || isPostingReel ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.onPrimary,
                      fontWeight: '700',
                    }}
                  >
                    {isPostingReel ? 'Publishing...' : 'Publish Reel'}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(500).delay(500)}>
              <Pressable onPress={handleLogout} style={styles.logoutBtn}>
                <MaterialIcons name="logout" size={24} color="#ba1a1a" />
                <Text style={styles.logoutText}>Log Out</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  contentContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    paddingBottom: 100,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 800,
  },
  grid: { gap: spacing.xl },
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(218,165,32,0.2)',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignSelf: 'flex-start',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  infoCol: {
    flex: 1,
    minWidth: 200,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  postInput: { minHeight: 90 },
  reelCaption: { minHeight: 70 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.lg,
  },
  primaryBtn: {
    minWidth: 130,
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 220,
    height: 150,
    borderRadius: radius.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ba1a1a',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.2)',
    backgroundColor: 'rgba(186,26,26,0.1)',
  },
  logoutText: {
    marginLeft: 8,
    color: '#ba1a1a',
    fontWeight: '700',
    fontSize: 16,
  },
});