import { Stack } from 'expo-router';
import { GlobalProvider } from '../context/GlobalContext';

export default function RootLayout() {
    return (
        <GlobalProvider>
            <Stack screenOptions={{ headerShown: false }}>
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
