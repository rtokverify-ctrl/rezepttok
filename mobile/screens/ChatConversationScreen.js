import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    Image, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGlobal } from '../context/GlobalContext';
import { BASE_URL, THEME_COLOR, getFullUrl } from '../constants/Config';

const ChatConversationScreen = () => {
    const { userToken, myProfileData } = useGlobal();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { conversationId, otherUserId, otherUsername, otherAvatar } = params;

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef(null);
    const wsRef = useRef(null);

    const loadMessages = useCallback(async () => {
        if (!userToken || !conversationId) return;
        try {
            const r = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
                headers: { 'Authorization': `Bearer ${userToken}` },
            });
            const data = await r.json();
            if (Array.isArray(data)) setMessages(data);
        } catch (e) {
            console.log('Messages load error', e);
        } finally {
            setLoading(false);
        }
    }, [userToken, conversationId]);

    // Mark messages as read
    const markAsRead = useCallback(async () => {
        if (!userToken || !conversationId) return;
        try {
            await fetch(`${BASE_URL}/conversations/${conversationId}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userToken}` },
            });
        } catch (e) { /* silent */ }
    }, [userToken, conversationId]);

    // Connect WebSocket for real-time messages
    useEffect(() => {
        if (!userToken) return;

        const wsUrl = BASE_URL.replace('http', 'ws');
        const ws = new WebSocket(`${wsUrl}/ws/chat?token=${userToken}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'new_message' && String(data.conversation_id) === String(conversationId)) {
                    setMessages(prev => [...prev, data.message]);
                    markAsRead();
                }
            } catch (e) { /* ignore parse errors */ }
        };

        ws.onerror = () => { /* silent */ };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [userToken, conversationId, markAsRead]);

    useEffect(() => {
        loadMessages().then(() => markAsRead());
    }, [loadMessages, markAsRead]);

    const sendMessage = async () => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;

        setSending(true);
        setText('');

        // Optimistic update
        const optimisticMsg = {
            id: Date.now(),
            text: trimmed,
            sender_id: myProfileData?.id,
            created_at: new Date().toISOString(),
            read: false,
            _optimistic: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const r = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: trimmed }),
            });
            const serverMsg = await r.json();
            // Replace optimistic with server response
            setMessages(prev =>
                prev.map(m => m.id === optimisticMsg.id ? serverMsg : m)
            );
        } catch (e) {
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setText(trimmed); // Restore text
            console.log('Send error', e);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (isoString) => {
        try {
            const d = new Date(isoString);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const renderMessage = ({ item }) => {
        const isMe = item.sender_id === myProfileData?.id;
        return (
            <View style={[styles.messageBubbleRow, isMe ? styles.myRow : styles.otherRow]}>
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble, item._optimistic && styles.optimisticBubble]}>
                    <Text style={[styles.bubbleText, isMe ? styles.myBubbleText : styles.otherBubbleText]}>
                        {item.text}
                    </Text>
                    <View style={styles.bubbleMeta}>
                        <Text style={[styles.timeLabel, isMe ? styles.myTimeLabel : styles.otherTimeLabel]}>
                            {formatTime(item.created_at)}
                        </Text>
                        {isMe && (
                            <Ionicons
                                name={item.read ? 'checkmark-done' : 'checkmark'}
                                size={14}
                                color={item.read ? THEME_COLOR : '#888'}
                                style={{ marginLeft: 4 }}
                            />
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={THEME_COLOR} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                {otherAvatar ? (
                    <Image source={{ uri: getFullUrl(otherAvatar) }} style={styles.headerAvatar} />
                ) : (
                    <View style={styles.headerAvatarPlaceholder}>
                        <Ionicons name="person" size={18} color="#888" />
                    </View>
                )}
                <Text style={styles.headerUsername}>{otherUsername}</Text>
            </View>

            {/* Messages */}
            {messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-ellipses-outline" size={60} color="#333" />
                    <Text style={styles.emptyText}>Sag Hallo! 👋</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                />
            )}

            {/* Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Nachricht..."
                    placeholderTextColor="#555"
                    value={text}
                    onChangeText={setText}
                    multiline
                    maxLength={2000}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                    onPress={sendMessage}
                    disabled={!text.trim() || sending}
                >
                    <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
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
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backBtn: {
        marginRight: 12,
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    headerAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerUsername: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
    messagesList: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
    },
    messageBubbleRow: {
        marginBottom: 6,
        flexDirection: 'row',
    },
    myRow: {
        justifyContent: 'flex-end',
    },
    otherRow: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '78%',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 18,
    },
    myBubble: {
        backgroundColor: THEME_COLOR,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: '#1c1c1e',
        borderBottomLeftRadius: 4,
    },
    optimisticBubble: {
        opacity: 0.7,
    },
    bubbleText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myBubbleText: {
        color: 'white',
    },
    otherBubbleText: {
        color: '#eee',
    },
    bubbleMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 3,
    },
    timeLabel: {
        fontSize: 11,
    },
    myTimeLabel: {
        color: 'rgba(255,255,255,0.6)',
    },
    otherTimeLabel: {
        color: '#555',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#444',
        fontSize: 16,
        marginTop: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        paddingBottom: Platform.OS === 'ios' ? 34 : 10,
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
        backgroundColor: '#000',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#1c1c1e',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: 'white',
        fontSize: 15,
        maxHeight: 100,
        marginRight: 8,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        opacity: 0.4,
    },
});

export default ChatConversationScreen;
