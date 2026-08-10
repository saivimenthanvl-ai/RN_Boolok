// app/(auth)/brand-vision.tsx
import { router } from 'expo-router';
import React, { useRef } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOLD = '#E7AD17';
const NAVY = '#070C21';
const BLACK = '#050505';
const PANEL = '#0B0B0B';
const BORDER = '#202020';
const MUTED = '#B9B9C2';

const FONT = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  default: 'sans-serif',
});

// ---------------------------------------------------------------------------
// Feature data + icons (inlined here — no external import needed)
// ---------------------------------------------------------------------------

type FeatureIconName = 'search' | 'sparkles' | 'chart' | 'globe';

interface FeatureData {
  icon: FeatureIconName;
  title: string;
  description: string;
}

const FEATURES: FeatureData[] = [
  { icon: 'search', title: 'Smart Search', description: 'Find exactly what you need with semantic property discovery.' },
  { icon: 'sparkles', title: 'AI Advisor', description: 'Get professional guidance on valuations and legalities.' },
  { icon: 'chart', title: 'Market Insights', description: 'Real-time data visualization of global market trends.' },
  { icon: 'globe', title: 'Global Reach', description: 'Connect with opportunities across borders instantly.' },
];

function FeatureIcon({ name, size = 27 }: { name: FeatureIconName; size?: number }) {
  if (name === 'search') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="10.5" cy="10.5" r="5.6" fill="none" stroke={GOLD} strokeWidth="2.2" />
        <Path d="M14.7 14.7 20 20" fill="none" stroke={GOLD} strokeLinecap="round" strokeWidth="2.2" />
      </Svg>
    );
  }
  if (name === 'sparkles') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M9 2.5c.55 3.8 2.25 5.5 6 6-3.75.5-5.45 2.2-6 6-.55-3.8-2.25-5.5-6-6 3.75-.5 5.45-2.2 6-6Z" fill={GOLD} />
        <Path d="M17.5 12.2c.35 2.45 1.55 3.65 4 4-2.45.35-3.65 1.55-4 4-.35-2.45-1.55-3.65-4-4 2.45-.35 3.65-1.55 4-4ZM17.5 2.3c.2 1.35.85 2 2.2 2.2-1.35.2-2 .85-2.2 2.2-.2-1.35-.85-2-2.2-2.2 1.35-.2 2-.85 2.2-2.2Z" fill={GOLD} />
      </Svg>
    );
  }
  if (name === 'chart') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="m3.5 17 5-5 3.4 3.4L20 7.3" fill="none" stroke={GOLD} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" />
        <Path d="M14.5 7.3H20v5.4" fill="none" stroke={GOLD} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="8.3" fill="none" stroke={GOLD} strokeWidth="2" />
      <Path
        d="M3.9 10h4l1.6-2.5 2.2.6.8 2.1 2.5.8.2 2.5-2.1 1.1-.5 2.8-2.2 1.4-1.8-2.5-2.8-.4M13 3.9c1.1 1.2 1.9 2.8 2.1 4.5M17.4 16.6c-.8 1.4-2 2.6-3.4 3.3"
        fill="none"
        stroke={GOLD}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </Svg>
  );
}

function FeatureIconBox({ name, boxSize = 52, iconSize = 27 }: { name: FeatureIconName; boxSize?: number; iconSize?: number }) {
  return (
    <View style={[styles.iconBox, { width: boxSize, height: boxSize, borderRadius: boxSize * 0.27 }]}>
      <FeatureIcon name={name} size={iconSize} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Neural node logo mark
// ---------------------------------------------------------------------------

function NeuralNode({ compact = false, narrowCompact = false }: { compact?: boolean; narrowCompact?: boolean }) {
  const size = narrowCompact ? 30 : compact ? 39 : 150;
  const dot = narrowCompact ? 4 : compact ? 5 : 12;
  const positions = [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]];
  return (
    <View style={{ width: size, height: size }}>
      {positions.map(([x, y]) => (
        <View
          key={`${x}-${y}`}
          style={{
            position: 'absolute',
            left: (x * (size - dot)) / 2,
            top: (y * (size - dot)) / 2,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: GOLD,
          }}
        />
      ))}
      <Svg
        width={narrowCompact ? 13 : compact ? 17 : 46}
        height={narrowCompact ? 13 : compact ? 17 : 46}
        viewBox="0 0 26 26"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: [
            { translateX: narrowCompact ? -6.5 : compact ? -8.5 : -23 },
            { translateY: narrowCompact ? -6.5 : compact ? -8.5 : -23 },
          ],
        }}
      >
        <Path d="M13 0c1.1 7.2 2.8 8.9 10 10-7.2 1.1-8.9 2.8-10 10-1.1-7.2-2.8-8.9-10-10 7.2-1.1 8.9-2.8 10-10Z" fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({ narrow }: { narrow: boolean }) {
  return (
    <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
      <View style={[styles.header, narrow && styles.headerNarrow]}>
        {/* Already on brand-vision — logo is decorative, doesn't navigate to itself */}
        <View style={styles.brandRow}>
          <NeuralNode compact={!narrow} narrowCompact={narrow} />
          <Text style={[styles.brandText, narrow && styles.brandTextNarrow]} numberOfLines={1} adjustsFontSizeToFit>
            BOOLOK <Text style={styles.goldText}>GPT</Text>
          </Text>
        </View>
        <View style={[styles.navActions, narrow && styles.navActionsNarrow]}>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/(auth)/login')}
            style={[styles.signInButton, narrow && styles.signInButtonNarrow]}
            hitSlop={8}
          >
            <Text style={[styles.signInText, narrow && styles.navTextNarrow]} numberOfLines={1}>
              Sign In
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/(auth)/register')}
            style={[styles.joinButton, narrow && styles.joinButtonNarrow]}
            hitSlop={8}
          >
            <Text style={[styles.joinText, narrow && styles.navTextNarrow]} numberOfLines={1}>
              Join Now
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function BrandVisionScreen() {
  const { width } = useWindowDimensions();
  const narrow = width < 720;
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={styles.page}>
      <Header narrow={narrow} />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <NeuralNode />
          <Text style={[styles.heroTitle, narrow && styles.heroTitleNarrow]}>The Geometry of Precision</Text>
          <Text style={[styles.heroCopy, narrow && styles.heroCopyNarrow]}>
            At the heart of BOOLOK GPT lies the <Text style={styles.goldText}>Neural Node</Text>—a 9-dot architecture
            representing the convergence of local data, global trends, and human intent, unified by the central spark
            of Artificial Intelligence.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => scrollRef.current?.scrollTo({ y: 645, animated: true })}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Explore Pillars  ↓</Text>
          </Pressable>
        </View>

        <View style={styles.coreSection}>
          <Text style={[styles.sectionTitle, narrow && styles.sectionTitleNarrow]}>The Architectural Core</Text>
          <Text style={styles.sectionEyebrow}>INTELLIGENCE BUILT FOR REAL ESTATE</Text>
          <View style={[styles.featureGrid, narrow && styles.featureGridNarrow]}>
            {FEATURES.map((feature: FeatureData) => (
              <View key={feature.title} style={[styles.featureCard, narrow && styles.featureCardNarrow]}>
                <FeatureIconBox name={feature.icon} />
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Text style={[styles.ctaTitle, narrow && styles.ctaTitleNarrow]}>Ready to find your next opportunity?</Text>
          <Text style={styles.ctaCopy}>Create your account and put intelligent property discovery to work.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(auth)/register')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>© 2026 BOOLOK GPT. INTELLIGENT PRECISION.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: BLACK },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  headerSafeArea: { backgroundColor: NAVY },
  header: {
    minHeight: 82,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: NAVY,
    borderBottomWidth: 1,
    borderBottomColor: '#30333F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerNarrow: {
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 1, minWidth: 0 },
  brandText: { color: '#FFFFFF', fontFamily: FONT, fontSize: 20, fontWeight: '700' },
  brandTextNarrow: { fontSize: 15, flexShrink: 1 },
  goldText: { color: GOLD },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  navActionsNarrow: { gap: 6 },
  signInButton: { paddingHorizontal: 13, paddingVertical: 11 },
  signInButtonNarrow: { paddingHorizontal: 8, paddingVertical: 8 },
  signInText: { color: '#FFFFFF', fontFamily: FONT, fontSize: 15, fontWeight: '600' },
  joinButton: { backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 13 },
  joinButtonNarrow: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8 },
  joinText: { color: '#090909', fontFamily: FONT, fontSize: 15, fontWeight: '700' },
  navTextNarrow: { fontSize: 13 },
  hero: {
    minHeight: 645,
    paddingHorizontal: 24,
    paddingVertical: 65,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
  },
  heroTitle: { marginTop: 36, color: '#FFFFFF', fontFamily: FONT, fontSize: 42, lineHeight: 50, fontWeight: '700', textAlign: 'center' },
  heroTitleNarrow: { fontSize: 32, lineHeight: 39 },
  heroCopy: { maxWidth: 830, marginTop: 23, color: '#C4C4C8', fontFamily: FONT, fontSize: 20, lineHeight: 34, textAlign: 'center' },
  heroCopyNarrow: { fontSize: 16, lineHeight: 27 },
  primaryButton: { marginTop: 36, minWidth: 212, paddingHorizontal: 28, paddingVertical: 18, borderRadius: 11, backgroundColor: GOLD, alignItems: 'center' },
  primaryButtonText: { color: '#090909', fontFamily: FONT, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  coreSection: { backgroundColor: NAVY, paddingHorizontal: 22, paddingVertical: 72, alignItems: 'center' },
  sectionTitle: { color: '#FFFFFF', fontFamily: FONT, fontSize: 39, lineHeight: 48, fontWeight: '700', textAlign: 'center' },
  sectionTitleNarrow: { fontSize: 30, lineHeight: 38 },
  sectionEyebrow: { marginTop: 12, color: GOLD, fontFamily: FONT, fontSize: 11, fontWeight: '700', letterSpacing: 2, textAlign: 'center' },
  featureGrid: { width: '100%', maxWidth: 940, marginTop: 43, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 26 },
  featureGridNarrow: { gap: 18 },
  featureCard: {
    width: '47%',
    minHeight: 138,
    padding: 27,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: PANEL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  featureCardNarrow: { width: '100%', maxWidth: 394, minHeight: 129, padding: 26, gap: 25 },
  featureTextWrap: { flex: 1 },
  featureTitle: { color: '#FFFFFF', fontFamily: FONT, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  featureDescription: { marginTop: 4, color: MUTED, fontFamily: FONT, fontSize: 15, lineHeight: 22 },
  ctaSection: { paddingHorizontal: 24, paddingVertical: 75, alignItems: 'center', backgroundColor: '#0D0D0D' },
  ctaTitle: { color: '#FFFFFF', fontFamily: FONT, fontSize: 35, lineHeight: 43, fontWeight: '700', textAlign: 'center' },
  ctaTitleNarrow: { fontSize: 28, lineHeight: 35 },
  ctaCopy: { maxWidth: 600, marginTop: 14, color: MUTED, fontFamily: FONT, fontSize: 16, lineHeight: 25, textAlign: 'center' },
  footer: { paddingHorizontal: 20, paddingVertical: 27, color: '#777C8E', backgroundColor: BLACK, fontFamily: FONT, fontSize: 11, letterSpacing: 1, textAlign: 'center' },
  iconBox: {
    backgroundColor: '#211B08',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});