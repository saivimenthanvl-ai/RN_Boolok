// components/LoadingScreen.tsx
// Full-screen branded loader. Use this while checking auth state on app
// boot (e.g. in AuthContext) or during the brief transition after
// login/register succeeds and before the app shell (Dashboard/Feed/etc.)
// mounts.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BoolokLogo from './BoolokLogo';
import { colors, spacing, typography } from '../constants/theme';

type LoadingScreenProps = {
  /** Optional status text under the logo, e.g. "Signing you in..." */
  message?: string;
  /** Use the dark brand background (matches auth brand panel) instead of light. */
  dark?: boolean;
};

export default function LoadingScreen({
  message = 'Loading BOOLOK GPT...',
  dark = true,
}: LoadingScreenProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [spin, pulse]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bg = dark ? '#000000' : colors.background;
  const textColor = dark ? 'rgba(255,255,255,0.7)' : colors.onSurfaceVariant;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]}>
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <BoolokLogo size={64} filled color={dark ? '#ffffff' : colors.primary} />
        </Animated.View>

        <Animated.View style={[styles.ring, { transform: [{ rotate }] }]} />

        <Text style={[typography.labelMd, styles.message, { color: textColor }]}>
          {message}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const RING_SIZE = 88;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
    borderColor: 'rgba(218,165,32,0.25)',
    borderTopColor: colors.primary,
  },
  message: {
    marginTop: spacing.xl,
    letterSpacing: 1,
  },
});