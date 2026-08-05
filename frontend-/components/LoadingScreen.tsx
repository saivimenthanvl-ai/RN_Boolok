import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import BoolokLogo from './BoolokLogo';
import { useTheme } from '../context/ThemeContext';

export default function LoadingScreen() {
  const { theme } = useTheme();
  
  const pulse = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
      opacity: opacity.value,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceContainerLowest }]}>
      <Animated.View style={[styles.glow, { backgroundColor: theme.primary }, animatedStyle]} />
      <Animated.View style={animatedStyle}>
        <BoolokLogo size={80} color={theme.primary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    ...Platform.select({
      web: { filter: 'blur(40px)' } as any,
      default: {},
    }),
  }
});
