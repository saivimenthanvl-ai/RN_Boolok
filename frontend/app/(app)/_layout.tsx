import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Image, Platform, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, Slot, router, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import BoolokLogo from '../../components/BoolokLogo';
import LoadingScreen from '../../components/LoadingScreen';

const MD_BREAKPOINT = 768;

const NAV_ITEMS = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', route: '/(app)/dashboard' },
  { id: 'feed', icon: 'forum', label: 'Social Feed', route: '/(app)/feed' },
  { id: 'search', icon: 'search', label: 'AI Search', route: '/(app)/search' },
  { id: 'insights', icon: 'dynamic-feed', label: 'Insights Feed', route: '/(app)/insights' },
  { id: 'predictions', icon: 'trending-up', label: 'Price Predictions', route: '/(app)/predictions' },
  { id: 'legal', icon: 'gavel', label: 'Legal AI', route: '/(app)/legal' },
  { id: 'blueprint', icon: 'architecture', label: 'Blueprint Gen', route: '/(app)/blueprint' },
];

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= MD_BREAKPOINT;
  // FIX: isAuthenticated now exists on AuthContextType (added in
  // context/AuthContext.tsx). `loading` is used below so we don't redirect
  // to /login while the session is still being restored from
  // SecureStore/localStorage on first load — without this guard, every
  // page refresh on web would flash straight to the login screen even for
  // an already-logged-in user, because token/user start out null before
  // the async restore finishes.
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const { theme, isDark, toggleTheme } = useTheme();

  // Animation for the dark mode icon
  const rotation = useSharedValue(isDark ? 180 : 0);
  useEffect(() => {
    rotation.value = withSpring(isDark ? 180 : 0, { damping: 12 });
  }, [isDark]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const sidebarWidth = useSharedValue(80);
  const expandOpacity = useSharedValue(0);

  useEffect(() => {
    sidebarWidth.value = withTiming(isSidebarHovered ? 260 : 80, { duration: 300 });
    expandOpacity.value = withTiming(isSidebarHovered ? 1 : 0, { duration: 300 });
  }, [isSidebarHovered]);

  const animatedSidebarStyle = useAnimatedStyle(() => ({
    width: sidebarWidth.value,
  }));
  const animatedExpandStyle = useAnimatedStyle(() => ({
    opacity: expandOpacity.value,
  }));

  const Sidebar = () => (
    <Animated.View
      style={[styles.sidebar, animatedSidebarStyle, { backgroundColor: theme.surfaceContainerLowest, borderRightColor: theme.outlineVariant, overflow: 'hidden' }]}
      onPointerEnter={() => setIsSidebarHovered(true)}
      onPointerLeave={() => setIsSidebarHovered(false)}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedExpandStyle, { zIndex: -1 }]}>
        <LinearGradient
          colors={isDark ? ['transparent', 'rgba(218, 165, 32, 0.1)'] : ['transparent', 'rgba(218, 165, 32, 0.05)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Brand Header */}
      <View style={[styles.brandRow, { width: 260 }]}>
        <View style={{ width: 80, alignItems: 'center', justifyContent: 'center' }}>
          <BoolokLogo size={32} color={theme.primary} />
        </View>
        <Animated.View style={[{ width: 160 }, animatedExpandStyle]}>
          <Text style={[typography.headlineSm, { color: theme.primary, lineHeight: 28 }]} numberOfLines={1}>BOOLOK</Text>
          <Text style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: theme.outline, marginTop: -4 }} numberOfLines={1}>Intelligent Precision</Text>
        </Animated.View>
      </View>

      {/* Agent Active Badge */}
      <Animated.View style={[styles.agentBadge, { backgroundColor: 'rgba(218, 165, 32, 0.1)', borderColor: 'rgba(218, 165, 32, 0.2)', width: 228 }, animatedExpandStyle]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <MaterialIcons name="auto-awesome" size={14} color={theme.primary} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 }} numberOfLines={1}>
            Agent Active
          </Text>
        </View>
        <Text style={{ fontSize: 9, color: theme.onSurfaceVariant, fontWeight: '500' }} numberOfLines={1}>Scanning 16K+ Land Opportunities</Text>
      </Animated.View>

      {/* Navigation */}
      <View style={[styles.navContainer, { width: 260 }]}>
        {NAV_ITEMS.map((item) => {
          const publicRoute = item.route.replace('/(app)', '');
          const isActive = pathname === item.route || pathname === publicRoute || pathname.startsWith(`${publicRoute}/`);
          return (
            <Pressable
              key={item.id}
              style={({ pressed, hovered }: any) => [
                styles.navItem,
                isActive && { backgroundColor: 'rgba(218, 165, 32, 0.15)' },
                (pressed || hovered) && !isActive && { backgroundColor: 'rgba(218, 165, 32, 0.05)' },
              ]}
              onPress={() => router.push(item.route as any)}
            >
              {({ hovered, pressed }: any) => {
                const color = isActive || hovered || pressed ? theme.primary : theme.onSurfaceVariant;
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: 260 }}>
                    {isActive && (
                      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: theme.primary, borderTopRightRadius: 4, borderBottomRightRadius: 4, zIndex: 10 }} />
                    )}
                    <View style={{ width: 80, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons
                        name={item.icon as any}
                        size={24}
                        color={color}
                      />
                    </View>
                    <Animated.Text style={[typography.labelMd, { color: color, fontSize: 15, width: 140 }, animatedExpandStyle]} numberOfLines={1}>
                      {item.label}
                    </Animated.Text>
                  </View>
                );
              }}
            </Pressable>
          );
        })}
      </View>

      {/* Bottom Actions */}
      <View style={[styles.sidebarBottom, { width: 260 }]}>

        <Animated.View style={[styles.proPlanCard, { backgroundColor: theme.surfaceContainerHigh, borderColor: 'rgba(218, 165, 32, 0.1)', width: 228, marginLeft: spacing.md }, animatedExpandStyle]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: theme.primary, textTransform: 'uppercase', marginBottom: 2 }} numberOfLines={1}>Pro Plan</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.onSurface, marginBottom: spacing.sm }} numberOfLines={1}>Unlock Global Data</Text>
          <Pressable
            style={({ pressed, hovered }: any) => [
              styles.upgradeBtn,
              { backgroundColor: theme.primary },
              (pressed || hovered) && { transform: [{ scale: 0.98 }] }
            ]}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.onPrimary }} numberOfLines={1}>Upgrade to Pro</Text>
          </Pressable>
        </Animated.View>

        <Pressable
          style={({ pressed, hovered }: any) => [styles.bottomLink, (pressed || hovered) && { opacity: 0.7 }]}
          onPress={() => { }}
        >
          <View style={{ width: 80, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="help" size={24} color={theme.onSurfaceVariant} />
          </View>
          <Animated.Text style={[typography.labelMd, { color: theme.onSurfaceVariant, width: 140 }, animatedExpandStyle]} numberOfLines={1}>Help</Animated.Text>
        </Pressable>

        <Pressable
          style={({ pressed, hovered }: any) => [styles.bottomLink, (pressed || hovered) && { opacity: 0.7 }]}
          onPress={handleLogout}
        >
          <View style={{ width: 80, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="logout" size={24} color={theme.error} />
          </View>
          <Animated.Text style={[typography.labelMd, { color: theme.error, width: 140 }, animatedExpandStyle]} numberOfLines={1}>Logout</Animated.Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  const handleGlobalSearch = () => {
    if (!headerSearchQuery.trim()) return;
    if (Platform.OS === 'web') {
      window.alert(`Global Search: ${headerSearchQuery}`);
    } else {
      Alert.alert('Global Search', `Searching for: ${headerSearchQuery}`);
    }
  };

  const DUMMY_RESULTS = [
    '3BR Luxury Condo Downtown',
    'Waterfront Villa under 2M',
    'Kyoto Forest Estate',
    'Client: John Doe Investments',
    'Regulation Z Compliance Update',
    'New York Zoning Laws 2026'
  ];

  const filteredResults = headerSearchQuery
    ? DUMMY_RESULTS.filter(r => r.toLowerCase().includes(headerSearchQuery.toLowerCase()))
    : [];

  const BottomNav = () => {
    const insets = useSafeAreaInsets();
    return (
      <View style={[styles.bottomNav, { backgroundColor: theme.surfaceContainerLowest, borderTopColor: theme.outlineVariant, paddingBottom: Math.max(insets.bottom, 10) }]}>
        {NAV_ITEMS.slice(0, 5).map(item => {
          const publicRoute = item.route.replace('/(app)', '');
          const isActive = pathname === item.route || pathname === publicRoute || pathname.startsWith(`${publicRoute}/`);

          let mobileLabel = item.label;
          if (item.id === 'dashboard') mobileLabel = 'Home';
          if (item.id === 'feed') mobileLabel = 'Social';
          if (item.id === 'insights') mobileLabel = 'Reels';
          if (item.id === 'predictions') mobileLabel = 'Trends';
          if (item.id === 'search') mobileLabel = 'Search';
          if (item.id === 'legal') mobileLabel = 'Legal';

          return (
            <Pressable
              key={item.id}
              style={styles.bottomNavItem}
              onPress={() => router.push(item.route as any)}
            >
              <MaterialIcons name={item.icon as any} size={24} color={isActive ? theme.primary : theme.onSurfaceVariant} />
              <Text style={{ fontSize: 10, marginTop: 4, color: isActive ? theme.primary : theme.onSurfaceVariant, fontWeight: isActive ? '700' : '500' }}>
                {mobileLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const insets = useSafeAreaInsets();

  // FIX: wait for the session-restore check to finish before deciding to
  // redirect. Previously this only checked `isAuthenticated`, which is
  // false during the brief window where AuthProvider is still reading
  // SecureStore/localStorage — causing an immediate bounce to /login on
  // every refresh even for a valid session.
  if (loading) {
    return <LoadingScreen message="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      {isWide && <Sidebar />}
      <View style={styles.mainContent}>
        {/* INLINED HEADER TO PREVENT FOCUS LOSS */}
        <View style={[styles.header, {
          paddingHorizontal: isWide ? spacing.xl : spacing.md,
          borderBottomColor: theme.outlineVariant,
          backgroundColor: isDark ? 'rgba(10, 15, 35, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          paddingTop: insets.top,
          height: 80 + insets.top
        }]}>
          <View style={{ flexShrink: 1, marginRight: 8 }}>
            <Text style={[typography.headlineSm, { color: theme.onSurface }]} numberOfLines={1}>Welcome back, {user?.fullName?.split(' ')[0] || 'Agent'}</Text>
            <Text style={{ fontSize: 12, color: theme.onSurfaceVariant, fontWeight: '500' }}>Your intelligent real-estate workspace</Text>
          </View>

          {isWide && (
            <View style={{ position: 'relative', flex: 1, maxWidth: 600, marginHorizontal: spacing.xl, zIndex: 50 }}>
              <View style={[styles.searchBar, { backgroundColor: theme.surfaceContainerLowest, borderColor: theme.outlineVariant }]}>
                <MaterialIcons name="search" size={20} color={theme.outline} />
                <TextInput
                  style={{ color: theme.onSurface, marginLeft: 8, fontSize: 14, flex: 1, height: '100%', outlineStyle: 'none' } as any}
                  placeholder="Global search properties, clients, or laws..."
                  placeholderTextColor={theme.outline}
                  value={headerSearchQuery}
                  onChangeText={setHeaderSearchQuery}
                  onSubmitEditing={handleGlobalSearch}
                />
              </View>

              {/* Autocomplete Dropdown */}
              {headerSearchQuery.length > 0 && (
                <View style={[styles.autocompleteDropdown, { backgroundColor: theme.surface, borderColor: theme.outlineVariant }]}>
                  {filteredResults.length > 0 ? (
                    filteredResults.map((result, idx) => (
                      <Pressable
                        key={idx}
                        style={({ pressed, hovered }: any) => [
                          styles.dropdownItem,
                          (pressed || hovered) && { backgroundColor: theme.surfaceContainerLowest }
                        ]}
                        onPress={() => {
                          setHeaderSearchQuery(result);
                          if (Platform.OS === 'web') {
                            window.alert(`Navigating to: ${result}`);
                          } else {
                            Alert.alert('Navigating', `Going to: ${result}`);
                          }
                          setHeaderSearchQuery('');
                        }}
                      >
                        <MaterialIcons name="search" size={16} color={theme.onSurfaceVariant} style={{ marginRight: 8 }} />
                        <Text style={{ color: theme.onSurface, fontSize: 14 }}>{result}</Text>
                      </Pressable>
                    ))
                  ) : (
                    <View style={styles.dropdownItem}>
                      <Text style={{ color: theme.onSurfaceVariant, fontSize: 14 }}>No results found</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn}>
              <MaterialIcons name="notifications" size={24} color={theme.onSurfaceVariant} />
              <View style={[styles.notificationDot, { backgroundColor: theme.primary, borderColor: theme.surface }]} />
            </Pressable>

            <Pressable onPress={toggleTheme} style={styles.iconBtn}>
              <Animated.View style={animatedIconStyle}>
                <MaterialIcons name={isDark ? "dark-mode" : "light-mode"} size={24} color={theme.onSurfaceVariant} />
              </Animated.View>
            </Pressable>

            {isWide && (
              <Pressable
                style={({ pressed, hovered }: any) => [
                  styles.upgradeBtnSmall,
                  (pressed || hovered) ? { backgroundColor: theme.primary } : { backgroundColor: 'rgba(218, 165, 32, 0.1)', borderColor: 'rgba(218, 165, 32, 0.2)' }
                ]}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primary }}>Upgrade Pro</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => router.push('/(app)/profile')}
              style={({ pressed, hovered }: any) => [
                styles.profileSection,
                { borderLeftColor: theme.outlineVariant },
                (pressed || hovered) && { backgroundColor: theme.surfaceContainerLowest }
              ]}
            >
              {isWide && (
                <View style={{ alignItems: 'flex-end', marginRight: spacing.sm }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.onSurface }}>{user?.fullName?.split(' ')[0] || 'Agent'}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: theme.primary, textTransform: 'uppercase' }}>Elite Agent</Text>
                </View>
              )}

              {user?.profilePicture ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImage, { backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }]}>
                  <Text style={{ color: theme.onPrimary, fontSize: 18, fontWeight: 'bold' }}>
                    {(user?.fullName || 'Agent').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={() => router.push('/(app)/settings')}
                style={({ pressed, hovered }: any) => [
                  { marginLeft: spacing.sm, padding: 4, borderRadius: 20, flexShrink: 0 },
                  (pressed || hovered) && { backgroundColor: theme.surfaceContainer }
                ]}
              >
                <MaterialIcons name="settings" size={24} color={theme.onSurfaceVariant} />
              </Pressable>
            </Pressable>
          </View>
        </View>

        <View style={[styles.slotContainer, { backgroundColor: theme.surface }]}>
          <Slot />
        </View>

        {!isWide && <BottomNav />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    height: '100%',
    borderRightWidth: 1,
    paddingVertical: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    ...Platform.select({ web: { transition: 'all 0.3s ease' } as any }),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    marginBottom: spacing.xl,
  },
  agentBadge: {
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  navContainer: {
    flex: 1,
  },
  navItem: {
    paddingVertical: 14,
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({ web: { transition: 'all 0.2s ease' } as any }),
  },
  sidebarBottom: {
    paddingRight: spacing.md,
    paddingTop: spacing.md,
  },
  proPlanCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  upgradeBtn: {
    borderRadius: radius.lg,
    paddingVertical: 8,
    alignItems: 'center',
    ...Platform.select({ web: { transition: 'transform 0.2s ease' } as any }),
  },
  bottomLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    ...Platform.select({ web: { transition: 'opacity 0.2s ease' } as any }),
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    height: 80,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    zIndex: 10,
    ...Platform.select({ web: { transition: 'all 0.3s ease' } as any }),
  },
  searchBar: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    ...Platform.select({ web: { transition: 'all 0.3s ease' } as any }),
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    elevation: 8,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  autocompleteDropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
    marginRight: 4,
    borderRadius: 20,
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  upgradeBtnSmall: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: spacing.md,
    ...Platform.select({ web: { transition: 'all 0.2s ease' } as any }),
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    paddingLeft: spacing.md,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(218, 165, 32, 0.3)',
  },
  slotContainer: {
    flex: 1,
    ...Platform.select({ web: { transition: 'background-color 0.3s ease' } as any }),
  }
});