import React from 'react';
import { useRouter } from 'expo-router';
import SetupScreen from '../screens/SetupScreen';
import { useGlobal } from '../context/GlobalContext';

export default function SetupRoute() {
    const router = useRouter();
    const { userToken, myProfileData } = useGlobal();

    const onSetupComplete = () => {
        router.replace('/(tabs)/feed');
    };

    return (
        <SetupScreen
            userToken={userToken}
            initialDisplayName={myProfileData?.username || myProfileData?.display_name}
            onSetupComplete={onSetupComplete}
        />
    );
}
