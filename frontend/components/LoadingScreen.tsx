import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BoolokLogo from './BoolokLogo';
import { useTheme } from '../context/ThemeContext';

type LoadingScreenProps = {
  /** Optional status text (ignored for clean logo presentation) */
  message?: string;
  /** Dark mode flag */
  dark?: boolean;
};

export default function LoadingScreen({
  dark,
}: LoadingScreenProps) {
  const { isDark } = useTheme();
  const effectiveDark = dark !== undefined ? dark : isDark;

  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 1.12,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 0.96,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [pulse, opacity]);

  const bg = effectiveDark ? '#060b13' : '#ffffff';
  const logoColor = effectiveDark ? '#ffffff' : '#0f172a';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]}>
      <View style={styles.center}>
        <Animated.View
          style={{
            transform: [{ scale: pulse }],
            opacity: opacity,
          }}
        >
          <BoolokLogo size={76} color={logoColor} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});