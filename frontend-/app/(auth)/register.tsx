// app/(auth)/register.tsx
// Responsive port of create_account_boolok_gpt.html for Expo (incl. web).
// Breakpoint mirrors Tailwind's `md` (768px):
//   width >= 768  -> two-panel "web" layout (brand panel + form panel)
//   width < 768   -> mobile layout (form panel only, with small logo header)

import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
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
import BoolokLogo from '../../components/BoolokLogo';
import GoogleIcon from '../../components/GoogleIcon';
import { colors, spacing, radius, typography } from '../../constants/theme';

const MD_BREAKPOINT = 768;

type SubmitState = 'idle' | 'loading' | 'success';

const FEATURES = [
  { icon: 'search', title: 'Smart Search', desc: 'Find exactly what you need with semantic property discovery.' },
  { icon: 'auto-awesome', title: 'AI Advisor', desc: 'Get professional guidance on valuations and legalities.' },
  { icon: 'trending-up', title: 'Market Insights', desc: 'Real-time data visualization of global market trends.' },
  { icon: 'public', title: 'Global Reach', desc: 'Connect with opportunities across borders instantly.' },
] as const;

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= MD_BREAKPOINT;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const { signIn } = useAuth();

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // ── Google Sign-In ──────────────────────────────────────────────
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const handleGoogleSuccess = useCallback(
    async (idToken: string) => {
      setIsGoogleSigningIn(true);
      try {
        console.log('Sending Google ID token from register to:', `${API_BASE_URL}/api/auth/google`);
        const response = await axios.post(`${API_BASE_URL}/api/auth/google`, { idToken });
        const { token, user } = response.data ?? {};

        if (!token || !user) {
          throw new Error('The backend response is missing token or user data.');
        }

        await signIn(token, user);
        setSubmitState('success');
        router.replace('/(app)/dashboard');
      } catch (error: any) {
        console.error('Registration Google Error:', error.response?.data || error.message);
        showMessage('Google Sign-Up Failed', error.response?.data?.message || 'Google sign-up failed. Please try again.');
      } finally {
        setIsGoogleSigningIn(false);
      }
    },
    [signIn]
  );

  const { promptGoogleSignIn, isGoogleLoading } = useGoogleAuth({
    onSuccess: handleGoogleSuccess,
    onError: (msg) => showMessage('Google Sign-Up Error', msg),
  });

  // ────────────────────────────────────────────────────────────────

  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    agreed &&
    submitState === 'idle';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitState('loading');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      const { token, user } = response.data ?? {};

      if (!token || !user) {
        throw new Error('The backend response is missing token or user data.');
      }

      await signIn(token, user);
      setSubmitState('success');
      router.replace('/(app)/dashboard');
    } catch (error: any) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      setSubmitState('idle');
      showMessage('Registration Failed', error.response?.data?.message || 'Registration failed. Please check network connection and try again.');
    }
  };

  const buttonLabel =
    submitState === 'loading'
      ? 'Creating Account...'
      : submitState === 'success'
        ? 'Account Created!'
        : 'Create Account';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F4F6' }}>
      <ScrollView
        style={styles.rootScroll}
        contentContainerStyle={styles.rootScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.mainLayout, isWide && styles.mainLayoutRow]}>
            {/* ---------- LEFT BRAND PANEL (web/wide screens only) ---------- */}
            {isWide && (
              <Animated.View style={styles.brandPanel} entering={FadeIn.duration(800)}>
                {/* decorative glow, mirrors the absolute blurred circle in the HTML */}
                <View style={styles.glow} />

                <Pressable
                  style={styles.brandLogoRow}
                  onPress={() => router.push('/brand-vision')}
                >
                  <BoolokLogo size={48} color="#fff" />
                  <Text style={[typography.headlineMd, { color: '#fff', marginLeft: spacing.base }]}>
                    BOOLOK <Text style={{ color: colors.primary }}>GPT</Text>
                  </Text>
                </Pressable>

                <Text style={[typography.headlineXl, styles.brandHeadline]}>
                  AI AGENT FOR{'\n'}
                  <Text style={{ color: colors.primary }}>REAL ESTATE</Text>{'\n'}
                  SERVICES
                </Text>
                <Text style={[typography.bodyLg, styles.brandSubtext]}>
                  Empowering your property journey with precision data and intelligent automation.
                </Text>

                <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
                  {FEATURES.map((f) => (
                    <View key={f.title} style={styles.featureCard}>
                      <View style={styles.featureIconWrap}>
                        <MaterialIcons name={f.icon as any} size={22} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.headlineSm, { color: '#fff', marginBottom: 2 }]}>
                          {f.title}
                        </Text>
                        <Text style={[typography.bodySm, styles.brandSubtext]}>{f.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <Text style={[typography.labelMd, styles.copyright]}>
                  © 2026 BOOLOK GPT. INTELLIGENT PRECISION.
                </Text>
              </Animated.View>
            )}

            {/* ---------- RIGHT / FORM PANEL (always shown) ---------- */}
            <Animated.View
              style={[styles.formPanel, isWide && styles.formPanelWide]}
              entering={FadeInDown.duration(600).delay(100).springify()}
            >
              <View style={[styles.formContent, isWide && styles.formContentWide]}>
                {/* Small logo header — only on mobile, matches md:hidden block */}
                {!isWide && (
                  <Pressable
                    style={styles.mobileLogoBlock}
                    onPress={() => router.push('/brand-vision')}
                  >
                    <BoolokLogo size={56} />
                    <Text style={[typography.headlineMd, { color: colors.onBackground, marginTop: spacing.base }]}>
                      BOOLOK GPT
                    </Text>
                  </Pressable>
                )}

                <View style={{ marginBottom: spacing.lg }}>
                  <Text style={[typography.headlineLg, { color: colors.onBackground, marginBottom: spacing.xs }]}>
                    Create Your Account
                  </Text>
                  <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
                    Join the next generation of real estate intelligence.
                  </Text>
                </View>

                <Field label="Full Name">
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.outline}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </Field>

                <Field label="Email Address">
                  <TextInput
                    style={styles.input}
                    placeholder="name@company.com"
                    placeholderTextColor={colors.outline}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Field>

                <Field label="Password">
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Min. 8 characters"
                      placeholderTextColor={colors.outline}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <Pressable style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
                      <MaterialIcons
                        name={showPassword ? 'visibility-off' : 'visibility'}
                        size={22}
                        color={colors.outline}
                      />
                    </Pressable>
                  </View>
                </Field>

                <Pressable style={styles.termsRow} onPress={() => setAgreed((v) => !v)}>
                  <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                    {agreed && <MaterialIcons name="check" size={14} color={colors.onPrimary} />}
                  </View>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, flex: 1 }]}>
                    I agree to the <Text style={styles.link}>Terms of Service</Text> and{' '}
                    <Text style={styles.link}>Privacy Policy</Text>.
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.submitButton,
                    submitState === 'success' && { backgroundColor: colors.success },
                    !canSubmit && submitState === 'idle' && { opacity: 0.5 },
                  ]}
                  onPress={handleSubmit}
                  disabled={submitState !== 'idle'}
                >
                  <Text style={[typography.headlineSm, { color: colors.onPrimary }]}>{buttonLabel}</Text>
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={[typography.labelMd, { color: colors.outline }]}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={[styles.googleButton, (isGoogleLoading || isGoogleSigningIn) && { opacity: 0.6 }]}
                  onPress={promptGoogleSignIn}
                  disabled={isGoogleLoading || isGoogleSigningIn}
                >
                  <GoogleIcon />
                  <Text style={[typography.bodyMd, { color: colors.onSurface, marginLeft: spacing.base }]}>
                    {isGoogleSigningIn ? 'Signing up...' : 'Sign up with Google'}
                  </Text>
                </Pressable>

                <View style={styles.footer}>
                  <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
                    Already have an account?{' '}
                  </Text>
                  <Link href="/(auth)/login" style={[typography.bodyMd, styles.link, { fontFamily: 'Poppins_700Bold' }]}>
                    Sign In
                  </Link>
                </View>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[typography.labelMd, { color: colors.onSurface, marginBottom: spacing.xs }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  rootScroll: { flex: 1, backgroundColor: colors.background },
  rootScrollContent: { flexGrow: 1 },
  keyboardAvoid: { flex: 1 },
  mainLayout: { flex: 1 },
  mainLayoutRow: { flexDirection: 'row' },

  // ---- Brand panel (web only) ----
  brandPanel: {
    width: '38%',
    maxWidth: 480,
    backgroundColor: colors.onBackground, // #0A0F23
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  glow: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandHeadline: {
    color: '#fff',
    marginBottom: spacing.md,
  },
  brandSubtext: {
    color: 'rgba(255,255,255,0.6)',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(218,165,32,0.1)', // primary @ 10%
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyright: {
    color: 'rgba(255,255,255,0.4)',
    marginTop: spacing.xl,
  },

  // ---- Form panel (always) ----
  formPanel: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  formPanelWide: {
    paddingHorizontal: spacing.xl,
  },
  formContent: {
    width: '100%',
    paddingHorizontal: spacing.gutter,
  },
  formContentWide: {
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  mobileLogoBlock: { width: '100%', alignItems: 'center', marginBottom: spacing.xl },

  input: {
    height: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    color: colors.onSurface,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: { position: 'absolute', right: spacing.md, height: 52, justifyContent: 'center' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.lg },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  link: { color: colors.primary, fontFamily: 'Poppins_600SemiBold' },
  submitButton: {
    height: 52,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
  googleButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
});
