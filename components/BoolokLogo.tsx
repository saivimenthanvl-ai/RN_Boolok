import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const GOLD = '#E7AD17';

type BoolokLogoProps = {
  size?: number;
  color?: string; // controls the center star fill; dots are always gold
};

// Star-in-9-dots mark. Drop-in replacement for the old "B" letter logo —
// same props (size, color) as before, so no changes needed in any screen
// that already renders <BoolokLogo size={...} color={...} />.
export default function BoolokLogo({
  size = 40,
  color = '#0A0F23',
}: BoolokLogoProps) {
  const dot = size * 0.09;
  const positions: [number, number][] = [
    [0, 0], [1, 0], [2, 0],
    [0, 1], [2, 1],
    [0, 2], [1, 2], [2, 2],
  ];

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
        width={size * 0.4}
        height={size * 0.4}
        viewBox="0 0 24 24"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: [
            { translateX: -(size * 0.2) },
            { translateY: -(size * 0.2) },
          ],
        }}
      >
        {/* 5-point star */}
        <Path
          d="M12 1.8 14.9 9.1 22.7 9.6 16.6 14.5 18.7 22.1 12 17.8 5.3 22.1 7.4 14.5 1.3 9.6 9.1 9.1Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}