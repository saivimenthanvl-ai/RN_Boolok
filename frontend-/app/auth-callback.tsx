// app/auth-callback.tsx
//
// Dedicated landing page for the Google OAuth popup on web. lib/api.ts's
// useWebGoogleAuth sends Google's redirect here (not to "/"), and this
// page's ONLY job is to call WebBrowser.maybeCompleteAuthSession() so the
// popup closes and hands the result back to the window that opened it.
//
// Without this exact file existing, the popup loads a 404 (or your app's
// root/splash) and just sits there forever after you pick a Google
// account — nothing ever closes it.

import { useEffect } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import LoadingScreen from '../components/LoadingScreen';

export default function AuthCallback() {
    useEffect(() => {
        if (Platform.OS === 'web') {
            const WebBrowser = require('expo-web-browser');
            WebBrowser.maybeCompleteAuthSession();
        }
    }, []);

    if (Platform.OS !== 'web') {
        // This route only ever gets hit on web (native uses Play Services
        // directly, no browser redirect involved) — render nothing native-side.
        return (
            <View style={styles.fallback}>
                <Text>Redirecting...</Text>
            </View>
        );
    }

    return <LoadingScreen message="Finishing sign-in..." />;
}

const styles = StyleSheet.create({
    fallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});