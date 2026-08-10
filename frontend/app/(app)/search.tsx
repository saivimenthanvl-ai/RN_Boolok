import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Platform, useWindowDimensions, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import Animated, { FadeIn } from 'react-native-reanimated';

// Dummy search results
const MOCK_RESULTS = [
  { id: '1', type: 'property', title: '1240 Commercial Ave, NY', subtitle: 'Office Space • 12,000 sqft • $45k/mo', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c' },
  { id: '2', type: 'legal', title: 'Zoning Update: Mixed-Use Developments (Austin, TX)', subtitle: 'Compliance Alert • Published 2 days ago' },
  { id: '3', type: 'property', title: 'Luxury Waterfront Villa, Bali', subtitle: 'Residential • 4 Beds • 5 Baths • $2.1M', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750' },
  { id: '4', type: 'news', title: 'Interest Rates Expected to Drop by Q4', subtitle: 'Market Analysis • Boolok Insights' },
];

export default function SearchScreen() {
  const { theme, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const filters = ['All', 'Properties', 'Legal', 'News'];

  const filteredResults = MOCK_RESULTS.filter(item => {
    if (!item.title.toLowerCase().includes(query.toLowerCase()) && !item.subtitle.toLowerCase().includes(query.toLowerCase())) return false;
    if (activeFilter === 'Properties' && item.type !== 'property') return false;
    if (activeFilter === 'Legal' && item.type !== 'legal') return false;
    if (activeFilter === 'News' && item.type !== 'news') return false;
    return true;
  });

  const renderItem = ({ item }: { item: any }) => (
    <Pressable 
      style={({ pressed, hovered }: any) => [
        styles.resultCard, 
        { backgroundColor: theme.surface, borderColor: theme.outlineVariant },
        (pressed || hovered) && { borderColor: theme.primary, transform: [{ scale: 1.01 }] }
      ]}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.resultImage} />
      )}
      <View style={styles.resultInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <MaterialIcons 
            name={item.type === 'property' ? 'business' : item.type === 'legal' ? 'gavel' : 'article'} 
            size={16} 
            color={theme.primary} 
            style={{ marginRight: 6 }} 
          />
          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary, textTransform: 'uppercase' }}>
            {item.type}
          </Text>
        </View>
        <Text style={[typography.headlineSm, { color: theme.onSurface, marginBottom: 4 }]}>{item.title}</Text>
        <Text style={{ fontSize: 14, color: theme.onSurfaceVariant }}>{item.subtitle}</Text>
      </View>
    </Pressable>
  );

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(400)}>
      <View style={[styles.container, { backgroundColor: theme.surfaceContainerLowest }]}>
        <View style={styles.contentWrapper}>
          
          {/* Header & Search Bar */}
          <Text style={[typography.headlineLg, { color: theme.onSurface, marginBottom: spacing.md }]}>AI Search Hub</Text>
          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={24} color={theme.outline} style={styles.searchIcon} />
            <TextInput
              style={[
                styles.searchInput,
                { backgroundColor: theme.surface, borderColor: theme.outlineVariant, color: theme.onSurface }
              ]}
              placeholder="Search properties, laws, or market data..."
              placeholderTextColor={theme.outline}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {/* Filters */}
          <View style={styles.filterRow}>
            {filters.map(f => (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[
                  styles.filterChip,
                  { backgroundColor: activeFilter === f ? theme.primary : theme.surfaceContainerHigh }
                ]}
              >
                <Text style={{ color: activeFilter === f ? '#fff' : theme.onSurfaceVariant, fontWeight: '600' }}>{f}</Text>
              </Pressable>
            ))}
          </View>

          {/* Results Area */}
          <Text style={{ color: theme.outline, fontSize: 13, fontWeight: '700', marginBottom: spacing.md }}>
            {filteredResults.length} RESULTS FOUND
          </Text>
          <FlatList
            data={filteredResults}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
          />

        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 800,
    flex: 1,
    padding: spacing.xl,
  },
  searchWrap: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingLeft: 48,
    paddingRight: 20,
    fontSize: 18,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...Platform.select({ web: { transition: 'all 0.2s ease' } as any })
  },
  resultImage: {
    width: 120,
    height: '100%',
    minHeight: 100,
  },
  resultInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
});
