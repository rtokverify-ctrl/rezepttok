import React from 'react';
import CookingScreen from '../../screens/CookingScreen';
import { useGlobal } from '../../context/GlobalContext';

export default function CookingTab() {
    const { userToken } = useGlobal();
    return <CookingScreen userToken={userToken} />;
}
