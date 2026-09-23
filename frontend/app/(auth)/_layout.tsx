import { Redirect, Stack, useSegments } from 'expo-router';

import { useAuth } from '../../context/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();

  // The legal, terms, and forgot-password pages are accessible without forced redirect
  const lastSegment = segments[segments.length - 1];
  const isBypassRedirectPage = lastSegment === 'legal' || lastSegment === 'terms' || lastSegment === 'forgot-password';

  if (isAuthenticated && !isBypassRedirectPage) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#F4F4F6',
        },
      }}
    />
  );
}
