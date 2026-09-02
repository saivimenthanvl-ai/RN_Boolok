import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Image, Platform, ScrollView, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import BoolokLogo from '../../components/BoolokLogo';
import axios from 'axios';
import { API_BASE_URL } from '../../lib/api';

const MD_BREAKPOINT = 768;

const NAV_ITEMS = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', route: '/(app)/dashboard' },
  { id: 'feed', icon: 'forum', label: 'Social Feed', route: '/(app)/feed' },
  { id: 'search', icon: 'search', label: 'AI Search', route: '/(app)/search' },
  { id: 'insights', icon: 'dynamic-feed', label: 'Insights Feed', route: '/(app)/insights' },
  { id: 'predictions', icon: 'trending-up', label: 'Price Predictions', route: '/(app)/predictions' },
  { id: 'legal', icon: 'gavel', label: 'Legal AI', route: '/(app)/legal' },
  { id: 'blueprint', icon: 'home-work', label: 'House Plan', route: '/(app)/blueprint' },
];

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= MD_BREAKPOINT;
  const { user, signOut } = useAuth();
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

  // ── Sidebar hover-expand (overlay — no layout shift) ──────────────────
  const sidebarWidth = useSharedValue(80);
  const expandOpacity = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);

  const handleSidebarEnter = () => {
    sidebarWidth.value = withTiming(264, { duration: 200 });
    expandOpacity.value = withTiming(1, { duration: 160 });
    shadowOpacity.value = withTiming(1, { duration: 200 });
  };

  const handleSidebarLeave = () => {
    sidebarWidth.value = withTiming(80, { duration: 200 });
    expandOpacity.value = withTiming(0, { duration: 110 });
    shadowOpacity.value = withTiming(0, { duration: 150 });
  };

  // The overlay panel expands; the wrapper View stays 80px → zero layout shift
  const animatedSidebarStyle = useAnimatedStyle(() => ({
    width: sidebarWidth.value,
  }));

  // Labels/text fade in after panel starts opening
  const animatedExpandStyle = useAnimatedStyle(() => ({
    opacity: expandOpacity.value,
  }));

  // Fades out the solid background on hover to reveal the glass gradient
  const solidOverlayStyle = useAnimatedStyle(() => ({
    opacity: 1 - expandOpacity.value,
  }));

  // Seamless gradient that fades out perfectly on the right edge
  const glassGradient = isDark
    ? ['rgba(6, 10, 22, 1)', 'rgba(6, 10, 22, 0.98)', 'rgba(6, 10, 22, 0)'] as const
    : ['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0)'] as const;

  const Sidebar = () => (
    // Fixed 80px placeholder in layout — absolutely positioned overlay expands over content
    <View style={styles.sidebarWrapper}>
      <Animated.View
        {...(Platform.OS === 'web' ? {
          onMouseEnter: handleSidebarEnter,
          onMouseLeave: handleSidebarLeave,
        } : {})}
        style={[
          styles.sidebarOverlay,
          animatedSidebarStyle,
          { backgroundColor: 'transparent' },
        ]}
      >
        {/* 1. Low-opacity gradient visible during hover (glass effect) */}
        <LinearGradient
          colors={glassGradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          locations={[0, 0.8, 1]}
          style={[StyleSheet.absoluteFill, { zIndex: -3 }]}
        />

        {/* 2. Solid dark background that fades OUT on hover */}
        <Animated.View style={[StyleSheet.absoluteFill, solidOverlayStyle, { backgroundColor: theme.surfaceContainerLowest, zIndex: -2 }]} />

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
            const isActive = pathname === item.route || pathname === item.route.replace('/(app)', '');
            return (
              <Pressable
                key={item.id}
                style={styles.navItem}
                onPress={() => router.push(item.route as any)}
              >
                {({ hovered, pressed }: any) => {
                  const color = isActive || hovered || pressed ? theme.primary : theme.onSurfaceVariant;
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: 260 }}>
                      {/* Strict text-color only state as requested */}
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
    </View>
  );

  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/notifications`);
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleNotifications = async () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState && unreadCount > 0) {
      try {
        await axios.put(`${API_BASE_URL}/api/users/notifications/read-all`);
        setUnreadCount(0);
      } catch (e) {}
    }
  };

  // Debounced real user search
  useEffect(() => {
    const q = headerSearchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }

    const COMMUNITY_ADVISORS = [
      {
        id: 'shreekutti',
        _id: 'shreekutti',
        fullName: 'shreekutti',
        username: 'shreekutti',
        headline: 'Commercial Property & Tech Park Portfolio Lead @ Boolok Realty',
        location: 'Bangalore, Karnataka · Tech Parks',
        profilePicture: null,
        followerCount: 4,
      },
      {
        id: 'logeshwarana',
        _id: 'logeshwarana',
        fullName: 'Logeshwaran Ashok',
        username: 'logeshwarana',
        headline: 'Architectural Consultant & Real Estate Lead',
        location: 'Chennai, Tamil Nadu · Industrial & Retail',
        profilePicture: null,
        followerCount: 4,
      },
      {
        id: 'ajmal',
        _id: 'ajmal',
        fullName: 'ajmal',
        username: 'ajmal',
        headline: 'Luxury Living & High-End Residential Broker',
        location: 'Dubai & Kochi · Luxury Villas',
        profilePicture: null,
        followerCount: 4,
      },
      {
        id: 'bavadharini_rs',
        _id: 'bavadharini_rs',
        fullName: 'Bavadharini RS',
        username: 'bavadharini_rs',
        headline: 'Interior Designer & Modern Living Specialist',
        location: 'Chennai, Tamil Nadu · Modern Living',
        profilePicture: null,
        followerCount: 4,
      },
      {
        id: 'the_akshtr_estate',
        _id: 'the_akshtr_estate',
        fullName: 'Akshat Commercials',
        username: 'the_akshtr_estate',
        headline: 'Commercial Property & Tech Park Portfolio Lead',
        location: 'Chennai, Tamil Nadu · Prime Assets',
        profilePicture: null,
        followerCount: 4,
      },
      {
        id: 'prasanth_properties',
        _id: 'prasanth_properties',
        fullName: 'Prasanth Properties',
        username: 'prasanth_properties',
        headline: 'Luxury Waterfront Specialist · Miami & Coastal Estates',
        location: 'Miami, Florida · Coastal Estates',
        profilePicture: null,
        followerCount: 4,
      },
    ];

    const localMatches = COMMUNITY_ADVISORS.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.username.toLowerCase().includes(q) ||
        a.headline.toLowerCase().includes(q) ||
        (a.location && a.location.toLowerCase().includes(q))
    );

    if (user && ((user.fullName && user.fullName.toLowerCase().includes(q)) || (user.username && user.username.toLowerCase().includes(q)))) {
      localMatches.unshift({
        id: user.id || user._id || 'self',
        _id: user.id || user._id || 'self',
        fullName: user.fullName || 'Sai Vimenthan',
        username: user.username || 'saivimenthanvl',
        headline: user.headline || 'Elite Real Estate Broker & Commercial Portfolio Lead',
        location: user.location || 'Chennai, Tamil Nadu · Prime Assets',
        profilePicture: user.profilePicture || null,
        followerCount: user.followerCount || 0,
      });
    }

    setSearchResults(localMatches);

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : null;
        const res = await axios.get(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(q)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data && Array.isArray(res.data.results) && res.data.results.length > 0) {
          const seen = new Set(res.data.results.map((r: any) => (r.username || r.id || r._id).toLowerCase()));
          const combined = [
            ...res.data.results,
            ...localMatches.filter((m) => !seen.has((m.username || m.id).toLowerCase())),
          ];
          setSearchResults(combined);
        }
      } catch (e) {
        // keep localMatches
      } finally {
        setIsSearching(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [headerSearchQuery, user]);

  const handleSelectUser = (targetUser: any) => {
    setHeaderSearchQuery('');
    setSearchResults([]);
    router.push({ pathname: '/(app)/profile', params: { id: targetUser.id || targetUser._id } } as any);
  };

  const handleGlobalSearch = () => {
    if (searchResults.length > 0) {
      handleSelectUser(searchResults[0]);
    }
  };

  const BottomNav = () => {
    const insets = useSafeAreaInsets();
    return (
      <View style={[styles.bottomNavContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <BlurView
          intensity={isDark ? 50 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(10, 15, 35, 0.6)' : 'rgba(255, 255, 255, 0.6)' }]}
        />
        <View style={styles.bottomNavInner}>
          {NAV_ITEMS.slice(0, 5).map(item => {
            const isActive = pathname === item.route || pathname === item.route.replace('/(app)', '');

            // Map labels for mobile
            let mobileLabel = item.label;
            if (item.id === 'dashboard') mobileLabel = 'Home';
            if (item.id === 'feed') mobileLabel = 'Social';
            if (item.id === 'insights') mobileLabel = 'Reels';
            if (item.id === 'predictions') mobileLabel = 'Trends';
            if (item.id === 'search') mobileLabel = 'Search';
            if (item.id === 'legal') mobileLabel = 'Legal';
            if (item.id === 'blueprint') mobileLabel = 'Plan';

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
      </View>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      {isWide && <Sidebar />}
      {/* mainContent fills all remaining space; sidebar overlay floats above it */}
      <View style={styles.mainContent}>
        {/* INLINED HEADER TO PREVENT FOCUS LOSS */}
        <View style={[styles.header, {
          paddingHorizontal: isWide ? spacing.lg : spacing.md,
          borderBottomColor: theme.outlineVariant,
          backgroundColor: isDark ? 'rgba(10, 15, 35, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          paddingTop: insets.top,
          height: 80 + insets.top,
          zIndex: 100,
        }]}>
          <View style={{ flexShrink: 0, minWidth: 160, marginRight: spacing.md }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.onSurface }} numberOfLines={1}>
              Welcome back, {user?.fullName?.split(' ')[0] || 'Sai'}
            </Text>
            <Text style={{ fontSize: 12, color: theme.onSurfaceVariant, fontWeight: '500' }}>Real Estate Intelligence</Text>
          </View>

          {isWide && (
            <View style={{ position: 'relative', flex: 1, maxWidth: 600, marginHorizontal: spacing.xl, zIndex: 100 }}>
              <View style={[styles.searchBar, { backgroundColor: theme.surfaceContainerLowest, borderColor: theme.outlineVariant }]}>
                <MaterialIcons name="search" size={20} color={theme.outline} />
                <TextInput
                  style={{ color: theme.onSurface, marginLeft: 8, fontSize: 14, flex: 1, height: '100%', outlineStyle: 'none' } as any}
                  placeholder="Search agents, brokers, or clients..."
                  placeholderTextColor={theme.outline}
                  value={headerSearchQuery}
                  onChangeText={setHeaderSearchQuery}
                  onSubmitEditing={handleGlobalSearch}
                />
                {isSearching && <Text style={{ fontSize: 11, color: theme.primary, marginRight: 8 }}>Searching...</Text>}
              </View>

              {/* Real-time Autocomplete Dropdown */}
              {headerSearchQuery.trim().length > 0 && (
                <View style={[styles.autocompleteDropdown, { backgroundColor: isDark ? '#0c1626' : '#ffffff', borderColor: theme.outlineVariant, maxHeight: 360, zIndex: 999 }]}>
                  {searchResults.length > 0 ? (
                    searchResults.map((u: any, idx: number) => {
                      const initial = (u.fullName || u.username || 'U')[0]?.toUpperCase();
                      return (
                        <Pressable
                          key={u.id || u._id || idx}
                          style={({ pressed, hovered }: any) => [
                            styles.dropdownItem,
                            { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: idx < searchResults.length - 1 ? 1 : 0, borderBottomColor: isDark ? '#1a273c' : '#f0f0f0' },
                            (pressed || hovered) && { backgroundColor: isDark ? '#162338' : '#f8f9fa' }
                          ]}
                          onPress={() => handleSelectUser(u)}
                        >
                          {u.profilePicture ? (
                            <Image source={{ uri: u.profilePicture }} style={{ width: 34, height: 34, borderRadius: 17, marginRight: 10 }} />
                          ) : (
                            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: isDark ? '#1e293b' : '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#daa520' }}>
                              <Text style={{ color: '#daa520', fontWeight: '700', fontSize: 14 }}>{initial}</Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ color: theme.onSurface, fontSize: 14, fontWeight: '700' }}>{u.fullName}</Text>
                              <MaterialIcons name="verified" size={14} color="#daa520" style={{ marginLeft: 4 }} />
                            </View>
                            <Text style={{ color: theme.onSurfaceVariant, fontSize: 11 }}>@{u.username} · {u.followerCount || 0} followers</Text>
                          </View>
                          <MaterialIcons name="chevron-right" size={18} color={theme.outline} />
                        </Pressable>
                      );
                    })
                  ) : !isSearching ? (
                    <View style={[styles.dropdownItem, { padding: 14 }]}>
                      <Text style={{ color: theme.onSurfaceVariant, fontSize: 13 }}>No users found matching "{headerSearchQuery}"</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          )}

          <View style={styles.headerActions}>
            <View style={{ position: 'relative' }}>
              <Pressable onPress={handleToggleNotifications} style={styles.iconBtn}>
                <MaterialIcons name="notifications" size={24} color={showNotifications ? theme.primary : theme.onSurfaceVariant} />
                {unreadCount > 0 && (
                  <View style={[styles.notificationDot, { backgroundColor: '#ef4444', borderColor: theme.surface, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '800' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </Pressable>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <View style={{
                  position: 'absolute',
                  top: 48,
                  right: 0,
                  width: 320,
                  maxHeight: 400,
                  backgroundColor: isDark ? '#0c1626' : '#ffffff',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.outlineVariant,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  elevation: 10,
                  zIndex: 9999,
                  overflow: 'hidden',
                }}>
                  <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: isDark ? '#1a273c' : '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: theme.onSurface, fontWeight: '800', fontSize: 14 }}>Notifications</Text>
                    <Text style={{ color: theme.onSurfaceVariant, fontSize: 11 }}>Real-time updates</Text>
                  </View>
                  <ScrollView style={{ maxHeight: 320 }}>
                    {notifications.length > 0 ? (
                      notifications.map((n: any, idx: number) => {
                        const sender = n.sender || {};
                        const initial = (sender.fullName || sender.username || 'U')[0]?.toUpperCase();
                        return (
                          <Pressable
                            key={n._id || idx}
                            style={({ pressed, hovered }: any) => [
                              { padding: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#142033' : '#f5f5f5', flexDirection: 'row', alignItems: 'center' },
                              !n.read && { backgroundColor: isDark ? 'rgba(218, 165, 32, 0.08)' : 'rgba(218, 165, 32, 0.05)' },
                              (pressed || hovered) && { backgroundColor: isDark ? '#162338' : '#f8f9fa' },
                            ]}
                            onPress={() => {
                              setShowNotifications(false);
                              if (sender._id || sender.id) {
                                router.push({ pathname: '/(app)/profile', params: { id: sender._id || sender.id } } as any);
                              }
                            }}
                          >
                            {sender.profilePicture ? (
                              <Image source={{ uri: sender.profilePicture }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }} />
                            ) : (
                              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#daa520', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                <Text style={{ color: '#000000', fontWeight: '800', fontSize: 13 }}>{initial}</Text>
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: theme.onSurface, fontSize: 12, lineHeight: 16 }}>{n.message}</Text>
                              <Text style={{ color: theme.outline, fontSize: 10, marginTop: 2 }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                          </Pressable>
                        );
                      })
                    ) : (
                      <View style={{ padding: 24, alignItems: 'center' }}>
                        <MaterialIcons name="notifications-none" size={32} color={theme.outline} style={{ marginBottom: 6 }} />
                        <Text style={{ color: theme.onSurfaceVariant, fontSize: 12 }}>No new notifications</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

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
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
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
  // Fixed 80px placeholder — keeps the layout slot but never changes size
  sidebarWrapper: {
    width: 80,
    height: '100%',
    position: 'relative',
    zIndex: 200,
  },
  // The actual expanding panel — absolutely positioned, floats over content
  sidebarOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    paddingVertical: spacing.md,
    flexDirection: 'column',
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
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    zIndex: 100,
  },
  bottomNavInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
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
