// components/BoolokLogo.tsx
// Brand mark for BOOLOK GPT. Renders a monogram "B" inside a rounded
// square, matching the gold-on-black mark used in the dashboard sidebar
// screenshots and the auth screens' brand panel.

import React from 'react';
import Svg, { Rect, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../constants/theme';

type BoolokLogoProps = {
  /** Width/height of the square logo, in px. Defaults to 40. */
  size?: number;
  /** Color of the monogram glyph. Defaults to theme primary (gold). */
  color?: string;
  /** Background square color. Defaults to transparent (no backing shape). */
  backgroundColor?: string;
  /** Renders the gold gradient background used on dark surfaces. */
  filled?: boolean;
};

export default function BoolokLogo({
  size = 40,
  color = colors.primary,
  backgroundColor,
  filled = false,
}: BoolokLogoProps) {
  const radius = size * 0.28;

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Defs>
        <LinearGradient id="boolokGrad" x1="0" y1="0" x2="40" y2="40">
          <Stop offset="0" stopColor={colors.primary} />
          <Stop offset="1" stopColor="#B8860B" />
        </LinearGradient>
      </Defs>

      {(filled || backgroundColor) && (
        <Rect
          x={0}
          y={0}
          width={40}
          height={40}
          rx={radius}
          fill={backgroundColor ?? 'url(#boolokGrad)'}
        />
      )}

      {/* Monogram: stylized "B" built from two overlapping arcs + spine,
          echoing a keyhole / location-pin motif for "real estate". */}
      <Path
        d="M13 8.5H21.2C24 8.5 26 10.4 26 13C26 15 24.8 16.4 23.1 17
           C25.2 17.5 27 19.1 27 21.6C27 24.5 24.8 26.5 21.6 26.5H13V8.5Z
           M16.4 11.6V15.8H20.6C22 15.8 22.8 15 22.8 13.7C22.8 12.4 22 11.6 20.6 11.6H16.4Z
           M16.4 19V23.4H21C22.6 23.4 23.6 22.5 23.6 21.2C23.6 19.9 22.6 19 21 19H16.4Z"
        fill={filled || backgroundColor ? '#ffffff' : color}
        fillRule="evenodd"
      />
    </Svg>
  );
}