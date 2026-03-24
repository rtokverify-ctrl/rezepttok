import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, Image,
    StyleSheet, RefreshControl, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGlobal } from '../context/GlobalContext';
import { BASE_URL,  getFullUrl } from '../constants/Config';

const ChatScreen = () => {
    const { themeColor } = useGlobal();
    const styles = getStyles(themeColor);

    const { userToken } = useGlobal();
    const router = useRouter();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadConversations = useCallback(async () => {
        if (!userToken) return;
        try {
            const r = await fetch(`${BASE_URL}/conversations`, {
                headers: { 'Authorization': `Bearer ${userToken}` },
            });
            const data = await r.json();
            if (Array.isArray(data)) setConversations(data);
        } catch (e) {
            console.log('Chat load error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userToken]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    const onRefresh = () => {
        setRefreshing(true);
        loadConversations();
    };

    const openConversation = (conv) => {
        router.push({
            pathname: '/conversation',
            params: {
                conversationId: conv.id,
                otherUserId: conv.other_user.id,
                otherUsername: conv.other_user.username,
                otherAvatar: conv.other_user.avatar_url || '',
            },
        });
    };

    const formatTime = (isoString) => {
        if (!isoString) return '';
        try {
            const d = new Date(isoString);
            const now = new Date();
            const diffMs = now - d;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays === 0) {
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (diffDays === 1) {
                return 'Gestern';
            } else if (diffDays < 7) {
                return d.toLocaleDateString('de-DE', { weekday: 'short' });
            }
            return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        } catch {
            return '';
        }
    };

    const renderConversation = ({ item }) => (
        <TouchableOpacity style={styles.convItem} onPress={() => openConversation(item)} activeOpacity={0.7}>
            <View style={styles.avatarContainer}>
                {item.other_user.avatar_url ? (
                    <Image source={{ uri: getFullUrl(item.other_user.avatar_url) }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={24} color="#888" />
                    </View>
                )}
                {item.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>
                            {item.unread_count > 99 ? '99+' : item.unread_count}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.convInfo}>
                <View style={styles.convHeader}>
                    <Text style={[styles.username, item.unread_count > 0 && styles.usernameBold]}>
                        {item.other_user.username}
                    </Text>
                    <Text style={styles.timeText}>{formatTime(item.last_message_time)}</Text>
                </View>
                <Text
                    style={[styles.lastMessage, item.unread_count > 0 && styles.lastMessageUnread]}
                    numberOfLines={1}
                >
                    {item.last_message || 'Noch keine Nachrichten'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={themeColor} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nachrichten</Text>
            </View>
            {conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={80} color="#333" />
                    <Text style={styles.emptyTitle}>Noch keine Chats</Text>
                    <Text style={styles.emptySubtitle}>
                        Starte eine Konversation über ein Nutzerprofil!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderConversation}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColor} />
                    }
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const getStyles = (themeColor) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 16,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    listContent: {
        paddingBottom: 100,
    },
    convItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: '#1a1a1a',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    avatarPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: themeColor,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    unreadText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    convInfo: {
        flex: 1,
    },
    convHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    username: {
        color: '#ccc',
        fontSize: 16,
        fontWeight: '500',
    },
    usernameBold: {
        color: 'white',
        fontWeight: '700',
    },
    timeText: {
        color: '#555',
        fontSize: 12,
    },
    lastMessage: {
        color: '#666',
        fontSize: 14,
    },
    lastMessageUnread: {
        color: '#bbb',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: '#555',
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtitle: {
        color: '#444',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
});

export default ChatScreen;
