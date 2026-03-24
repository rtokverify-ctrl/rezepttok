import React from 'react';
import TagResultScreen from '../../screens/TagResultScreen';
import { useGlobal } from '../../context/GlobalContext';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function TagRoute() {
    const { tag } = useLocalSearchParams();
    const { userToken } = useGlobal();
    const router = useRouter();

    return <TagResultScreen userToken={userToken} tag={tag} onBack={() => router.back()} />;
}
