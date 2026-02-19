import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, THEME_COLOR, getFullUrl } from '../constants/Config';

const NotificationScreen = ({ userToken }) => {
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const r = await fetch(`${BASE_URL}/notifications`, { headers: { 'Authorization': 'Bearer ' + userToken } });
            const d = await r.json();
            setNotifications(d);
        } catch (e) {
            console.log(e);
        } finally {
            setLoadingNotifications(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'black', paddingTop: 40 }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' }}>
                <Text style={styles.headerTitle}>Mitteilungen 🔔</Text>
            </View>
            {loadingNotifications ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={THEME_COLOR} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                    renderItem={({ item }) => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' }}>
                            <View style={{ position: 'relative', marginRight: 15 }}>
                                {item.actor_avatar ? <Image source={{ uri: getFullUrl(item.actor_avatar) }} style={{ width: 50, height: 50, borderRadius: 25 }} /> : <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}><Ionicons name="person" size={24} color="#666" /></View>}
                                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'black', borderRadius: 10, padding: 2 }}>
                                    <Ionicons name={item.type === 'like' ? 'heart' : item.type === 'follow' ? 'person-add' : 'chatbubble'} size={16} color={item.type === 'like' ? '#ff4d4d' : THEME_COLOR} />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.actor_name} <Text style={{ fontWeight: 'normal', color: '#ccc' }}>{item.type === 'like' ? 'gefällt dein Video.' : item.type === 'follow' ? 'folgt dir jetzt.' : 'hat kommentiert.'}</Text></Text>
                                <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>vor {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'kurzem'}</Text>
                            </View>
                            {item.video_thumbnail && <Image source={{ uri: `${BASE_URL}${item.video_thumbnail}` }} style={{ width: 50, height: 50, borderRadius: 8 }} />}
                        </View>
                    )}
                    ListEmptyComponent={<View style={{ padding: 50, alignItems: 'center' }}><Text style={{ color: '#666' }}>Keine neuen Nachrichten.</Text></View>}
                    refreshing={loadingNotifications}
                    onRefresh={loadNotifications}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
});

export default NotificationScreen;
