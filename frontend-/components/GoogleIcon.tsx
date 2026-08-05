// components/GoogleIcon.tsx
// Standard 4-color Google "G" glyph, used in the Google OAuth buttons on
// login.tsx and register.tsx.

import React from 'react';
import Svg, { Path } from 'react-native-svg';

type GoogleIconProps = {
  /** Width/height of the icon, in px. Defaults to 20. */
  size?: number;
};

export default function GoogleIcon({ size = 20 }: GoogleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9
           c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.1-5.1
           C33.6 6 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20
           c0-1.3-.1-2.7-.4-3.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l5.9 4.3C13.8 15.6 18.5 12.4 24 12.4
           c3.1 0 5.8 1.1 8 3l5.1-5.1C33.6 6 29 4 24 4
           c-7.5 0-14 4.3-17.7 10.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5 0 9.5-1.9 12.9-5l-6-5c-1.9 1.4-4.4 2.3-6.9 2.3
           c-5.3 0-9.7-3.3-11.3-7.9l-5.9 4.6C10 39.6 16.5 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.3 4.3-4.3 5.7
           l6 5C40.4 35.5 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </Svg>
  );
}