import React from 'react';
import SearchScreen from '../../screens/SearchScreen';
import { useGlobal } from '../../context/GlobalContext';
import { useRouter } from 'expo-router';

export default function SearchTab() {
    const { userToken } = useGlobal();
    const router = useRouter();

    return <SearchScreen userToken={userToken} navigation={{ navigate: (screen) => router.push(`/(tabs)/${screen}`) }} />;
}
