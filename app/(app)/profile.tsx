import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, Image, useWindowDimensions, TextInput } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen() {
  const { user, token, signOut, signIn } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  // Post State
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Reel State
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelCaption, setReelCaption] = useState('');
  const [isPostingReel, setIsPostingReel] = useState(false);

  // Profile Edit State
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) return;
    setIsUpdating(true);
    try {
      const storedToken = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
      const res = await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/profile`, {
        username: newUsername.trim()
      }, { headers: { Authorization: `Bearer ${storedToken}` } });

      // Update local state
      if (token && res.data.user) {
        await signIn(token, res.data.user);
      }
      setIsEditingUsername(false);

      if (Platform.OS === 'web') window.alert('Profile updated successfully!');
      else Alert.alert('Success', 'Profile updated successfully!');
    } catch (e: any) {
      console.error(e);
      const errMsg = e.response?.data?.message || 'Failed to update profile.';
      if (Platform.OS === 'web') window.alert(errMsg);
      else Alert.alert('Error', errMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePicture = () => {
    if (Platform.OS === 'web') {
      window.alert('Picture upload will open the native file picker in a future update.');
    } else {
      Alert.alert('Update Picture', 'Picture upload will open the native file picker in a future update.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert('Failed to log out.');
      } else {
        Alert.alert('Error', 'Failed to log out.');
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPostImage(base64Image);
    } else if (!result.canceled) {
      setPostImage(result.assets[0].uri);
    }
  };

  const submitPost = async () => {
    if (!postContent.trim()) return;
    setIsPosting(true);
    try {
      const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/feed`, {
        content: postContent,
        mediaUrl: postImage
      }, { headers: { Authorization: `Bearer ${token}` } });

      setPostContent('');
      setPostImage(null);
      if (Platform.OS === 'web') window.alert('Post published successfully!');
      else Alert.alert('Success', 'Post published successfully!');
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') window.alert('Failed to publish post.');
      else Alert.alert('Error', 'Failed to publish post.');
    } finally {
      setIsPosting(false);
    }
  };

  const submitReel = async () => {
    if (!reelVideoUrl.trim()) return;
    setIsPostingReel(true);
    try {
      const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/reels`, {
        videoUrl: reelVideoUrl,
        caption: reelCaption
      }, { headers: { Authorization: `Bearer ${token}` } });

      setReelVideoUrl('');
      setReelCaption('');
      if (Platform.OS === 'web') window.alert('Reel published successfully!');
      else Alert.alert('Success', 'Reel published successfully!');
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') window.alert('Failed to publish reel.');
      else Alert.alert('Error', 'Failed to publish reel.');
    } finally {
      setIsPostingReel(false);
    }
  };

  const initial = (user?.fullName || 'Agent').charAt(0).toUpperCase();

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(400)}>
      <ScrollView style={[styles.container, { backgroundColor: theme.surfaceContainerLowest }]} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          <Text style={[typography.headlineLg, { color: theme.onSurface, marginBottom: spacing.xl }]}>Your Profile</Text>

          <View style={styles.grid}>
            {/* Profile Info */}
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.outlineVariant }]}>
              <Text style={[typography.headlineSm, { color: theme.onSurface, marginBottom: spacing.lg }]}>Profile Picture</Text>
              <View style={styles.avatarRow}>
                {user?.profilePicture ? (
                  <Image source={{ uri: user.profilePicture }} style={styles.avatarLarge} />
                ) : (
                  <View style={[styles.avatarLarge, { backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: theme.onPrimary, fontSize: 40, fontWeight: 'bold' }}>{initial}</Text>
                  </View>
                )}
                <View style={{ marginLeft: isWide ? spacing.xl : spacing.md, flexShrink: 1 }}>
                  <Pressable onPress={handleUpdatePicture} style={({ pressed, hovered }: any) => [styles.updateBtn, { backgroundColor: theme.primary }, !isWide && { paddingHorizontal: 12, paddingVertical: 12 }, (pressed || hovered) && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
                    <MaterialIcons name="photo-camera" size={20} color={theme.onPrimary} style={isWide ? { marginRight: 8 } : {}} />
                    {isWide && <Text style={{ color: theme.onPrimary, fontWeight: '700' }}>Change Picture</Text>}
                  </Pressable>
                  {isWide && <Text style={{ color: theme.outline, fontSize: 12, marginTop: spacing.sm }}>JPG, GIF or PNG. Max size of 5MB.</Text>}
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(500).delay(200)} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.outlineVariant }]}>
              <Text style={[typography.headlineSm, { color: theme.onSurface, marginBottom: spacing.lg }]}>Personal Information</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <Text style={{ color: theme.outline, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>Full Name</Text>
                  <Text style={[typography.bodyLg, { color: theme.onSurface }]}>{user?.fullName || 'N/A'}</Text>
                </View>
                <View style={styles.infoCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: theme.outline, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>Username</Text>
                    {!isEditingUsername ? (
                      <Pressable onPress={() => { setIsEditingUsername(true); setNewUsername(user?.username || ''); }}>
                        <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>Edit</Text>
                      </Pressable>
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Pressable onPress={() => setIsEditingUsername(false)}>
                          <Text style={{ color: theme.outline, fontSize: 12, fontWeight: '700' }}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={handleUpdateUsername}>
                          <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>{isUpdating ? 'Saving...' : 'Save'}</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                  {!isEditingUsername ? (
                    <Text style={[typography.bodyLg, { color: theme.onSurface }]}>@{user?.username || 'N/A'}</Text>
                  ) : (
                    <TextInput
                      style={[styles.inputField, { padding: 8, fontSize: 14, minHeight: 40, color: theme.onSurface, borderColor: theme.outlineVariant, backgroundColor: theme.surfaceContainerLowest }]}
                      value={newUsername}
                      onChangeText={setNewUsername}
                      autoCapitalize="none"
                    />
                  )}
                </View>
              </View>
            </Animated.View>

            {/* Creator Hub: Post to Feed */}
            <Animated.View entering={FadeInDown.duration(500).delay(300)} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.outlineVariant }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <MaterialIcons name="forum" size={24} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={[typography.headlineSm, { color: theme.onSurface }]}>Create Social Post</Text>
              </View>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.surfaceContainerLowest, borderColor: theme.outlineVariant, color: theme.onSurface, minHeight: 80 }]}
                placeholder="Write your market update or analysis..."
                placeholderTextColor={theme.outline}
                multiline
                value={postContent}
                onChangeText={setPostContent}
              />

              {postImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: postImage }} style={styles.imagePreview} />
                  <Pressable style={styles.removeImageBtn} onPress={() => setPostImage(null)}>
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              )}

              <View style={styles.actionRow}>
                <Pressable onPress={pickImage} style={({ pressed, hovered }: any) => [styles.secondaryBtn, { backgroundColor: theme.surfaceContainerHigh }, (pressed || hovered) && { opacity: 0.8 }]}>
                  <MaterialIcons name="image" size={20} color={theme.onSurfaceVariant} style={{ marginRight: 6 }} />
                  <Text style={{ color: theme.onSurfaceVariant, fontWeight: '600' }}>Attach Image</Text>
                </Pressable>
                <Pressable onPress={submitPost} disabled={!postContent.trim() || isPosting} style={({ pressed, hovered }: any) => [styles.primaryBtn, { backgroundColor: theme.primary }, (pressed || hovered || !postContent.trim()) && { opacity: 0.7 }]}>
                  <Text style={{ color: theme.onPrimary, fontWeight: '700' }}>{isPosting ? 'Publishing...' : 'Publish Post'}</Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Creator Hub: Post Reel */}
            <Animated.View entering={FadeInDown.duration(500).delay(400)} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.outlineVariant }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <MaterialIcons name="dynamic-feed" size={24} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={[typography.headlineSm, { color: theme.onSurface }]}>Publish Reel Video</Text>
              </View>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.surfaceContainerLowest, borderColor: theme.outlineVariant, color: theme.onSurface, marginBottom: spacing.md }]}
                placeholder="Video URL (e.g. https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4)"
                placeholderTextColor={theme.outline}
                value={reelVideoUrl}
                onChangeText={setReelVideoUrl}
              />
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.surfaceContainerLowest, borderColor: theme.outlineVariant, color: theme.onSurface, minHeight: 60 }]}
                placeholder="Add a captivating caption..."
                placeholderTextColor={theme.outline}
                multiline
                value={reelCaption}
                onChangeText={setReelCaption}
              />
              <View style={[styles.actionRow, { justifyContent: 'flex-end', marginTop: spacing.md }]}>
                <Pressable onPress={submitReel} disabled={!reelVideoUrl.trim() || isPostingReel} style={({ pressed, hovered }: any) => [styles.primaryBtn, { backgroundColor: theme.primary }, (pressed || hovered || !reelVideoUrl.trim()) && { opacity: 0.7 }]}>
                  <Text style={{ color: theme.onPrimary, fontWeight: '700' }}>{isPostingReel ? 'Publishing...' : 'Publish Reel'}</Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Logout */}
            <Animated.View entering={FadeInDown.duration(500).delay(500)}>
              <Pressable onPress={handleLogout} style={({ pressed, hovered }: any) => [styles.logoutBtn, { backgroundColor: 'rgba(186, 26, 26, 0.1)', borderColor: 'rgba(186, 26, 26, 0.2)' }, (pressed || hovered) && { backgroundColor: 'rgba(186, 26, 26, 0.2)' }]}>
                <MaterialIcons name="logout" size={24} color="#ba1a1a" />
                <Text style={{ marginLeft: 8, color: '#ba1a1a', fontWeight: '700', fontSize: 16 }}>Log Out</Text>
              </Pressable>
            </Animated.View>

          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: spacing.xl, alignItems: 'center', paddingBottom: 100 },
  contentWrapper: { width: '100%', maxWidth: 800 },
  grid: { gap: spacing.xl },
  card: { borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarLarge: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: 'rgba(218, 165, 32, 0.2)' },
  updateBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.lg, alignSelf: 'flex-start', ...Platform.select({ web: { transition: 'all 0.2s ease' } as any }) },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl, marginBottom: spacing.lg },
  infoCol: { flex: 1, minWidth: 200 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, marginTop: spacing.sm, ...Platform.select({ web: { transition: 'background-color 0.2s ease' } as any }) },
  inputField: { borderWidth: 1, borderRadius: radius.lg, padding: 16, fontSize: 15, textAlignVertical: 'top' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.lg, ...Platform.select({ web: { transition: 'opacity 0.2s ease' } as any }) },
  primaryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.lg, ...Platform.select({ web: { transition: 'opacity 0.2s ease' } as any }) },
  imagePreviewContainer: { position: 'relative', marginTop: spacing.md, alignSelf: 'flex-start' },
  imagePreview: { width: 150, height: 150, borderRadius: radius.md },
  removeImageBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#ba1a1a', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});