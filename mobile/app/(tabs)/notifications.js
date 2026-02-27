import React from 'react';
import NotificationScreen from '../../screens/NotificationScreen';
import { useGlobal } from '../../context/GlobalContext';

export default function NotificationsTab() {
    const { userToken } = useGlobal();
    return <NotificationScreen userToken={userToken} />;
}
