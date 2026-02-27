import React from 'react';
import { useRouter } from 'expo-router';
import AuthScreen from '../screens/AuthScreen';
import { useGlobal } from '../context/GlobalContext';

export default function AuthRoute() {
    const router = useRouter();
    const { handleLogin } = useGlobal();

    const onLoginSuccessAuth = async (token, isNewUser) => {
        await handleLogin(token);
        if (isNewUser) {
            router.replace('/setup');
        } else {
            router.replace('/(tabs)/feed');
        }
    };

    return <AuthScreen onLoginSuccess={onLoginSuccessAuth} />;
}
