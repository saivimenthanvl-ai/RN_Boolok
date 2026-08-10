// app/index.tsx
// Port of boolok_gpt_loading_screen.html — the very first screen shown.
// Sequence mirrors the original setTimeout chain exactly:
//   1. Logo dots pop in + converge color black -> gold
//   2. Sparkle mark spins in
//   3. Wordmark fades up, tagline expands
//   4. Progress bar: 0% -> 40% -> 72% -> 100% with status text changes
//   5. Values bar fades in
//   6. Whole stage zooms/fades out, background -> white, then navigate

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const GOLD = colors.primary; // #DAA520
const NAVY = '#1C2238';

// 8 dot offsets, same grid positions as the HTML (relative to center)
const DOT_OFFSETS = [
  { x: -30, y: -30 },
  { x: 0, y: -30 },
  { x: 30, y: -30 },
  { x: -30, y: 0 },
  { x: 30, y: 0 },
  { x: -30, y: 30 },
  { x: 0, y: 30 },
  { x: 30, y: 30 },
];

const VALUES = ['INTELLIGENT', 'TRUSTED', 'INNOVATIVE', 'GLOBAL', 'FUTURE-READY'];

export default function LoadingScreen() {
  const { isAuthenticated, loading } = useAuth();
  // Per-dot animated values: scale (pop in) + color progress (black -> gold)
  const dotScales = useRef(DOT_OFFSETS.map(() => new Animated.Value(0))).current;
  const dotColor = useRef(new Animated.Value(0)).current; // 0 = navy, 1 = gold

  const sparkleScale = useRef(new Animated.Value(0)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;

  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkTranslate = useRef(new Animated.Value(12)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  const progressOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current; // 0..100

  const valuesOpacity = useRef(new Animated.Value(0)).current;

  const stageOpacity = useRef(new Animated.Value(1)).current;
  const stageScale = useRef(new Animated.Value(1)).current;
  const bgColor = useRef(new Animated.Value(0)).current; // 0 = black, 1 = white

  const [statusText, setStatusText] = useState('INITIALIZING...');
  const statusOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    // --- Phase 1: dots pop in, staggered (mirrors particle convergence) ---
    Animated.stagger(
      60,
      dotScales.map((v) =>
        Animated.spring(v, {
          toValue: 1,
          useNativeDriver: false,
          friction: 5,
          tension: 80,
        })
      )
    ).start();

    // Morph dot color navy -> gold, same timing as revealLogo()
    Animated.timing(dotColor, {
      toValue: 1,
      duration: 600,
      delay: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // color interpolation needs JS driver
    }).start();

    // --- Phase 2: sparkle spins in ---
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.spring(sparkleScale, { toValue: 1, useNativeDriver: false, friction: 5 }),
        Animated.timing(sparkleRotate, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    // --- Phase 3: wordmark + tagline ---
    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
        Animated.timing(wordmarkTranslate, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(200),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
    ]).start();

    // --- Phase 4: progress bar sequence ---
    const runProgress = async () => {
      await wait(1700); // 900 + 200 + 600 roughly lines up with HTML's 800ms post-reveal delay
      Animated.timing(progressOpacity, { toValue: 1, duration: 500, useNativeDriver: false }).start();
      animateProgress(40);
      updateStatus('CONNECTING TO SECURE NETWORK...');

      await wait(1200);
      animateProgress(72);
      updateStatus('OPTIMIZING WORKSPACE...');

      await wait(1200);
      animateProgress(100);
      updateStatus('READY.');

      await wait(600);
      Animated.timing(valuesOpacity, { toValue: 1, duration: 600, useNativeDriver: false }).start();

      await wait(1000);
      // --- Phase 5: transition out, then navigate ---
      Animated.parallel([
        Animated.timing(bgColor, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(stageOpacity, { toValue: 0, duration: 1200, useNativeDriver: false }),
        Animated.timing(stageScale, { toValue: 1.15, duration: 1200, useNativeDriver: false }),
        Animated.timing(valuesOpacity, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ]).start(() => {
        if (!cancelled) {
          router.replace(
            isAuthenticated ? '/(app)/dashboard' : '/brand-vision'
          );
        }
      });
    };
    runProgress();

    return () => {
      cancelled = true;
    };

    function animateProgress(target: number) {
      Animated.timing(progressWidth, {
        toValue: target,
        duration: 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // width animation needs JS driver
      }).start();
    }

    function updateStatus(text: string) {
      Animated.timing(statusOpacity, { toValue: 0, duration: 400, useNativeDriver: false }).start(() => {
        setStatusText(text);
        Animated.timing(statusOpacity, { toValue: 1, duration: 400, useNativeDriver: false }).start();
      });
    }
  }, [isAuthenticated, loading]);

  const dotBg = dotColor.interpolate({ inputRange: [0, 1], outputRange: [NAVY, GOLD] });
  const rootBg = bgColor.interpolate({ inputRange: [0, 1], outputRange: ['#000000', '#ffffff'] });
  const sparkleSpin = sparkleRotate.interpolate({ inputRange: [0, 1], outputRange: ['90deg', '0deg'] });
  const progressPct = progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[styles.root, { backgroundColor: rootBg as any }]}>
      <Animated.View
        style={[
          styles.centerStage,
          { opacity: stageOpacity, transform: [{ scale: stageScale }] },
        ]}
      >
        {/* Logo mark: 8 dots + sparkle */}
        <View style={styles.logoMark}>
          {DOT_OFFSETS.map((offset, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: dotBg,
                  left: 40 + offset.x - 6,
                  top: 40 + offset.y - 6,
                  transform: [{ scale: dotScales[i] }],
                },
              ]}
            />
          ))}
          <Animated.View
            style={[
              styles.sparkleWrap,
              { transform: [{ scale: sparkleScale }, { rotate: sparkleSpin }] },
            ]}
          >
            <Svg width={26} height={26} viewBox="0 0 26 26">
              <Path
                d="M 13.0 0.0 Q 13.88 8.21 16.21 8.58 Q 21.95 8.15 25.36 8.98 Q 17.83 12.36 18.19 14.69 Q 20.38 20.02 20.64 23.52 Q 15.1 17.39 13.0 18.46 Q 8.61 22.19 5.36 23.52 Q 9.47 16.36 7.81 14.69 Q 2.91 11.66 0.64 8.98 Q 8.72 10.68 9.79 8.58 Q 11.15 2.99 13.0 0.0 Z"
                fill="#ffffff"
              />
            </Svg>
          </Animated.View>
        </View>

        {/* Wordmark */}
        <Animated.View
          style={{
            opacity: wordmarkOpacity,
            transform: [{ translateY: wordmarkTranslate }],
            alignItems: 'center',
          }}
        >
          <Text style={styles.brandName}>
            BOOLOK <Text style={{ color: GOLD }}>GPT</Text>
          </Text>
          <Animated.View style={[styles.taglineWrap, { opacity: taglineOpacity }]}>
            <View style={styles.tagLine} />
            <Text style={styles.tagline}>AI AGENT FOR REAL ESTATE SERVICES</Text>
            <View style={styles.tagLine} />
          </Animated.View>
        </Animated.View>

        {/* Progress */}
        <Animated.View style={[styles.progressWrap, { opacity: progressOpacity }]}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressPct as any }]} />
          </View>
          <Animated.View style={{ opacity: statusOpacity }}>
            <Text style={styles.statusText}>{statusText}</Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* Values bar */}
      <Animated.View style={[styles.valuesBar, { opacity: valuesOpacity }]}>
        {VALUES.map((v, i) => (
          <View key={v} style={[styles.valItem, i === VALUES.length - 1 && { borderRightWidth: 0 }]}>
            <Text style={styles.valText}>{v}</Text>
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStage: {
    alignItems: 'center',
  },
  logoMark: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sparkleWrap: {
    position: 'absolute',
    top: 40 - 13,
    left: 40 - 13,
  },
  brandName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    letterSpacing: 2,
    color: '#ffffff',
  },
  taglineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  tagLine: {
    width: 20,
    height: 1,
    backgroundColor: GOLD,
  },
  tagline: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#E6E6E6',
  },
  progressWrap: {
    marginTop: 28,
    width: 200,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(218,165,32,0.2)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 1,
  },
  statusText: {
    marginTop: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: 'rgba(230,230,230,0.7)',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  valuesBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(218,165,32,0.1)',
  },
  valItem: {
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(218,165,32,0.15)',
  },
  valText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 8,
    letterSpacing: 2,
    color: 'rgba(230,230,230,0.5)',
  },
});
