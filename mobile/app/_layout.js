import { Stack } from 'expo-router';
import { GlobalProvider } from '../context/GlobalContext';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
        PlusJakartaSans_800ExtraBold,
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <GlobalProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { fontFamily: 'PlusJakartaSans_400Regular' } }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="setup" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="chat" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="conversation" options={{ animation: 'slide_from_right' }} />
            </Stack>
        </GlobalProvider>
    );
}
