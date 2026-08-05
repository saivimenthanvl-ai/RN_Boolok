import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../constants/theme';

export default function BoolokLogo({ size = 64, color = colors.inverseSurface }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <Circle cx="10" cy="10" r="6" fill={colors.primary} />
      <Circle cx="40" cy="10" r="6" fill={colors.primary} />
      <Circle cx="70" cy="10" r="6" fill={colors.primary} />
      <Circle cx="10" cy="40" r="6" fill={colors.primary} />
      <Circle cx="70" cy="40" r="6" fill={colors.primary} />
      <Circle cx="10" cy="70" r="6" fill={colors.primary} />
      <Circle cx="40" cy="70" r="6" fill={colors.primary} />
      <Circle cx="70" cy="70" r="6" fill={colors.primary} />
      <Path
        transform="translate(27,27)"
        d="M 13.0 0.0 Q 13.88 8.21 16.21 8.58 Q 21.95 8.15 25.36 8.98 Q 17.83 12.36 18.19 14.69 Q 20.38 20.02 20.64 23.52 Q 15.1 17.39 13.0 18.46 Q 8.61 22.19 5.36 23.52 Q 9.47 16.36 7.81 14.69 Q 2.91 11.66 0.64 8.98 Q 8.72 10.68 9.79 8.58 Q 11.15 2.99 13.0 0.0 Z"
        fill={color}
      />
    </Svg>
  );
}