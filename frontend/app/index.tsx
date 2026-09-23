// app/index.tsx
// Branded launch animation displaying exclusively the 8-dot star mark.

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { router } from 'expo-router';
import BoolokLogo from '../components/BoolokLogo';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const { user, loading } = useAuth();

  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0.75)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  // Track whether the minimum display time (1.4 s) has elapsed
  const [minTimeDone, setMinTimeDone] = React.useState(false);

  useEffect(() => {
    // Elegant breathing pulse loop for the 8-dot star logo
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.08,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.94,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseAnim.start();

    // Enforce a minimum 1.4 s branding display, then signal readiness
    const timer = setTimeout(() => setMinTimeDone(true), 1400);

    return () => {
      pulseAnim.stop();
      clearTimeout(timer);
    };
  }, []);

  // Navigate only once BOTH the minimum time has passed AND auth has resolved
  useEffect(() => {
    if (!minTimeDone || loading) return;

    Animated.timing(fadeOut, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      if (user) {
        router.replace('/(app)/dashboard');
      } else {
        router.replace('/(auth)/login');
      }
    });
  }, [minTimeDone, loading, user]);

  return (
    <View style={[styles.root, Platform.OS === 'web' && styles.rootWeb]}>
      <Animated.View
        style={[
          styles.center,
          {
            opacity: fadeOut,
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.View style={{ opacity }}>
          <BoolokLogo size={80} color="#ffffff" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootWeb: {
    minHeight: '100vh' as any,
    width: '100%' as any,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});