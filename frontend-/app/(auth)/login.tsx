// app/(auth)/login.tsx

import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useGoogleAuth, API_BASE_URL } from '../../lib/api';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useAuth } from '../../context/AuthContext';
import BoolokLogo from '../../components/BoolokLogo';
import GoogleIcon from '../../components/GoogleIcon';
import { FEATURES, FeatureIconBox } from '../../components/FeatureIcon';
import { colors, spacing, radius, typography } from '../../constants/theme';

const MD_BREAKPOINT = 768;

type SubmitState = 'idle' | 'loading' | 'success';

// Shorter taglines for the login brand panel (kept distinct from register's copy)
const LOGIN_TAGLINES: Record<string, string> = {
  'Smart Search': 'Find properties with natural language.',
  'AI Advisor': 'Get expert real estate guidance.',
  'Market Insights': 'Real-time data and trends.',
  'Global Reach': 'Connect with international markets.',
};

function friendlyErrorMessage(error: any, fallback: string): string {
  if (error?.message === 'Network Error') {
    return `Couldn't reach the server at ${API_BASE_URL}. Check your internet connection or try again shortly.`;
  }
  return error?.response?.data?.message || error?.message || fallback;
}

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= MD_BREAKPOINT;

  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [focused, setFocused] = useState(false);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const completeSignIn = async (serverToken: string, serverUser: any) => {
    if (!serverToken || !serverUser) {
      throw new Error('The backend response is missing token or user data.');
    }
    await signIn(serverToken, serverUser);
    setSubmitState('success');
    setTimeout(() => {
      router.replace('/(app)/feed');
    }, 500);
  };

  // ── Google Sign-In ──────────────────────────────────────────────────────
  const handleGoogleSuccess = useCallback(
    async (idToken: string) => {
      try {
        console.log('Sending Google ID token to backend at:', `${API_BASE_URL}/api/auth/google`);
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/google`,
          { idToken },
          { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
        );
        const { token: serverToken, user: serverUser } = response.data ?? {};
        await completeSignIn(serverToken, serverUser);
      } catch (error: any) {
        console.error('GOOGLE LOGIN ERROR:', error?.response?.data ?? error?.message ?? error);
        showMessage('Google Sign-In Failed', friendlyErrorMessage(error, 'Google sign-in failed. Check backend connectivity.'));
      }
    },
    [signIn]
  );

  const { promptGoogleSignIn, isGoogleLoading } = useGoogleAuth({
    onSuccess: handleGoogleSuccess,
    onError: (msg) => showMessage('Google Sign-In Error', msg),
  });

  const canSubmit = email.trim().length > 0 && password.length > 0 && submitState === 'idle';

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitState('loading');

    try {
      console.log('LOGIN REQUEST URL:', `${API_BASE_URL}/api/auth/login`);

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email: email.trim().toLowerCase(), password },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );

      const { token: serverToken, user: serverUser } = response.data ?? {};

      console.log('LOGIN TOKEN EXISTS:', Boolean(serverToken));

      if (serverToken && !serverToken.startsWith('eyJ')) {
        console.warn('The received token does not look like a standard JWT.');
      }

      await completeSignIn(serverToken, serverUser);
    } catch (error: any) {
      console.error('LOGIN ERROR STATUS:', error?.response?.status);
      console.error('LOGIN ERROR:', error?.response?.data ?? error?.message ?? error);

      setSubmitState('idle');
      showMessage('Login failed', friendlyErrorMessage(error, 'Login failed.'));
    }
  };

  const buttonLabel = submitState === 'loading' ? 'Authenticating...' : submitState === 'success' ? 'Access Granted' : 'Sign In';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F4F6' }}>
      <ScrollView style={styles.rootScroll} contentContainerStyle={styles.rootScrollContent} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.mainLayout, isWide && styles.mainLayoutRow]}>
            {isWide && (
              <Animated.View style={styles.brandPanel} entering={FadeIn.duration(800)}>
                <View style={styles.brandInner}>
                  <Pressable style={styles.brandLogoRow} onPress={() => router.push('/(auth)/brand-vision')}>
                    <BoolokLogo size={56} color="#ffffff" />
                    <Text style={[typography.headlineMd, styles.brandName]}>
                      BOOLOK <Text style={{ color: colors.primary }}>GPT</Text>
                    </Text>
                  </Pressable>

                  <Text style={[typography.headlineSm, styles.brandTagline]}>AI AGENT FOR REAL ESTATE SERVICES</Text>

                  <View style={styles.featuresList}>
                    {FEATURES.map((feature) => (
                      <View key={feature.title} style={styles.featureRow}>
                        <FeatureIconBox name={feature.icon} boxSize={44} iconSize={22} />
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.labelMd, styles.featureTitle]}>{feature.title}</Text>
                          <Text style={[typography.bodySm, styles.brandSubtext]}>
                            {LOGIN_TAGLINES[feature.title] ?? feature.description}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}

            <Animated.View
              style={[styles.formPanel, isWide && styles.formPanelWide]}
              entering={FadeInDown.duration(600).delay(100).springify()}
            >
              <View style={[styles.formContent, isWide && styles.formContentWide]}>
                {!isWide && (
                  <Pressable style={styles.mobileLogoBlock} onPress={() => router.push('/(auth)/brand-vision')}>
                    <BoolokLogo size={56} />
                  </Pressable>
                )}

                <View style={[styles.formCard, focused && styles.formCardFocused]}>
                  <View style={styles.formHeader}>
                    <Text style={[typography.headlineMd, { color: colors.onSurface, marginBottom: spacing.xs }]}>Welcome Back</Text>
                    <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>Sign in to your Boolok GPT account</Text>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={[typography.labelMd, styles.fieldLabel]}>Email Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="name@example.com"
                      placeholderTextColor={colors.outline}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={submitState === 'idle'}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      onSubmitEditing={handleSubmit}
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <View style={styles.passwordLabelRow}>
                      <Text style={[typography.labelMd, { color: colors.onSurface }]}>Password</Text>
                      <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                        <Text style={[typography.labelMd, styles.link]}>Forgot Password?</Text>
                      </Pressable>
                    </View>

                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, paddingRight: 48 }]}
                        placeholder="••••••••"
                        placeholderTextColor={colors.outline}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={submitState === 'idle'}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onSubmitEditing={handleSubmit}
                      />
                      <Pressable style={styles.eyeButton} onPress={() => setShowPassword((previous) => !previous)}>
                        <MaterialIcons
                          name={showPassword ? 'visibility-off' : 'visibility'}
                          size={22}
                          color={colors.onSurfaceVariant}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    style={[
                      styles.submitButton,
                      submitState === 'success' && { backgroundColor: colors.success },
                      !canSubmit && submitState === 'idle' && { opacity: 0.5 },
                    ]}
                    onPress={handleSubmit}
                    disabled={submitState !== 'idle'}
                  >
                    {submitState === 'loading' ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={[typography.labelMd, styles.submitText]}>{buttonLabel}</Text>
                      </View>
                    ) : (
                      <Text style={[typography.labelMd, styles.submitText]}>{buttonLabel}</Text>
                    )}
                  </Pressable>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={[typography.bodySm, styles.dividerText]}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Pressable
                    style={[styles.googleButton, isGoogleLoading && { opacity: 0.6 }]}
                    onPress={promptGoogleSignIn}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <ActivityIndicator size="small" color={colors.onSurface} />
                    ) : (
                      <>
                        <GoogleIcon size={20} />
                        <Text style={[typography.labelMd, styles.googleButtonText]}>Sign in with Google</Text>
                      </>
                    )}
                  </Pressable>

                  <View style={styles.footer}>
                    <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>Don&apos;t have an account? </Text>
                    <Link href="/(auth)/register" style={[typography.labelMd, styles.link]}>
                      Get Started
                    </Link>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootScroll: { flex: 1, backgroundColor: '#F4F4F6' },
  rootScrollContent: { flexGrow: 1 },
  keyboardAvoid: { flex: 1 },
  mainLayout: { flex: 1 },
  mainLayoutRow: { flexDirection: 'row' },

  brandPanel: {
    width: '50%',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  brandInner: { maxWidth: 420, width: '100%', alignItems: 'center' },
  brandLogoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  brandName: { color: '#ffffff', marginLeft: spacing.base, fontFamily: 'Poppins_700Bold' },
  brandTagline: { color: '#ffffff', textAlign: 'center', letterSpacing: 2, marginBottom: spacing.xl },
  featuresList: { width: '100%', gap: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  featureTitle: { color: '#ffffff', marginBottom: 2 },
  brandSubtext: { color: colors.outlineVariant },

  formPanel: { flex: 1, backgroundColor: '#F4F4F6', justifyContent: 'center', paddingVertical: spacing.xl },
  formPanelWide: { paddingHorizontal: spacing.xl },
  formContent: { width: '100%', paddingHorizontal: spacing.gutter },
  formContentWide: { maxWidth: 420, alignSelf: 'center', paddingHorizontal: 0 },
  mobileLogoBlock: { width: '100%', alignItems: 'center', marginBottom: spacing.xl },

  formCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(230,230,230,0.6)',
    padding: spacing.lg,
    shadowColor: '#0A0F23',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  formCardFocused: {
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 10 },
  },
  formHeader: { marginBottom: spacing.md },
  fieldContainer: { marginBottom: spacing.md },
  fieldLabel: { color: colors.onSurface, marginBottom: spacing.xs },

  input: {
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.background,
    color: colors.onSurface,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
  },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: { position: 'absolute', right: spacing.md, height: 48, justifyContent: 'center' },
  link: { color: colors.primary },
  submitButton: {
    height: 48,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  submitText: { color: '#ffffff', marginLeft: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
  dividerText: { marginHorizontal: spacing.sm, color: colors.onSurfaceVariant },
  googleButton: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonText: { color: colors.onSurface },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginTop: spacing.lg },
});