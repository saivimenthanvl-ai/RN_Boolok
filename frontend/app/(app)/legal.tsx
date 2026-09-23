// app/(app)/legal.tsx
// Legal AI — Institutional Real Estate Legal Due Diligence & Smart Contract Feature (Coming Soon)

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';

export default function LegalAIScreen() {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [hasJoinedWaitlist, setHasJoinedWaitlist] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoinWaitlist = () => {
    if (!waitlistEmail.trim() || !waitlistEmail.includes('@')) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setHasJoinedWaitlist(true);
    }, 600);
  };

  const FEATURES = [
    {
      icon: 'file-document-check-outline',
      title: 'Autonomous Title Deed Audits',
      badge: 'OCR & NLP ENGINE',
      description:
        'Analyzes 30-year encumbrance certificates (EC), pattas, mutation registers, and link documents to flag ownership breaks, pending mortgages, or partition disputes.',
    },
    {
      icon: 'map-marker-radius-outline',
      title: 'Zoning & Master Plan Scanner',
      badge: 'GIS ALIGNMENT',
      description:
        'Instant verification of approved Floor Space Index (FSI), setback distances, green buffer zones, and Coastal Regulation Zone (CRZ) clearances against municipal town plans.',
    },
    {
      icon: 'scale-balance',
      title: 'RERA Compliance & Litigation Risk',
      badge: 'APPELLATE RADAR',
      description:
        'Cross-references project registrations, promoter litigation history, escrow account solvency, and pending consumer forum disputes across state RERA registries.',
    },
    {
      icon: 'shield-lock-outline',
      title: 'Smart Agreement & Escrow Scoring',
      badge: 'CONTRACT INTELLIGENCE',
      description:
        'Audits Agreements for Sale, Builder-Buyer contracts, and Joint Development Agreements (JDA) to expose one-sided indemnity clauses and hidden cost escalations.',
    },
  ];

  const ROADMAP = [
    { quarter: 'Q3 2026', title: 'Private Beta: Title Deed OCR & Lien Scans', status: 'In Development' },
    { quarter: 'Q4 2026', title: 'RERA Tribunal Appellate Cross-Reference Engine', status: 'Planned' },
    { quarter: 'Q1 2027', title: 'Institutional Smart Escrow & Digital Deed Settlement', status: 'Architected' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#060B13' : '#F8FAFC' }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isWide && { maxWidth: 960, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header Navigation ── */}
        <View style={styles.topNavRow}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF', borderColor: theme.outlineVariant }]}
          >
            <MaterialIcons name="arrow-back" size={18} color={theme.onSurface} />
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.statusPill, { backgroundColor: 'rgba(218, 165, 32, 0.15)', borderColor: theme.primary }]}>
              <View style={[styles.pulseDot, { backgroundColor: theme.primary }]} />
              <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '800' }}>FEATURE COMING SOON</Text>
            </View>

            <View style={[styles.statusPill, { backgroundColor: isDark ? '#142033' : '#E2E8F0', borderColor: theme.outlineVariant }]}>
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 11, fontWeight: '700' }}>Q3 2026</Text>
            </View>
          </View>
        </View>

        {/* ── Hero Banner ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroSection}>
          <View style={[styles.iconHalo, { backgroundColor: 'rgba(218, 165, 32, 0.12)', borderColor: theme.primary }]}>
            <MaterialCommunityIcons name="gavel" size={38} color={theme.primary} />
          </View>

          <Text style={[styles.heroPreTitle, { color: theme.primary }]}>
            BOOLOK AI ADVISORY SUITE
          </Text>

          <Text style={[styles.heroTitle, { color: theme.onSurface }]}>
            Legal AI Intelligence
          </Text>

          <Text style={[styles.heroSubtitle, { color: theme.onSurfaceVariant }]}>
            Autonomous Title Deed Auditing, RERA Compliance Analysis &amp; Smart Contract Verification for High-Yield Commercial and Luxury Assets.
          </Text>
        </Animated.View>

        {/* ── Waitlist Sign-up Card ── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[
            styles.waitlistCard,
            {
              backgroundColor: isDark ? '#0d1726' : '#FFFFFF',
              borderColor: isDark ? 'rgba(218, 165, 32, 0.3)' : '#E2E8F0',
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <MaterialIcons name="stars" size={20} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: theme.onSurface, fontSize: 16, fontWeight: '800' }}>
              Join the Priority Beta Access
            </Text>
          </View>

          <Text style={{ color: theme.onSurfaceVariant, fontSize: 13, lineHeight: 19, marginBottom: 16 }}>
            Be the first institutional broker or advisor to audit live land titles with Boolok Legal AI. Early waitlist members receive 3 complimentary enterprise title audits at launch.
          </Text>

          {hasJoinedWaitlist ? (
            <Animated.View entering={FadeIn} style={[styles.successBanner, { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e' }]}>
              <MaterialIcons name="check-circle" size={20} color="#22c55e" style={{ marginRight: 8 }} />
              <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '700' }}>
                You&apos;re on the priority waitlist! We will notify you at launch.
              </Text>
            </Animated.View>
          ) : (
            <View style={[styles.waitlistInputRow, !isWide && { flexDirection: 'column' }]}>
              <TextInput
                value={waitlistEmail}
                onChangeText={setWaitlistEmail}
                placeholder="Enter your professional work email"
                placeholderTextColor={theme.onSurfaceVariant}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.emailInput,
                  {
                    color: theme.onSurface,
                    backgroundColor: isDark ? '#162338' : '#F1F5F9',
                    borderColor: theme.outlineVariant,
                  },
                ]}
              />

              <Pressable
                onPress={handleJoinWaitlist}
                disabled={isSubmitting}
                style={[styles.joinBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={{ color: '#000000', fontSize: 13, fontWeight: '800' }}>
                  {isSubmitting ? 'Joining...' : 'Get Priority Access →'}
                </Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* ── Feature Cards Grid ── */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionHeading, { color: theme.onSurface }]}>
            Upcoming Legal AI Capabilities
          </Text>

          <View style={styles.featuresGrid}>
            {FEATURES.map((f, idx) => (
              <Animated.View
                key={idx}
                entering={FadeInDown.delay(150 + idx * 60).duration(400)}
                style={[
                  styles.featureCard,
                  isWide && { width: '48.5%' },
                  {
                    backgroundColor: isDark ? '#0b1320' : '#FFFFFF',
                    borderColor: isDark ? '#1e293b' : '#E2E8F0',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={[styles.featureIconBox, { backgroundColor: 'rgba(218, 165, 32, 0.12)' }]}>
                    <MaterialCommunityIcons name={f.icon as any} size={24} color={theme.primary} />
                  </View>

                  <View style={[styles.featureBadge, { backgroundColor: isDark ? '#142033' : '#F1F5F9', borderColor: theme.outlineVariant }]}>
                    <Text style={{ color: theme.primary, fontSize: 9.5, fontWeight: '800' }}>{f.badge}</Text>
                  </View>
                </View>

                <Text style={{ color: theme.onSurface, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>
                  {f.title}
                </Text>

                <Text style={{ color: theme.onSurfaceVariant, fontSize: 12.5, lineHeight: 18 }}>
                  {f.description}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── Development Roadmap ── */}
        <View style={[styles.roadmapCard, { backgroundColor: isDark ? '#0b1320' : '#FFFFFF', borderColor: isDark ? '#1e293b' : '#E2E8F0' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <MaterialIcons name="timeline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: theme.onSurface, fontSize: 16, fontWeight: '800' }}>
              Release Milestones
            </Text>
          </View>

          {ROADMAP.map((r, i) => (
            <View key={i} style={[styles.roadmapRow, i < ROADMAP.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#162338' : '#F1F5F9' }]}>
              <View style={[styles.roadmapQuarterPill, { backgroundColor: 'rgba(218, 165, 32, 0.12)' }]}>
                <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '800' }}>{r.quarter}</Text>
              </View>
              <Text style={{ color: theme.onSurface, fontSize: 13, fontWeight: '600', flex: 1, marginHorizontal: 12 }}>
                {r.title}
              </Text>
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 11, fontWeight: '700' }}>
                {r.status}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Link to Platform Legal Policies (Terms & Privacy Hub) ── */}
        <Pressable
          onPress={() => router.push('/terms')}
          style={[
            styles.legalHubRedirectCard,
            {
              backgroundColor: isDark ? '#0f1c30' : '#F1F5F9',
              borderColor: isDark ? '#1e304f' : '#CBD5E1',
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[styles.policyIconCircle, { backgroundColor: 'rgba(218, 165, 32, 0.15)' }]}>
              <MaterialIcons name="policy" size={22} color={theme.primary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: theme.onSurface, fontSize: 14, fontWeight: '800' }}>
                Looking for Platform Legal Policies?
              </Text>
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                Read Boolok Terms of Service, Privacy Policy, Cookie Policy &amp; Disclaimers.
              </Text>
            </View>
          </View>

          <View style={[styles.viewTermsBtn, { backgroundColor: theme.primary }]}>
            <Text style={{ color: '#000000', fontSize: 11.5, fontWeight: '800' }}>
              View Terms →
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 28,
  },
  iconHalo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroPreTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 580,
  },
  waitlistCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 32,
  },
  waitlistInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  emailInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
    outlineStyle: 'none' as any,
  },
  joinBtn: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  roadmapCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  roadmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  roadmapQuarterPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  legalHubRedirectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  policyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewTermsBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
});
