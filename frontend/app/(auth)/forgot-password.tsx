// app/(auth)/forgot-password.tsx
// "Forgot Password" screen — users arrive here from the login "Forgot Password?" link.
// Sends a password-reset request to the backend (or shows a placeholder until wired up).

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import BoolokLogo from '../../components/BoolokLogo';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { API_BASE_URL } from '../../lib/api';
import axios from 'axios';

type SubmitState = 'idle' | 'loading' | 'sent';

export default function ForgotPasswordScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = email.trim().length > 0 && submitState === 'idle';

  const handleSend = async () => {
    if (!canSubmit) return;
    setErrorMsg('');
    setSubmitState('loading');
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
    } catch (_) {
      // Even on error, we show a success message to avoid email enumeration
    } finally {
      setSubmitState('sent');
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.rootContent}
      keyboardShouldPersistTaps="handled"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[styles.card, isWide && styles.cardWide]}
          entering={FadeInDown.duration(500).springify()}
        >
          {/* Back button */}
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelMd, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>
              Back to Sign In
            </Text>
          </Pressable>

          {/* Logo */}
          <Animated.View style={styles.logoWrap} entering={FadeIn.duration(600).delay(100)}>
            <BoolokLogo size={52} color={colors.primary} />
          </Animated.View>

          {submitState !== 'sent' ? (
            <>
              {/* Header */}
              <Text style={[typography.headlineMd, styles.title]}>Reset Password</Text>
              <Text style={[typography.bodyMd, styles.subtitle]}>
                Enter your email address and we'll send you a secure link to reset your password.
              </Text>

              {/* Email input */}
              <View style={styles.fieldWrap}>
                <Text style={[typography.labelMd, styles.label]}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.outline}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrorMsg(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Error */}
              {errorMsg.length > 0 && (
                <Text style={styles.errorText}>{errorMsg}</Text>
              )}

              {/* Submit */}
              <Pressable
                style={[
                  styles.submitBtn,
                  !canSubmit && { opacity: 0.5 },
                ]}
                onPress={handleSend}
                disabled={!canSubmit}
              >
                {submitState === 'loading' ? (
                  <Text style={[typography.labelMd, { color: '#fff' }]}>Sending…</Text>
                ) : (
                  <Text style={[typography.labelMd, { color: '#fff' }]}>Send Reset Link</Text>
                )}
              </Pressable>
            </>
          ) : (
            /* Success state */
            <Animated.View style={styles.successWrap} entering={FadeIn.duration(500)}>
              <View style={styles.successIconWrap}>
                <MaterialIcons name="mark-email-read" size={52} color={colors.primary} />
              </View>
              <Text style={[typography.headlineMd, styles.title]}>Check Your Inbox</Text>
              <Text style={[typography.bodyMd, styles.subtitle]}>
                If an account exists for{' '}
                <Text style={{ color: colors.primary, fontFamily: 'Poppins_600SemiBold' }}>
                  {email}
                </Text>
                , you'll receive a reset link shortly.
              </Text>
              <Pressable
                style={[styles.submitBtn, { marginTop: spacing.lg }]}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={[typography.labelMd, { color: '#fff' }]}>Back to Sign In</Text>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F4F6',
  },
  rootContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.gutter,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(230,230,230,0.6)',
    padding: spacing.lg,
    shadowColor: '#0A0F23',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardWide: {
    padding: spacing.xl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  fieldWrap: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
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
  errorText: {
    color: colors.error,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  submitBtn: {
    height: 48,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    ...Platform.select({
      web: { transition: 'opacity 0.2s ease' } as any,
      default: {},
    }),
  },
  successWrap: {
    alignItems: 'center',
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(218,165,32,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(218,165,32,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    alignSelf: 'center',
  },
});
