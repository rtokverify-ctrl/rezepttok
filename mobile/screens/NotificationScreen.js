import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity, StyleSheet, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL,  getFullUrl } from '../constants/Config';
import { useGlobal } from '../context/GlobalContext';

// ── Relative Time Helper ────────────────────────────────────────────
const timeAgo = (isoString) => {
    if (!isoString) return '';
    try {
        const now = new Date();
        const date = new Date(isoString);
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'Gerade eben';
        if (diffMin < 60) return `vor ${diffMin} Min`;
        if (diffHour < 24) return `vor ${diffHour} Std`;
        if (diffDay === 1) return 'Gestern';
        if (diffDay < 7) return `vor ${diffDay} Tagen`;
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    } catch {
        return '';
    }
};

const getSection = (isoString) => {
    if (!isoString) return 'Älter';
    try {
        const now = new Date();
        const date = new Date(isoString);
        const diffMs = now - date;
        const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDay = Math.floor(diffHour / 24);

        if (diffDay === 0) return 'Heute';
        if (diffDay === 1) return 'Gestern';
        if (diffDay < 7) return 'Diese Woche';
        return 'Älter';
    } catch {
        return 'Älter';
    }
};

const NOTIF_ICONS = {
    like: { name: 'heart', color: '#ff4d4d' },
    follow: { name: 'person-add', color: themeColor },
    comment: { name: 'chatbubble', color: themeColor },
};

const NOTIF_TEXT = {
    like: 'gefällt dein Rezept',
    follow: 'folgt dir jetzt',
    comment: 'hat kommentiert',
};

const NotificationScreen = ({ userToken }) => {
    const { themeColor } = useGlobal();
    const styles = getStyles(themeColor);

    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const r = await fetch(`${BASE_URL}/notifications`, { headers: { 'Authorization': 'Bearer ' + userToken } });
            const d = await r.json();
            setNotifications(Array.isArray(d) ? d : []);
        } catch (e) {
            console.log(e);
        } finally {
            setLoadingNotifications(false);
        }
    };

    // Group by section
    const sections = [];
    const grouped = {};
    notifications.forEach(n => {
        const section = getSection(n.created_at);
        if (!grouped[section]) grouped[section] = [];
        grouped[section].push(n);
    });
    ['Heute', 'Gestern', 'Diese Woche', 'Älter'].forEach(key => {
        if (grouped[key]?.length) sections.push({ title: key, data: grouped[key] });
    });

    const renderItem = ({ item }) => {
        const icon = NOTIF_ICONS[item.type] || NOTIF_ICONS.like;
        const text = NOTIF_TEXT[item.type] || '';

        return (
            <View style={styles.notifItem}>
                <View style={styles.avatarContainer}>
                    {item.actor_avatar ? (
                        <Image source={{ uri: getFullUrl(item.actor_avatar) }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={22} color="#555" />
                        </View>
                    )}
                    <View style={[styles.iconBadge, { backgroundColor: icon.color }]}>
                        <Ionicons name={icon.name} size={12} color="white" />
                    </View>
                </View>
                <View style={styles.notifContent}>
                    <Text style={styles.notifText}>
                        <Text style={styles.notifActor}>{item.actor_name} </Text>
                        {text}
                    </Text>
                    <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mitteilungen</Text>
            </View>
            {loadingNotifications ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={themeColor} />
                </View>
            ) : sections.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={70} color="#333" />
                    <Text style={styles.emptyTitle}>Alles ruhig hier</Text>
                    <Text style={styles.emptySubtitle}>Wenn jemand dein Rezept liked, kommentiert oder dir folgt, siehst du es hier.</Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                    renderItem={renderItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionHeaderText}>{title}</Text>
                        </View>
                    )}
                    refreshing={loadingNotifications}
                    onRefresh={loadNotifications}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}
        </View>
    );
};

const getStyles = (themeColor) => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 55, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
    headerTitle: { color: 'white', fontSize: 28, fontWeight: '800' },

    sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
    sectionHeaderText: { color: '#666', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

    notifItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
    avatarContainer: { position: 'relative', marginRight: 14 },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
    iconBadge: {
        position: 'absolute', bottom: -2, right: -2,
        width: 22, height: 22, borderRadius: 11,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#000',
    },
    notifContent: { flex: 1 },
    notifText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
    notifActor: { color: 'white', fontWeight: '700' },
    notifTime: { color: '#555', fontSize: 12, marginTop: 4 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { color: '#555', fontSize: 20, fontWeight: '600', marginTop: 16 },
    emptySubtitle: { color: '#444', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default NotificationScreen;
