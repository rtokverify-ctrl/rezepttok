import React from 'react';
import UploadScreen from '../../screens/UploadScreen';
import { useGlobal } from '../../context/GlobalContext';
import { useRouter } from 'expo-router';

export default function UploadTab() {
    const { userToken, loadFeed, loadMyProfile } = useGlobal();
    const router = useRouter();

    const onUploadComplete = () => {
        loadFeed();
        loadMyProfile();
        router.push('/(tabs)/feed');
    };

    return <UploadScreen userToken={userToken} onUploadComplete={onUploadComplete} />;
}
